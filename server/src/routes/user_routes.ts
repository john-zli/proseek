import bcrypt from 'bcrypt';
import { Router } from 'express';

import { ensureAuthenticated } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { createUser, generateInvitationCode, getUserByEmail } from '../models/users_storage';
import { CreateUserSchema, InviteUserSchema, LoginUserSchema } from '../schemas/users';
import { logger } from '@server/logger';

const router = Router();

// Create a new user (Registration)
router.post('/', validate(CreateUserSchema), async (req, res) => {
  try {
    const { email, firstName, lastName, gender, password, invitationCode } = req.body;

    const passwordHash = await bcrypt.hash(password, 10);

    const { userId, churchId } = await createUser({
      email,
      firstName,
      lastName,
      gender,
      passwordHash,
      invitationCode,
    });

    req.session.regenerate(err => {
      if (err) {
        logger.error({ err }, 'Error regenerating session after registration');
        res.status(500).json({ error: 'Registration succeeded but session creation failed' });
        return;
      }
      req.session.user = { id: userId, email: email, churchId: churchId };
      res.status(201).json({ userId });
    });
  } catch (error: any) {
    logger.error({ err: error }, 'Error creating user:');

    let statusCode = 500;
    let message = 'Failed to create user';

    if (error.code === '23505') {
      statusCode = 409;
      message = 'User with this email already exists';
    } else if (error.code === 'P0001') {
      statusCode = 400;
      message = 'Invalid or already used invitation code';
    }

    res.status(statusCode).json({ error: message });
  }
});

// User Login
router.post('/login', validate(LoginUserSchema), async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await getUserByEmail(email);

    if (!user || !user.passwordHash) {
      res.status(401).json({ error: 'Invalid email or password' });
      return;
    }

    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);

    if (!isPasswordValid) {
      res.status(401).json({ error: 'Invalid email or password' });
      return;
    }

    // Regenerate session to prevent session fixation attacks
    req.session.regenerate(err => {
      if (err) {
        logger.error({ err }, 'Error regenerating session after login');
        res.status(500).json({ error: 'Login failed' });
        return;
      }

      // Store user information in session, including churchId
      req.session.user = { id: user.userId, email: user.email, churchId: user.churchId };
      // Omit passwordHash before sending user data
      const { passwordHash, ...userWithoutPassword } = user;
      res.status(200).json({ message: 'Login successful', user: userWithoutPassword });
    });
  } catch (error) {
    logger.error({ err: error }, 'Error during user login:');
    res.status(500).json({ error: 'Login failed' });
  }
});

// User Logout
router.post('/logout', (req, res) => {
  req.session.destroy(err => {
    if (err) {
      logger.error({ err }, 'Error destroying session during logout');
      res.status(500).json({ error: 'Logout failed' });
      return;
    }
    res.clearCookie('connect.sid'); // Ensure the session cookie is cleared
    res.status(200).json({ message: 'Logout successful' });
  });
});

// Generate Invitation Code
router.post('/invite', ensureAuthenticated, validate(InviteUserSchema), async (req, res) => {
  // ensureAuthenticated guarantees req.session.user, user.id, and user.churchId exist
  const user = req.session.user!;
  const { id: userId, churchId } = user;
  const { email } = req.body;

  try {
    const invitationCode = await generateInvitationCode(churchId, userId, email);

    // TODO: Send email to `email` with the `invitationCode` (Email: ${email})

    // 3. Return the generated code
    res.status(201).json({ invitationCode });
  } catch (error: any) {
    logger.error({ err: error, userId, churchId }, 'Error generating invitation code:');
    // Check for specific error from the SQL function (e.g., max attempts reached)
    if (error.message?.includes('Could not generate a unique invitation code')) {
      res.status(500).json({ error: 'Failed to generate a unique invitation code. Please try again.' });
      return;
    }
    res.status(500).json({ error: 'Failed to generate invitation code' });
  }
});

// Get Current User (/me endpoint)
router.get('/me', (req, res) => {
  if (req.session.user) {
    // Optionally fetch fresh user data from DB if needed
    res.status(200).json({ user: req.session.user });
  } else {
    res.status(401).json({ error: 'Not authenticated' });
  }
});

export default router;

import bcrypt from 'bcrypt';
import { Router } from 'express';

import { validate } from '../middleware/validate';
import { createUser, getUserByEmail } from '../models/users_storage';
import { CreateUserSchema, LoginUserSchema } from '../schemas/users';
import { logger } from '@server/logger';

const router = Router();

// Create a new user (Registration)
router.post('/', validate(CreateUserSchema), async (req, res) => {
  try {
    const { email, firstName, lastName, churchId, password } = req.body;

    // Check if user already exists
    const existingUser = await getUserByEmail(email);
    if (existingUser) {
      res.status(409).json({ error: 'User with this email already exists' });
      return;
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const userId = await createUser({
      email,
      firstName,
      lastName,
      churchId,
      passwordHash,
    });

    // Log the user in immediately after registration
    req.session.user = { id: userId, email: email };

    res.status(201).json({ userId });
  } catch (error) {
    logger.error({ err: error }, 'Error creating user:');
    res.status(500).json({ error: 'Failed to create user' });
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

      // Store user information in session
      req.session.user = { id: user.userId, email: user.email };
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
router.post('/logout', (req, res, next) => {
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

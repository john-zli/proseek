import bcrypt from 'bcrypt';
import { Router } from 'express';

import { ensureAuthenticated } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { createAdminUser, createUser, generateInvitationCode, getUserByEmail } from '../models/users_storage';
import { CreateAdminUserSchema, CreateUserSchema, InviteUserSchema, LoginUserSchema } from '../schemas/users';
import { NodeEnvs } from '@server/common/constants';
import { RouteError } from '@server/common/route_errors';
import HttpStatusCodes from '@server/common/status_codes';
import config from '@server/config';
import { logger } from '@server/services/logger';

const router = Router();

// Create a new user (Registration)
router.post('/', validate(CreateUserSchema), async (req, res, next) => {
  try {
    const { email, firstName, lastName, gender, password, invitationCode } = req.body;

    const passwordHash = await bcrypt.hash(password, 10);

    const sanitizedUser = await createUser({
      email,
      firstName,
      lastName,
      gender,
      passwordHash,
      invitationCode,
    });

    req.session.regenerate(sessionErr => {
      if (sessionErr) {
        logger.error({ err: sessionErr }, 'Error regenerating session after registration');
        const err = new RouteError(
          HttpStatusCodes.INTERNAL_SERVER_ERROR,
          'Registration succeeded but session creation failed'
        );
        return next(err);
      }
      req.session.user = sanitizedUser;
      res.status(HttpStatusCodes.CREATED).json({ userId: sanitizedUser.userId });
    });
  } catch (error: any) {
    logger.error({ err: error }, 'Error creating user:');

    let statusCode = HttpStatusCodes.INTERNAL_SERVER_ERROR;
    let message = 'Failed to create user';

    if (error.message.includes('USER_EMAIL_EXISTS')) {
      statusCode = HttpStatusCodes.CONFLICT;
      message = 'User with this email already exists';
    } else if (error.message.includes('INVALID_INVITATION_CODE')) {
      statusCode = HttpStatusCodes.BAD_REQUEST;
      message = 'Invalid or already used invitation code';
    }

    const err = new RouteError(statusCode, message);
    return next(err);
  }
});

// Create a new admin user (Registration)
router.post('/admin', validate(CreateAdminUserSchema), async (req, res, next) => {
  try {
    const { email, firstName, lastName, gender, password, churchId } = req.body;

    const passwordHash = await bcrypt.hash(password, 10);

    const sanitizedUser = await createAdminUser({
      email,
      firstName,
      lastName,
      gender,
      passwordHash,
      churchId,
    });

    req.session.regenerate(sessionErr => {
      if (sessionErr) {
        logger.error({ err: sessionErr }, 'Error regenerating session after registration');
        const err = new RouteError(
          HttpStatusCodes.INTERNAL_SERVER_ERROR,
          'Registration succeeded but session creation failed'
        );
        return next(err);
      }
      req.session.user = sanitizedUser;
      res.status(HttpStatusCodes.CREATED).json({ userId: sanitizedUser.userId });
    });
  } catch (error: any) {
    logger.error({ err: error }, 'Error creating user:');

    let statusCode = HttpStatusCodes.INTERNAL_SERVER_ERROR;
    let message = 'Failed to create user';

    if (error.message.match(/duplicate key value violates unique constraint "users_email_key"/)) {
      statusCode = HttpStatusCodes.CONFLICT;
      message = 'User with this email already exists';
    }

    const err = new RouteError(statusCode, message);
    return next(err);
  }
});

// User Login
router.post('/login', validate(LoginUserSchema), async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const user = await getUserByEmail(email);

    if (!user || !user.passwordHash) {
      throw new RouteError(HttpStatusCodes.UNAUTHORIZED, 'Invalid email or password');
    }

    // Development-only bypass for johnzli@hey.com
    const isPasswordValid =
      config.env === NodeEnvs.Dev && email === 'johnzli@hey.com'
        ? true
        : await bcrypt.compare(password, user.passwordHash);

    if (!isPasswordValid) {
      throw new RouteError(HttpStatusCodes.UNAUTHORIZED, 'Invalid email or password');
    }

    // Regenerate session to prevent session fixation attacks
    req.session.regenerate(err => {
      if (err) {
        logger.error({ err }, 'Error regenerating session after login');
        return next(new RouteError(HttpStatusCodes.INTERNAL_SERVER_ERROR, 'Login failed'));
      }

      // Omit passwordHash before sending user data
      const { passwordHash, creationTimestamp, modificationTimestamp, ...userWithoutPassword } = user;
      // Store user information in session, including churchId
      req.session.user = userWithoutPassword;

      res.status(HttpStatusCodes.OK).json({ user: userWithoutPassword });
    });
  } catch (error) {
    return next(error);
  }
});

// User Logout
router.post('/logout', (req, res, next) => {
  req.session.destroy(err => {
    if (err) {
      logger.error({ err }, 'Error destroying session during logout');
      const nextErr = new RouteError(HttpStatusCodes.INTERNAL_SERVER_ERROR, 'Logout failed');
      return next(nextErr);
    }
    res.clearCookie('connect.sid'); // Ensure the session cookie is cleared
    res.status(HttpStatusCodes.OK).json({ message: 'Logout successful' });
  });
});

// Generate Invitation Code
router.post('/invite', ensureAuthenticated, validate(InviteUserSchema), async (req, res, next) => {
  // ensureAuthenticated guarantees req.session.user, user.id, and user.churchId exist
  const user = req.session.user!;
  const { userId, churchId } = user;
  const { email } = req.body;

  try {
    const invitationCode = await generateInvitationCode(churchId, userId, email);

    // TODO: Send email to `email` with the `invitationCode` (Email: ${email})

    // 3. Return the generated code
    res.status(HttpStatusCodes.CREATED).json({ invitationCode });
  } catch (error: any) {
    return next(error);
  }
});

export default router;

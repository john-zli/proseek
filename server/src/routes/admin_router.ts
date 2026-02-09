import { adminChurchRouter } from './admin_church_routes';
import { adminUserRouter } from './admin_user_routes';
import { RouteError } from '@server/common/route_errors';
import HttpStatusCodes from '@server/common/status_codes';
import { ensureAuthenticated } from '@server/middleware/auth';
import { validate } from '@server/middleware/validate';
import { getUserByEmail } from '@server/models/users_storage';
import { LoginUserSchema } from '@server/schemas/users';
import { logger } from '@server/services/logger';
import { compare } from 'bcrypt';
import { Router } from 'express';

export function adminRouter(): Router {
  const router = Router();

  // Login
  router.post('/login', validate(LoginUserSchema), async (req, res, next) => {
    try {
      const { email, password } = req.body;

      // TODO: Add email allowlist for admin access
      const user = await getUserByEmail(email);

      if (!user || !user.passwordHash) {
        throw new RouteError(HttpStatusCodes.UNAUTHORIZED, 'Invalid email or password');
      }

      const isPasswordValid = await compare(password, user.passwordHash);

      if (!isPasswordValid) {
        throw new RouteError(HttpStatusCodes.UNAUTHORIZED, 'Invalid email or password');
      }

      req.session.regenerate(err => {
        if (err) {
          logger.error({ err }, 'Error regenerating session after admin login');
          return next(new RouteError(HttpStatusCodes.INTERNAL_SERVER_ERROR, 'Login failed'));
        }

        const { passwordHash: _pw, creationTimestamp: _ct, modificationTimestamp: _mt, ...sanitizedUser } = user;
        req.session.user = sanitizedUser;

        res.status(HttpStatusCodes.OK).json({ user: sanitizedUser });
      });
    } catch (error) {
      return next(error);
    }
  });

  // Logout
  router.post('/logout', (req, res, next) => {
    req.session.destroy(err => {
      if (err) {
        logger.error({ err }, 'Error destroying session during admin logout');
        return next(new RouteError(HttpStatusCodes.INTERNAL_SERVER_ERROR, 'Logout failed'));
      }
      res.clearCookie('connect.sid');
      res.status(HttpStatusCodes.OK).json({ message: 'Logout successful' });
    });
  });

  // All routes below require authentication
  router.use(ensureAuthenticated);

  router.use('/churches', adminChurchRouter());
  router.use('/users', adminUserRouter());

  return router;
}

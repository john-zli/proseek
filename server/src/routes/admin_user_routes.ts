import { RouteError } from '@server/common/route_errors';
import HttpStatusCodes from '@server/common/status_codes';
import { validate } from '@server/middleware/validate';
import * as usersStorage from '@server/models/users_storage';
import { UpdateUserSchema, UserIdParamsSchema } from '@server/schemas/admin';
import { Router } from 'express';

export function adminUserRouter(): Router {
  const router = Router();

  // List all users (no password hashes)
  router.get('/', async (_req, res, next) => {
    try {
      const users = await usersStorage.listAllUsers();
      res.json(users);
    } catch (error) {
      return next(new RouteError(HttpStatusCodes.INTERNAL_SERVER_ERROR, error as Error));
    }
  });

  // Get user by ID (no password hash)
  router.get('/:userId', validate(UserIdParamsSchema), async (req, res, next) => {
    try {
      const user = await usersStorage.$getUser(req.params.userId);
      const { passwordHash: _pw, ...sanitizedUser } = user;
      res.json(sanitizedUser);
    } catch (error) {
      return next(new RouteError(HttpStatusCodes.INTERNAL_SERVER_ERROR, error as Error));
    }
  });

  // Update user
  router.put('/:userId', validate(UpdateUserSchema), async (req, res, next) => {
    try {
      const { userId } = req.params;
      const { firstName, lastName, email, gender } = req.body;

      await usersStorage.updateUser({ userId, firstName, lastName, email, gender });
      res.json({ userId, message: 'User updated successfully' });
    } catch (error) {
      return next(new RouteError(HttpStatusCodes.INTERNAL_SERVER_ERROR, error as Error));
    }
  });

  // Delete user (soft delete)
  router.delete('/:userId', validate(UserIdParamsSchema), async (req, res, next) => {
    try {
      const { userId } = req.params;

      await usersStorage.deleteUser(userId);
      res.json({ userId, message: 'User deleted successfully' });
    } catch (error) {
      return next(new RouteError(HttpStatusCodes.INTERNAL_SERVER_ERROR, error as Error));
    }
  });

  return router;
}

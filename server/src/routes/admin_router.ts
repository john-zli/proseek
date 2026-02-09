import { adminChurchRouter } from './admin_church_routes';
import { adminUserRouter } from './admin_user_routes';
import { authenticateAdmin } from '@server/middleware/admin_auth';
import { Router } from 'express';

export function adminRouter(): Router {
  const router = Router();

  router.use(authenticateAdmin);

  router.use('/churches', adminChurchRouter());
  router.use('/users', adminUserRouter());

  return router;
}

import { adminChurchRouter } from './admin_church_routes';
import { adminUserRouter } from './admin_user_routes';
import { Router } from 'express';

export function adminRouter(): Router {
  const router = Router();

  router.use('/churches', adminChurchRouter());
  router.use('/users', adminUserRouter());

  return router;
}

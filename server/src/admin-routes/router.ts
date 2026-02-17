import { churchRouter } from './church_routes';
import { userRouter } from './user_routes';
import { Router } from 'express';

export function router(): Router {
  const r = Router();

  r.use('/churches', churchRouter());
  r.use('/users', userRouter());

  return r;
}

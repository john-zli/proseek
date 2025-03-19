import { Router } from 'express';

interface LocalServices {}

export function apiRouter(_services: LocalServices): Router {
  const apiRouter = Router();

  apiRouter.get(
    '/',
    (_req, res) => {
      console.log('I made it here');
      res.json({ message: 'Hello, world!' });
    }
  );

  return apiRouter;
}

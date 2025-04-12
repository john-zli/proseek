import { Router } from 'express';

import churchesRouter from './churches';
import prayerRequestsRouter from './prayer_requests';
import usersRouter from './users';
import { serveStaticHtmlFile } from '@src/middleware/serve_static_html_file';

interface LocalServices {}

export function apiRouter(_services: LocalServices): Router {
  const apiRouter = Router();

  apiRouter.get('/', serveStaticHtmlFile());

  // Prayer requests routes
  apiRouter.use('/api/prayer-requests', prayerRequestsRouter);

  // Church routes
  apiRouter.use('/api/churches', churchesRouter);

  // User routes
  apiRouter.use('/api/users', usersRouter);

  return apiRouter;
}

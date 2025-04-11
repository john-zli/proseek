import { Router } from 'express';

import prayerRequestsRouter from './prayer_requests';
import { serveStaticHtmlFile } from '@src/middleware/serve_static_html_file';

interface LocalServices {}

export function apiRouter(_services: LocalServices): Router {
  const apiRouter = Router();

  apiRouter.get('/', serveStaticHtmlFile());

  // Prayer requests routes
  apiRouter.use('/api/prayer-requests', prayerRequestsRouter);

  return apiRouter;
}

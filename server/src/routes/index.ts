import { serveStaticHtmlFile } from '@src/middleware/serve_static_html_file';
import { Router } from 'express';

interface LocalServices {}

export function apiRouter(_services: LocalServices): Router {
  const apiRouter = Router();

  apiRouter.get(
    '/',
    serveStaticHtmlFile(),
  );

  return apiRouter;
}

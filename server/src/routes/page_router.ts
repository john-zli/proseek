import { Router } from 'express';

import { serveStaticHtmlFile } from '@server/middleware/serve_static_html_file';

interface LocalServices {}

export function pageRouter(_services: LocalServices): Router {
  const router = Router();

  // Routes that are accessible via UI
  router.get('/', serveStaticHtmlFile());
  router.get('/chats/:chatroomId', /* Add validation for chatroomId */ serveStaticHtmlFile());
  router.get('/login', serveStaticHtmlFile());

  return router;
}

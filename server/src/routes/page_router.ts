import { Router } from 'express';

import { serveStaticHtmlFile } from '@server/middleware/serve_static_html_file';
import { ServicesBuilder } from '@server/services/services_builder';

export function createPageRouter(services: ServicesBuilder): Router {
  const router = Router();

  // Routes that are accessible via UI
  router.get('/', serveStaticHtmlFile());
  router.get('/chats/:chatroomId', /* Add validation for chatroomId */ serveStaticHtmlFile());
  router.get('/login', serveStaticHtmlFile());

  return router;
}

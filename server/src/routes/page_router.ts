import { serveStaticHtmlFile } from '@server/middleware/serve_static_html_file';
import { IServicesBuilder } from '@server/services/services_builder';
import { Router } from 'express';

export function pageRouter(_services: IServicesBuilder): Router {
  const router = Router();

  // Seeker routes
  router.get('/', serveStaticHtmlFile());
  router.get('/chats/:chatroomId', /* Add validation for chatroomId */ serveStaticHtmlFile());

  // Portal routes
  router.get('/portal/:churchId', serveStaticHtmlFile());
  router.get('/portal/login', serveStaticHtmlFile());
  router.get('/portal/invite', serveStaticHtmlFile());

  return router;
}

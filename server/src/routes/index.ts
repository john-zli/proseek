import { Router } from 'express';

import churchesRouter from './churches';
import prayerRequestChatMessagesRouter from './prayer_request_chat_messages';
import prayerRequestChatsRouter from './prayer_request_chats';
import usersRouter from './users';
import { serveStaticHtmlFile } from '@server/middleware/serve_static_html_file';

interface LocalServices {}

export function apiRouter(_services: LocalServices): Router {
  const apiRouter = Router();

  apiRouter.get('/', serveStaticHtmlFile());

  // Prayer requests routes
  apiRouter.use('/api/prayer-requests', prayerRequestChatsRouter);

  // Prayer request chat messages routes
  apiRouter.use('/api/prayer-requests/messages', prayerRequestChatMessagesRouter);

  // Church routes
  apiRouter.use('/api/churches', churchesRouter);

  // User routes
  apiRouter.use('/api/users', usersRouter);

  return apiRouter;
}

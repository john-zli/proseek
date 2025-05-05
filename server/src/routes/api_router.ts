import { Router } from 'express';

import captchaRouter from './captcha_routes';
import churchesRouter from './church_routes';
import prayerRequestChatsRouter from './prayer_request_chats_routes';
import usersRouter from './user_routes';

interface LocalServices {}

export function apiRouter(_services: LocalServices): Router {
  const apiRouter = Router();

  // Session endpoint
  apiRouter.get('/session', (req, res) => {
    const sessionData = {
      isAuthenticated: req.session.isAuthenticated || false,
      userId: req.session.user?.id,
      verifiedChatIds: req.session.verifiedChatIds || [],
    };
    res.json(sessionData);
  });

  // Prayer requests routes
  apiRouter.use('/prayer-requests', prayerRequestChatsRouter);

  // Church routes
  apiRouter.use('/churches', churchesRouter);

  // User routes
  apiRouter.use('/users', usersRouter);

  // Captcha routes
  apiRouter.use('/captcha', captchaRouter);

  return apiRouter;
}

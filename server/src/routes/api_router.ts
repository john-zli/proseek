import { captchaRouter } from './captcha_routes';
import { churchRouter } from './church_routes';
import { prayerRequestChatsRouter } from './prayer_request_chats_routes';
import { userRouter } from './user_routes';
import { ServicesBuilder } from '@server/services/services_builder';
import { Router } from 'express';

export function apiRouter(services: ServicesBuilder): Router {
  const apiRouter = Router();

  // Session endpoint
  apiRouter.get('/session', (req, res) => {
    const sessionData = {
      isAuthenticated: req.session.isAuthenticated || false,
      verifiedChatIds: req.session.verifiedChatIds || [],
      user: req.session.user,
    };
    res.json(sessionData);
  });

  // Prayer requests routes
  apiRouter.use('/prayer-requests', prayerRequestChatsRouter(services));

  // Church routes
  apiRouter.use('/churches', churchRouter(services));

  // User routes
  apiRouter.use('/users', userRouter(services));

  // Captcha routes
  apiRouter.use('/captcha', captchaRouter(services));

  return apiRouter;
}

import { captchaRouter } from './captcha_routes';
import { churchRouter } from './church_routes';
import { prayerRequestChatsRouter } from './prayer_request_chats_routes';
import { userRouter } from './user_routes';
import { IServicesBuilder } from '@server/services/services_builder';
import { Router } from 'express';

export function apiRouter(services: IServicesBuilder): Router {
  const apiRouter = Router();

  // Session endpoint
  apiRouter.get('/session', (req, res) => {
    const sessionData = {
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

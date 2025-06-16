import { Router } from 'express';

import { RouteError } from '@server/common/route_errors';
import HttpStatusCodes from '@server/common/status_codes';
import { ServicesBuilder } from '@server/services/services_builder';

export function captchaRouter(services: ServicesBuilder) {
  const router = Router();

  // Endpoint to get a new captcha challenge
  router.post('/challenge', async (_req, res) => {
    res.status(HttpStatusCodes.OK).json(await services.captcha.createChallenge());
  });

  // Endpoint to redeem a captcha challenge (if needed - structure based on original file state)
  router.post('/redeem', async (req, res, next) => {
    const { token, solutions } = req.body;

    if (!token || !solutions) {
      return next(new RouteError(HttpStatusCodes.BAD_REQUEST, 'Missing required fields: token and solutions'));
    }

    res.status(HttpStatusCodes.OK).json(await services.captcha.redeemChallenge(token, solutions));
  });

  return router;
}

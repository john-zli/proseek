import { Router } from 'express';

import { RouteError } from '@server/common/route_errors';
import HttpStatusCodes from '@server/common/status_codes';
import { getCap } from '@server/services/captcha';

const router = Router();

// Endpoint to get a new captcha challenge
router.post('/challenge', async (_req, res) => {
  const cap = await getCap();
  res.status(HttpStatusCodes.OK).json(await cap.createChallenge());
});

// Endpoint to redeem a captcha challenge (if needed - structure based on original file state)
router.post('/redeem', async (req, res, next) => {
  const { token, solutions } = req.body;

  if (!token || !solutions) {
    return next(new RouteError(HttpStatusCodes.BAD_REQUEST, 'Missing required fields: token and solutions'));
  }

  const cap = await getCap();
  res.status(HttpStatusCodes.OK).json(await cap.redeemChallenge({ token, solutions }));
});

export default router;

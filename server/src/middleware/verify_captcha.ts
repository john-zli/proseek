import { NextFunction, Request, Response } from 'express';

import { getCap } from '@server/services/captcha';

export async function verifyCaptcha(req: Request, res: Response, next: NextFunction) {
  // TODO(johnli): Remove this once we start stubbing in fake services.
  if (process.env.NODE_ENV === 'test') {
    next();
    return;
  }

  const { token } = req.body;
  if (!token) {
    res.status(400).json({ error: 'CAPTCHA token is required' });
    return;
  }

  const cap = getCap();
  const { success } = await cap.validateToken(token);
  if (!success) {
    res.status(400).json({ error: 'Invalid CAPTCHA token' });
    return;
  }

  next();
}

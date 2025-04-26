import { NextFunction, Request, Response } from 'express';

import { getCap } from '@server/captcha';

export async function verifyCaptcha(req: Request, res: Response, next: NextFunction) {
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

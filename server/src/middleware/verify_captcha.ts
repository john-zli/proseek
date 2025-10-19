import { ServicesBuilder } from '@server/services/services_builder';
import { NextFunction, Request, Response } from 'express';

export function verifyCaptcha(services: ServicesBuilder) {
  return async function (req: Request, res: Response, next: NextFunction) {
    const { token } = req.body;
    if (!token) {
      res.status(400).json({ error: 'CAPTCHA token is required' });
      return;
    }

    const { success } = await services.captcha.validateToken(token);
    if (!success) {
      res.status(400).json({ error: 'Invalid CAPTCHA token' });
      return;
    }

    next();
  };
}

import { RouteError } from '@server/common/route_errors';
import HttpStatusCodes from '@server/common/status_codes';
import config from '@server/config';
import { NextFunction, Request, Response } from 'express';

export function authenticateAdmin(req: Request, _res: Response, next: NextFunction) {
  if (!config.adminApiKey) {
    return next();
  }

  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return next(new RouteError(HttpStatusCodes.UNAUTHORIZED, 'Missing or invalid Authorization header'));
  }

  const token = authHeader.substring(7);

  if (token !== config.adminApiKey) {
    return next(new RouteError(HttpStatusCodes.FORBIDDEN, 'Invalid API key'));
  }

  next();
}

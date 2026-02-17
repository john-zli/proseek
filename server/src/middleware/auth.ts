import { RouteError } from '@server/common/route_errors';
import HttpStatusCodes from '@server/common/status_codes';
import { NextFunction, Request, Response } from 'express';

/**
 * Middleware to ensure the user is authenticated by checking req.session.user.
 * If the route has a :churchId param, also verifies the user belongs to that church.
 */
export function ensureAuthenticated(req: Request, res: Response, next: NextFunction) {
  if (!req.session.user) {
    return next(new RouteError(HttpStatusCodes.UNAUTHORIZED, 'Authentication required'));
  }

  const { churchId } = req.params || {};
  if (churchId && !req.session.user.churchIds.includes(churchId)) {
    return next(new RouteError(HttpStatusCodes.FORBIDDEN, 'You do not have access to this church'));
  }

  next();
}

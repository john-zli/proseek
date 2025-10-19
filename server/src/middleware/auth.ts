import { RouteError } from '@server/common/route_errors';
import HttpStatusCodes from '@server/common/status_codes';
import { NextFunction, Request, Response } from 'express';

/**
 * Middleware to ensure the user is authenticated by checking req.session.user.
 */
export function ensureAuthenticated(req: Request, res: Response, next: NextFunction) {
  // Ensure user is logged in
  if (req.session.user) {
    next(); // User is authenticated, proceed to the next handler
  } else {
    next(new RouteError(HttpStatusCodes.UNAUTHORIZED, 'Authentication required'));
  }
}

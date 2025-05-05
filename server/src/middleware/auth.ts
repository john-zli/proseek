import { NextFunction, Request, Response } from 'express';

import HttpStatusCodes from '@server/common/status_codes';

/**
 * Middleware to ensure the user is authenticated by checking req.session.user.
 */
export function ensureAuthenticated(req: Request, res: Response, next: NextFunction) {
  // Ensure user is logged in
  if (req.session.user) {
    next(); // User is authenticated, proceed to the next handler
  } else {
    res.status(HttpStatusCodes.UNAUTHORIZED).json({ error: 'Authentication required' });
  }
}

import { NextFunction, Request, Response } from 'express';

import HttpStatusCodes from '@server/common/status_codes';

/**
 * Middleware to ensure the user is authenticated by checking req.session.user.
 */
export function ensureAuthenticated(req: Request, res: Response, next: NextFunction) {
  // Ensure user is logged in and critical session data (id, churchId) is present
  if (req.session.user && req.session.user.id && req.session.user.churchId) {
    next(); // User is authenticated, proceed to the next handler
  } else {
    res.status(HttpStatusCodes.UNAUTHORIZED).json({ error: 'Authentication required' });
  }
}

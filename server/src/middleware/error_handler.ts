import { NextFunction, Request, Response } from 'express';

import { RouteError } from '@server/common/route_errors';
import HttpStatusCodes from '@server/common/status_codes';
import { logger } from '@server/logger';

export const errorHandler = (err: RouteError, req: Request, res: Response, _next: NextFunction) => {
  logger.error({ err, url: req.originalUrl, method: req.method }, 'Unhandled error occurred:');

  const statusCode = err.status || HttpStatusCodes.INTERNAL_SERVER_ERROR;
  const message = err.status ? err.message : 'Internal Server Error';

  res.status(statusCode).json({
    error: message,
    // Optionally include stack trace in development
    // stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
  });
};

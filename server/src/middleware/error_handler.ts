import { NextFunction, Request, Response } from 'express';

import { RouteError } from '@server/common/route_errors';
import HttpStatusCodes from '@server/common/status_codes';
import { logger } from '@server/services/logger';

export const errorHandler = (err: Error, req: Request, res: Response, _next: NextFunction) => {
  logger.error({ err, url: req.originalUrl, method: req.method }, 'Unhandled error occurred:');

  const statusCode = (err as RouteError).status || HttpStatusCodes.INTERNAL_SERVER_ERROR;
  const message = (err as RouteError).status ? (err as RouteError).message : 'Internal Server Error';

  res.status(statusCode).json({
    error: message,
    // Optionally include stack trace in development
    // stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
  });
};

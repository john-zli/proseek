import express, { Express, NextFunction, Request, Response } from 'express';
import 'express-async-errors';
import helmet from 'helmet';
import morgan from 'morgan';
import path from 'path';

import { apiRouter } from './routes/api_router';
import { NodeEnvs } from '@server/common/constants';
import { RouteError } from '@server/common/route_errors';
import HttpStatusCodes from '@server/common/status_codes';
import config from '@server/config';
import { logger } from '@server/logger';
import { pageRouter } from '@server/routes/page_router';
import { sessionMiddleware } from '@server/session';

interface LocalServices {}

export function startServer(services: LocalServices): Express {
  const app = express();

  // Basic middleware
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));
  app.use(sessionMiddleware);

  // Serving React CSS and JS
  app.use(express.static(path.join(__dirname, '../../client/dist')));

  // Show routes called in console during development
  if (config.env === NodeEnvs.Dev) {
    app.use(morgan('dev'));
  }

  // Security
  if (config.env === NodeEnvs.Production) {
    // eslint-disable-next-line n/no-process-env
    if (!process.env.DISABLE_HELMET) {
      app.use(helmet());
    }
  }

  // Router for '/' established here.
  app.use('/', pageRouter(services));

  // API routes
  app.use('/api', apiRouter(services));

  // Add error handler
  app.use((err: Error, _: Request, res: Response, next: NextFunction) => {
    if (config.env !== NodeEnvs.Test) {
      logger.error(err);
    }
    let status = HttpStatusCodes.BAD_REQUEST;
    if (err instanceof RouteError) {
      status = err.status;
      res.status(status).json({ error: err.message });
    }
    return next(err);
  });

  return app;
}

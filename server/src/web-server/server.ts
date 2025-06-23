import express, { Express, NextFunction, Request, Response } from 'express';
import 'express-async-errors';
import helmet from 'helmet';
import morgan from 'morgan';
import path from 'path';

import { NodeEnvs } from '@server/common/constants';
import { RouteError } from '@server/common/route_errors';
import HttpStatusCodes from '@server/common/status_codes';
import config from '@server/config';
import { errorHandler } from '@server/middleware/error_handler';
import { ipGeolocationMiddleware } from '@server/middleware/ip_geolocation';
import { sessionMiddleware } from '@server/middleware/session';
import { apiRouter } from '@server/routes/api_router';
import { pageRouter } from '@server/routes/page_router';
import { logger } from '@server/services/logger';
import { IServicesBuilder } from '@server/services/services_builder';

export function startServer(services: IServicesBuilder): Express {
  const app = express();

  // Basic middleware
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));
  app.use(sessionMiddleware);
  app.use(ipGeolocationMiddleware);

  // Serving React CSS and JS
  app.use(express.static(path.join(__dirname, '../../../client/dist')));

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

  // Modify existing error handler
  app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
    if (config.env !== NodeEnvs.Test) {
      logger.error(err);
    }

    if (err instanceof RouteError) {
      errorHandler(err, req, res, next);
    } else {
      const routeError = new RouteError(HttpStatusCodes.INTERNAL_SERVER_ERROR, err.message);

      errorHandler(routeError, req, res, next);
    }
  });

  return app;
}

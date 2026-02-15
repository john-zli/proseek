import 'express-async-errors';

import { NodeEnvs } from '@server/common/constants';
import { RouteError } from '@server/common/route_errors';
import HttpStatusCodes from '@server/common/status_codes';
import config from '@server/config';
import { errorHandler } from '@server/middleware/error_handler';
import { sessionMiddleware } from '@server/middleware/session';
import { adminRouter } from '@server/routes/admin_router';
import { logger } from '@server/services/logger';
import express, { Express, NextFunction, Request, Response, json, static as expressStatic, urlencoded } from 'express';
import morgan from 'morgan';
import path from 'path';

export function startAdminServer(): Express {
  const app = express();

  app.use(json());
  app.use(urlencoded({ extended: true }));
  app.use(sessionMiddleware);

  if (config.env === NodeEnvs.Dev) {
    app.use(morgan('dev'));
  }

  // Serving admin client static assets
  const adminClientDist = path.join(__dirname, '../../../admin-client/dist');
  app.use(expressStatic(adminClientDist));

  app.use('/admin', adminRouter());

  app.get('/health', (_req, res) => {
    res.json({ status: 'ok', service: 'admin' });
  });

  // SPA fallback: serve index.html for all non-API, non-static routes
  app.get('*', (_req, res) => {
    res.sendFile(path.join(adminClientDist, 'index.html'));
  });

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

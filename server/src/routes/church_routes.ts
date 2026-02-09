import { ensureAuthenticated } from '../middleware/auth';
import { validate } from '../middleware/validate';
import * as churchesStorage from '../models/churches_storage';
import { CreateChurchSchema } from '../schemas/churches';
import { RouteError } from '@server/common/route_errors';
import HttpStatusCodes from '@server/common/status_codes';
import { IServicesBuilder } from '@server/services/services_builder';
import { Router } from 'express';

export function churchRouter(_services: IServicesBuilder): Router {
  const router = Router();

  // Create a new church - Requires authentication
  router.post('/', ensureAuthenticated, validate(CreateChurchSchema), async (req, res, next) => {
    const { name, address, city, state, zip, email } = req.body;

    try {
      const church = await churchesStorage.createChurch({
        name,
        address,
        city,
        state,
        zip,
        county: city,
        email,
      });
      res.status(HttpStatusCodes.CREATED).json(church);
    } catch (error) {
      return next(new RouteError(HttpStatusCodes.INTERNAL_SERVER_ERROR, error as Error));
    }
  });

  return router;
}

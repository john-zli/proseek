import { Router } from 'express';

import { ensureAuthenticated } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { createChurch } from '../models/churches_storage';
import { CreateChurchSchema } from '../schemas/churches';
import { RouteError } from '@server/common/route_errors';
import HttpStatusCodes from '@server/common/status_codes';
import { ServicesBuilder } from '@server/services/services_builder';

export function churchRouter(_services: ServicesBuilder): Router {
  const router = Router();

  // Create a new church - Requires authentication
  router.post('/', ensureAuthenticated, validate(CreateChurchSchema), async (req, res, next) => {
    const { name, address, city, state, zip } = req.body;

    try {
      const church = await createChurch({
        name,
        address,
        city,
        state,
        zip,
        county: city,
      });
      res.status(HttpStatusCodes.CREATED).json(church);
    } catch (error: any) {
      return next(new RouteError(HttpStatusCodes.INTERNAL_SERVER_ERROR, error));
    }
  });

  return router;
}

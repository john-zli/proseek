import { RouteError } from '@server/common/route_errors';
import HttpStatusCodes from '@server/common/status_codes';
import { validate } from '@server/middleware/validate';
import * as churchesStorage from '@server/models/churches_storage';
import { ChurchIdParamsSchema, UpdateChurchSchema } from '@server/schemas/admin';
import { CreateChurchSchema } from '@server/schemas/churches';
import { Router } from 'express';

export function churchRouter(): Router {
  const router = Router();

  // List all churches
  router.get('/', async (_req, res, next) => {
    try {
      const churches = await churchesStorage.listAllChurches();
      res.json(churches);
    } catch (error) {
      return next(new RouteError(HttpStatusCodes.INTERNAL_SERVER_ERROR, error as Error));
    }
  });

  // Get church by ID
  router.get('/:churchId', validate(ChurchIdParamsSchema), async (req, res, next) => {
    try {
      const church = await churchesStorage.getChurchById(req.params.churchId);

      if (!church) {
        return next(new RouteError(HttpStatusCodes.NOT_FOUND, 'Church not found'));
      }

      res.json(church);
    } catch (error) {
      return next(new RouteError(HttpStatusCodes.INTERNAL_SERVER_ERROR, error as Error));
    }
  });

  // Create church
  router.post('/', validate(CreateChurchSchema), async (req, res, next) => {
    try {
      const { name, address, city, state, zip, email } = req.body;
      const churchId = await churchesStorage.createChurch({
        name,
        address,
        city,
        state,
        zip,
        county: city,
        email,
      });
      res.status(HttpStatusCodes.CREATED).json({ churchId });
    } catch (error) {
      return next(new RouteError(HttpStatusCodes.INTERNAL_SERVER_ERROR, error as Error));
    }
  });

  // Update church
  router.put('/:churchId', validate(UpdateChurchSchema), async (req, res, next) => {
    try {
      const { churchId } = req.params;
      const { name, address, city, state, zip, county, email } = req.body;

      const existing = await churchesStorage.getChurchById(churchId);
      if (!existing) {
        return next(new RouteError(HttpStatusCodes.NOT_FOUND, 'Church not found'));
      }

      await churchesStorage.updateChurch({ churchId, name, address, city, state, zip, county, email });
      res.json({ churchId, message: 'Church updated successfully' });
    } catch (error) {
      return next(new RouteError(HttpStatusCodes.INTERNAL_SERVER_ERROR, error as Error));
    }
  });

  // Delete church (soft delete)
  router.delete('/:churchId', validate(ChurchIdParamsSchema), async (req, res, next) => {
    try {
      const { churchId } = req.params;

      const existing = await churchesStorage.getChurchById(churchId);
      if (!existing) {
        return next(new RouteError(HttpStatusCodes.NOT_FOUND, 'Church not found'));
      }

      await churchesStorage.deleteChurch(churchId);
      res.json({ churchId, message: 'Church deleted successfully' });
    } catch (error) {
      return next(new RouteError(HttpStatusCodes.INTERNAL_SERVER_ERROR, error as Error));
    }
  });

  return router;
}

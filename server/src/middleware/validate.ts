import { RouteError } from '@server/common/route_errors';
import HttpStatusCodes from '@server/common/status_codes';
import { NextFunction, Request, RequestHandler, Response } from 'express';
import { AnyZodObject, ZodError } from 'zod';

export const validate = (schema: AnyZodObject): RequestHandler => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const validated = await schema.parseAsync({
        body: req.body,
        query: req.query,
        params: req.params,
      });

      // All validated data will replace the original data.
      req.body = validated.body;
      req.query = validated.query;
      req.params = validated.params;
      next();
      return;
    } catch (error) {
      if (error instanceof ZodError) {
        return next(new RouteError(HttpStatusCodes.BAD_REQUEST, error));
      }
      return next(new RouteError(HttpStatusCodes.INTERNAL_SERVER_ERROR, error as Error));
    }
  };
};

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
        res.status(400).json({
          error: 'Validation failed',
          details: error.errors.map(err => ({
            path: err.path.join('.'),
            message: err.message,
          })),
        });
        return;
      }
      res.status(500).json({ error: 'Internal server error' });
    }
  };
};

import { Mock } from 'bun:test';
import { NextFunction, Request, Response, Router } from 'express';

import { MockResponse } from '@server/test/request_test_helper';
import { MockRequest } from '@server/test/request_test_helper';

/**
 * Helper function to test a route by executing all middleware in order
 * @param router The Express router to test
 * @param method The HTTP method (GET, POST, etc.)
 * @param path The route path
 * @param req The mock request object
 * @param res The mock response object
 * @param next The mock next function
 */
export async function testRoute(
  router: Router,
  method: string,
  path: string,
  req: Request | MockRequest,
  res: Response | MockResponse,
  next: NextFunction | Mock
) {
  // Find the route in the router's stack
  const route = router.stack.find(layer => layer.route?.path === path && layer.route?.methods[method.toLowerCase()]);
  if (!route) {
    throw new Error(`Route ${method} ${path} not found`);
  }

  // Create a wrapper for next that will stop execution on error. Modeled after how express handles errors.
  const wrappedNext = (err?: any) => {
    if (err) {
      next(err);
      return true; // Signal that execution should stop
    }
    return false; // Signal that execution should continue
  };

  // Execute all middleware in order
  const stack = route.route?.stack || [];
  for (let i = 0; i < stack.length; i++) {
    const middleware = stack[i];
    const isLastMiddleware = i === stack.length - 1;

    try {
      const result = await new Promise(resolve => {
        let nextCalled = false;
        const wrappedNextWithFlag = (err?: any) => {
          nextCalled = true;
          // Always call the original next to maintain call history
          next(err);
          if (err) {
            resolve(true);
          } else if (!isLastMiddleware) {
            resolve(false);
          }
        };

        const middlewareResult = middleware.handle(req as Request, res as Response, wrappedNextWithFlag);

        // If middleware returns a Promise, wait for it
        if (middlewareResult instanceof Promise) {
          middlewareResult
            .then(() => {
              if (!nextCalled && isLastMiddleware) {
                resolve(false);
              }
            })
            .catch(err => {
              wrappedNextWithFlag(err);
            });
        } else if (!nextCalled && isLastMiddleware) {
          // If middleware is sync and didn't call next, we're done
          resolve(false);
        }
      });

      // If next(error) was called, stop execution
      if (result === true) {
        return;
      }
    } catch (err) {
      wrappedNext(err);
      return;
    }
  }
}

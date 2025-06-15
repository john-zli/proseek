import { describe, expect, test } from 'bun:test';
import { Request, Response } from 'express';

import { errorHandler } from '../error_handler';
import { RouteError } from '@server/common/route_errors';
import HttpStatusCodes from '@server/common/status_codes';
import { createMockNext, createMockRequest, createMockResponse } from '@server/test/request_test_helper';

describe('error handler middleware', () => {
  test('should handle RouteError with status code', () => {
    // Create mock request
    const req = createMockRequest({
      originalUrl: '/test',
      method: 'GET',
    }) as unknown as Request;

    // Create mock response
    const res = createMockResponse();

    // Create mock next function
    const next = createMockNext();

    // Create a RouteError
    const error = new RouteError(HttpStatusCodes.BAD_REQUEST, 'Invalid input');

    // Call error handler
    errorHandler(error, req, res as unknown as Response, next);

    // Verify response
    expect(res.status.mock.calls[0][0]).toBe(HttpStatusCodes.BAD_REQUEST);
    expect(res.json.mock.calls[0][0]).toEqual({ error: 'Invalid input' });
  });

  test('should handle unknown errors with 500 status', () => {
    // Create mock request
    const req = createMockRequest({
      originalUrl: '/test',
      method: 'GET',
    }) as unknown as Request;

    // Create mock response
    const res = createMockResponse();

    // Create mock next function
    const next = createMockNext();

    // Create a generic error
    const error = new Error('Unknown error');

    // Call error handler
    errorHandler(error, req, res as unknown as Response, next);

    // Verify response
    expect(res.status.mock.calls[0][0]).toBe(HttpStatusCodes.INTERNAL_SERVER_ERROR);
    expect(res.json.mock.calls[0][0]).toEqual({ error: 'Internal Server Error' });
  });

  test('should handle errors without message', () => {
    // Create mock request
    const req = createMockRequest({
      originalUrl: '/test',
      method: 'GET',
    }) as unknown as Request;

    // Create mock response
    const res = createMockResponse();

    // Create mock next function
    const next = createMockNext();

    // Create an error without message
    const error = new Error();

    // Call error handler
    errorHandler(error, req, res as unknown as Response, next);

    // Verify response
    expect(res.status.mock.calls[0][0]).toBe(HttpStatusCodes.INTERNAL_SERVER_ERROR);
    expect(res.json.mock.calls[0][0]).toEqual({ error: 'Internal Server Error' });
  });
});

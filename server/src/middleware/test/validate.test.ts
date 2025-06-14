import { describe, expect, test } from 'bun:test';
import { Request, Response } from 'express';
import { z } from 'zod';

import { validate } from '../validate';
import { RouteError } from '@server/common/route_errors';
import HttpStatusCodes from '@server/common/status_codes';
import { createMockNext, createMockRequest, createMockResponse } from '@server/test/request_test_helper';

describe('validate middleware', () => {
  const testSchema = z.object({
    body: z.object({
      name: z.string(),
      age: z.number(),
    }),
    query: z.object({
      page: z.string().optional(),
    }),
    params: z.object({
      id: z.string(),
    }),
  });

  test('should validate and transform valid request data', async () => {
    // Create mock request with valid data
    const req = createMockRequest({
      body: { name: 'John', age: 30 },
      query: { page: '1' },
      params: { id: '123' },
    }) as unknown as Request;

    // Create mock response
    const res = createMockResponse() as unknown as Response;

    // Create mock next function
    const next = createMockNext();

    // Call middleware
    await validate(testSchema)(req, res, next);

    // Verify data was validated and transformed
    expect(req.body).toEqual({ name: 'John', age: 30 });
    expect(req.query).toEqual({ page: '1' });
    expect(req.params).toEqual({ id: '123' });
    expect(next.mock.calls.length).toBe(1);
  });

  test('should handle invalid request data', async () => {
    // Create mock request with invalid data
    const req = createMockRequest({
      body: { name: 'John', age: 'invalid' }, // age should be number
      query: {},
      params: { id: '123' },
    }) as unknown as Request;

    // Create mock response
    const res = createMockResponse() as unknown as Response;

    // Create mock next function
    const next = createMockNext();

    // Call middleware
    await validate(testSchema)(req, res, next);

    // Verify error was passed to next
    expect(next).toHaveBeenCalledWith(expect.any(RouteError));
    const error = next.mock.calls[0][0] as RouteError;
    expect(error.status).toBe(HttpStatusCodes.BAD_REQUEST);
  });

  test('should handle unexpected errors', async () => {
    // Create mock request that will cause an unexpected error
    const req = createMockRequest({
      body: null,
    }) as unknown as Request;

    // Create mock response
    const res = createMockResponse() as unknown as Response;

    // Create mock next function
    const next = createMockNext();

    // Call middleware
    await validate(testSchema)(req, res, next);

    // Verify error was passed to next
    expect(next.mock.calls.length).toBe(1);
    const error = next.mock.calls[0][0] as RouteError;
    expect(error.status).toBe(HttpStatusCodes.BAD_REQUEST);
  });
});

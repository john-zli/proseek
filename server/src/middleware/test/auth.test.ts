import { describe, expect, test } from 'bun:test';
import { Request, Response } from 'express';

import { ensureAuthenticated } from '../auth';
import HttpStatusCodes from '@server/common/status_codes';
import { createMockNext, createMockRequest, createMockResponse } from '@server/test/request_test_helper';

describe('auth middleware', () => {
  test('should allow authenticated requests to proceed', () => {
    // Create mock request with session user
    const req = createMockRequest({
      session: {
        user: { id: '123', email: 'test@example.com' },
      },
    }) as unknown as Request;

    // Create mock response
    const res = createMockResponse();

    // Create mock next function
    const next = createMockNext();

    // Call middleware
    ensureAuthenticated(req, res as unknown as Response, next);

    // Verify next was called and response was not sent
    expect(next.mock.calls.length).toBe(1);
    expect(res.status.mock.calls.length).toBe(0);
    expect(res.json.mock.calls.length).toBe(0);
  });

  test('should reject unauthenticated requests', () => {
    // Create mock request without session user
    const req = createMockRequest() as unknown as Request;

    // Create mock response
    const res = createMockResponse();

    // Create mock next function
    const next = createMockNext();

    // Call middleware
    ensureAuthenticated(req, res as unknown as Response, next);

    // Verify response was sent with unauthorized status
    expect(next.mock.calls.length).toBe(0);
    expect(res.status.mock.calls[0][0]).toBe(HttpStatusCodes.UNAUTHORIZED);
    expect(res.json.mock.calls[0][0]).toEqual({ error: 'Authentication required' });
  });
});

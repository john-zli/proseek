import { beforeEach, describe, expect, mock, test } from 'bun:test';
import { Request, Response } from 'express';

import userRouter from '../user_routes';
import { NodeEnvs } from '@server/common/constants';
import { RouteError } from '@server/common/route_errors';
import HttpStatusCodes from '@server/common/status_codes';
import config from '@server/config';
import { createUser, generateInvitationCode, getUserByEmail } from '@server/models/users_storage';
import { createMockNext, createMockRequest, createMockResponse } from '@server/test/request_test_helper';

// Mock the users storage module
mock.module('@server/models/users_storage', () => ({
  createUser: mock(() =>
    Promise.resolve({
      userId: 'user123',
      email: 'test@example.com',
      firstName: 'Test',
      lastName: 'User',
      gender: 'male',
      creationTimestamp: new Date().toISOString(),
      modificationTimestamp: new Date().toISOString(),
    })
  ),
  getUserByEmail: mock(() =>
    Promise.resolve({
      userId: 'user123',
      email: 'test@example.com',
      firstName: 'Test',
      lastName: 'User',
      gender: 'male',
      passwordHash: '$2b$10$testhash',
      creationTimestamp: new Date().toISOString(),
      modificationTimestamp: new Date().toISOString(),
    })
  ),
  generateInvitationCode: mock(() => Promise.resolve('INVITE123')),
}));

describe('user routes', () => {
  beforeEach(() => {
    mock.resetAll();
  });

  test('POST / - should register a new user', async () => {
    // Create mock request
    const req = createMockRequest({
      body: {
        email: 'test@example.com',
        firstName: 'Test',
        lastName: 'User',
        gender: 'male',
        password: 'password123',
        invitationCode: 'INVITE123',
      },
      session: {
        regenerate: mock(callback => callback(null)),
      },
    }) as unknown as Request;

    // Create mock response
    const res = createMockResponse() as unknown as Response;

    // Create mock next function
    const next = createMockNext();

    // Call the route handler
    await userRouter._test.handle(req, res, next);

    // Verify response
    expect(res.status.mock.calls[0][0]).toBe(HttpStatusCodes.CREATED);
    expect(res.json.mock.calls[0][0]).toEqual({ userId: 'user123' });
    expect(req.session.user).toBeDefined();
  });

  test('POST /login - should login a user', async () => {
    // Create mock request
    const req = createMockRequest({
      body: {
        email: 'test@example.com',
        password: 'password123',
      },
      session: {
        regenerate: mock(callback => callback(null)),
      },
    }) as unknown as Request;

    // Create mock response
    const res = createMockResponse() as unknown as Response;

    // Create mock next function
    const next = createMockNext();

    // Call the route handler
    await userRouter._test.handle(req, res, next);

    // Verify response
    expect(res.status.mock.calls[0][0]).toBe(HttpStatusCodes.OK);
    expect(res.json.mock.calls[0][0].user).toBeDefined();
    expect(res.json.mock.calls[0][0].user).not.toHaveProperty('passwordHash');
    expect(req.session.user).toBeDefined();
  });

  test('POST /login - should handle development bypass for johnzli@hey.com', async () => {
    // Mock config to return development environment
    mock.module('@server/config', () => ({
      env: NodeEnvs.Dev,
    }));

    // Create mock request
    const req = createMockRequest({
      body: {
        email: 'johnzli@hey.com',
        password: 'anypassword',
      },
      session: {
        regenerate: mock(callback => callback(null)),
      },
    }) as unknown as Request;

    // Create mock response
    const res = createMockResponse() as unknown as Response;

    // Create mock next function
    const next = createMockNext();

    // Call the route handler
    await userRouter._test.handle(req, res, next);

    // Verify response
    expect(res.status.mock.calls[0][0]).toBe(HttpStatusCodes.OK);
    expect(res.json.mock.calls[0][0].user).toBeDefined();
    expect(req.session.user).toBeDefined();
  });

  test('POST /logout - should logout a user', async () => {
    // Create mock request
    const req = createMockRequest({
      session: {
        destroy: mock(callback => callback(null)),
      },
    }) as unknown as Request;

    // Create mock response
    const res = createMockResponse() as unknown as Response;

    // Create mock next function
    const next = createMockNext();

    // Call the route handler
    await userRouter._test.handle(req, res, next);

    // Verify response
    expect(res.status.mock.calls[0][0]).toBe(HttpStatusCodes.OK);
    expect(res.json.mock.calls[0][0]).toEqual({ message: 'Logout successful' });
    expect(res.clearCookie).toHaveBeenCalledWith('connect.sid');
  });

  test('POST /invite - should generate an invitation code', async () => {
    // Create mock request
    const req = createMockRequest({
      body: {
        email: 'newuser@example.com',
      },
      session: {
        user: {
          userId: 'user123',
          churchId: 'church123',
        },
      },
    }) as unknown as Request;

    // Create mock response
    const res = createMockResponse() as unknown as Response;

    // Create mock next function
    const next = createMockNext();

    // Call the route handler
    await userRouter._test.handle(req, res, next);

    // Verify response
    expect(res.status.mock.calls[0][0]).toBe(HttpStatusCodes.CREATED);
    expect(res.json.mock.calls[0][0]).toEqual({ invitationCode: 'INVITE123' });
  });

  test('GET /me - should return current user when authenticated', async () => {
    // Create mock request
    const req = createMockRequest({
      session: {
        user: {
          userId: 'user123',
          email: 'test@example.com',
        },
      },
    }) as unknown as Request;

    // Create mock response
    const res = createMockResponse() as unknown as Response;

    // Create mock next function
    const next = createMockNext();

    // Call the route handler
    await userRouter._test.handle(req, res, next);

    // Verify response
    expect(res.status.mock.calls[0][0]).toBe(HttpStatusCodes.OK);
    expect(res.json.mock.calls[0][0]).toEqual({
      user: {
        userId: 'user123',
        email: 'test@example.com',
      },
    });
  });

  test('GET /me - should return unauthorized when not authenticated', async () => {
    // Create mock request
    const req = createMockRequest() as unknown as Request;

    // Create mock response
    const res = createMockResponse() as unknown as Response;

    // Create mock next function
    const next = createMockNext();

    // Call the route handler
    await userRouter._test.handle(req, res, next);

    // Verify response
    expect(res.status.mock.calls[0][0]).toBe(HttpStatusCodes.UNAUTHORIZED);
    expect(res.json.mock.calls[0][0]).toEqual({ error: 'Not authenticated' });
  });
});

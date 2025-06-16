import { Mock, afterEach, beforeEach, describe, expect, test } from 'bun:test';

import { userRouter } from '../user_routes';
import { testRoute } from './test_helpers';
import { Gender } from '@common/server-api/types/gender';
import { SanitizedUser } from '@common/server-api/types/users';
import { RouteError } from '@server/common/route_errors';
import HttpStatusCodes from '@server/common/status_codes';
import { createChurch } from '@server/models/churches_storage';
import { createAdminUser, generateInvitationCode } from '@server/models/users_storage';
import { IServicesBuilder } from '@server/services/services_builder';
import { FakeServicesBuilder } from '@server/services/test/fake_services_builder';
import { setupTestDb, teardownTestDb } from '@server/test/db_test_helper';
import { MockResponse, createMockNext, createMockRequest, createMockResponse } from '@server/test/request_test_helper';

describe('user routes', () => {
  let res: MockResponse;
  let next: Mock;
  let services: IServicesBuilder;

  beforeEach(async () => {
    await setupTestDb();
    res = createMockResponse();
    next = createMockNext();
    services = new FakeServicesBuilder();
  });

  afterEach(async () => {
    await teardownTestDb();
  });

  describe('POST /', () => {
    let churchId: string;
    let adminUser: SanitizedUser;

    beforeEach(async () => {
      churchId = await createChurch({
        name: 'Test Church',
        address: '123 Main St, Anytown, USA',
        city: 'Anytown',
        state: 'CA',
        zip: '12345',
        county: 'Anytown',
      });

      adminUser = await createAdminUser({
        churchId,
        firstName: 'Test',
        lastName: 'User',
        email: 'test@example.com',
        gender: Gender.Male,
        passwordHash: 'password123',
      });
    });

    test('should register a new user', async () => {
      const code = await generateInvitationCode(churchId, adminUser.userId, 'test2@example.com');

      const req = createMockRequest({
        body: {
          email: 'test2@example.com',
          firstName: 'Test',
          lastName: 'User',
          gender: Gender.Male,
          password: 'password123',
          invitationCode: code,
        },
        session: {
          regenerate: (callback: (err: any) => void) => callback(null),
        },
      });

      // Call the route handler
      await testRoute(userRouter(services), 'POST', '/', req, res, next);

      expect(res.status.mock.calls[0][0]).toBe(HttpStatusCodes.CREATED);
      expect(res.json.mock.calls[0][0]).toEqual({ userId: expect.any(String) });
      expect(req.session.user?.userId).toBeDefined();
    });

    test('should error if user already exists', async () => {
      const code = await generateInvitationCode(churchId, adminUser.userId, 'test@example.com');

      // First registration
      const req1 = createMockRequest({
        body: {
          email: 'test@example.com',
          firstName: 'Test',
          lastName: 'User',
          gender: Gender.Male,
          password: 'password123',
          invitationCode: code,
        },
        session: {
          regenerate: (callback: (err: any) => void) => callback(null),
        },
      });

      await testRoute(userRouter(services), 'POST', '/', req1, res, next);

      expect(next.mock.calls[1][0]).toBeInstanceOf(RouteError);
      expect(next.mock.calls[1][0].status).toBe(HttpStatusCodes.CONFLICT);
      expect(next.mock.calls[1][0].message).toBe('User with this email already exists');
    });

    test('should error if invitation code is invalid', async () => {
      const req1 = createMockRequest({
        body: {
          email: 'test@example.com',
          firstName: 'Test',
          lastName: 'User',
          gender: Gender.Male,
          password: 'password123',
          invitationCode: '12345',
        },
        session: {
          regenerate: (callback: (err: any) => void) => callback(null),
        },
      });

      await testRoute(userRouter(services), 'POST', '/', req1, res, next);

      expect(next.mock.calls[1][0]).toBeInstanceOf(RouteError);
      expect(next.mock.calls[1][0].status).toBe(HttpStatusCodes.BAD_REQUEST);
      expect(next.mock.calls[1][0].message).toBe('Invalid or already used invitation code');
    });
  });

  describe('POST /admin', () => {
    let churchId: string;

    beforeEach(async () => {
      churchId = await createChurch({
        name: 'Test Church',
        address: '123 Main St, Anytown, USA',
        city: 'Anytown',
        state: 'CA',
        zip: '12345',
        county: 'Anytown',
      });
    });

    test('should create an admin user', async () => {
      const req = createMockRequest({
        body: {
          email: 'test@example.com',
          firstName: 'Test',
          lastName: 'User',
          gender: Gender.Male,
          password: 'password123',
          churchId,
        },
        session: {
          regenerate: (callback: (err: any) => void) => callback(null),
        },
      });

      await testRoute(userRouter(services), 'POST', '/admin', req, res, next);

      expect(res.status.mock.calls[0][0]).toBe(HttpStatusCodes.CREATED);
      expect(res.json.mock.calls[0][0]).toEqual({ userId: expect.any(String) });
      expect(req.session.user?.userId).toBeDefined();
    });

    test('should error if user already exists', async () => {
      await createAdminUser({
        churchId,
        firstName: 'Test',
        lastName: 'User',
        email: 'test@example.com',
        gender: Gender.Male,
        passwordHash: 'password123',
      });

      const req = createMockRequest({
        body: {
          email: 'test@example.com',
          firstName: 'Test',
          lastName: 'User',
          gender: Gender.Male,
          password: 'password123',
          churchId,
        },
        session: {
          regenerate: (callback: (err: any) => void) => callback(null),
        },
      });

      await testRoute(userRouter(services), 'POST', '/admin', req, res, next);

      expect(next.mock.calls[1][0]).toBeInstanceOf(RouteError);
      expect(next.mock.calls[1][0].status).toBe(HttpStatusCodes.CONFLICT);
      expect(next.mock.calls[1][0].message).toBe('User with this email already exists');
    });
  });

  describe('POST /login', () => {
    let churchId: string;

    beforeEach(async () => {
      churchId = await createChurch({
        name: 'Test Church',
        address: '123 Main St, Anytown, USA',
        city: 'Anytown',
        state: 'CA',
        zip: '12345',
        county: 'Anytown',
      });

      const req = createMockRequest({
        body: {
          email: 'test@example.com',
          password: 'password123',
          churchId,
          firstName: 'Test',
          lastName: 'User',
          gender: Gender.Male,
        },
        session: {
          regenerate: (callback: (err: any) => void) => callback(null),
        },
      });

      const fakeRes = createMockResponse();
      const fakeNext = createMockNext();
      await testRoute(userRouter(services), 'POST', '/admin', req, fakeRes, fakeNext);

      expect(fakeRes.status.mock.calls[0][0]).toBe(HttpStatusCodes.CREATED);
    });

    test('should login a user', async () => {
      const req = createMockRequest({
        body: {
          email: 'test@example.com',
          password: 'password123',
        },
        session: {
          regenerate: (callback: (err: any) => void) => callback(null),
        },
      });

      await testRoute(userRouter(services), 'POST', '/login', req, res, next);

      expect(res.status.mock.calls[0][0]).toBe(HttpStatusCodes.OK);
      expect(res.json.mock.calls[0][0]).toEqual({ user: expect.any(Object) });
      expect(res.json.mock.calls[0][0].user).not.toHaveProperty('passwordHash');
    });

    test('should error if email is invalid', async () => {
      const req = createMockRequest({
        body: {
          email: 'invalid@example.com',
          password: 'password123',
        },
        session: {
          regenerate: (callback: (err: any) => void) => callback(null),
        },
      });

      await testRoute(userRouter(services), 'POST', '/login', req, res, next);

      expect(next.mock.calls[1][0]).toBeInstanceOf(RouteError);
      expect(next.mock.calls[1][0].status).toBe(HttpStatusCodes.UNAUTHORIZED);
      expect(next.mock.calls[1][0].message).toBe('Invalid email or password');
    });

    test('should error if password is invalid', async () => {
      const req = createMockRequest({
        body: {
          email: 'test@example.com',
          password: 'invalidpassword',
        },
        session: {
          regenerate: (callback: (err: any) => void) => callback(null),
        },
      });

      await testRoute(userRouter(services), 'POST', '/login', req, res, next);

      expect(next.mock.calls[1][0]).toBeInstanceOf(RouteError);
      expect(next.mock.calls[1][0].status).toBe(HttpStatusCodes.UNAUTHORIZED);
      expect(next.mock.calls[1][0].message).toBe('Invalid email or password');
    });
  });

  describe('POST /logout', () => {
    let churchId: string;

    beforeEach(async () => {
      churchId = await createChurch({
        name: 'Test Church',
        address: '123 Main St, Anytown, USA',
        city: 'Anytown',
        state: 'CA',
        zip: '12345',
        county: 'Anytown',
      });

      const req = createMockRequest({
        body: {
          email: 'test@example.com',
          password: 'password123',
          churchId,
          firstName: 'Test',
          lastName: 'User',
          gender: Gender.Male,
        },
        session: {
          regenerate: (callback: (err: any) => void) => callback(null),
        },
      });

      const fakeRes = createMockResponse();
      const fakeNext = createMockNext();
      await testRoute(userRouter(services), 'POST', '/admin', req, fakeRes, fakeNext);

      expect(fakeRes.status.mock.calls[0][0]).toBe(HttpStatusCodes.CREATED);
    });

    test('should logout a user', async () => {
      const req = createMockRequest({
        session: {
          destroy: (callback: (err: any) => void) => callback(null),
        },
      });

      await testRoute(userRouter(services), 'POST', '/logout', req, res, next);

      expect(res.status.mock.calls[0][0]).toBe(HttpStatusCodes.OK);
      expect(res.json.mock.calls[0][0]).toEqual({ message: 'Logout successful' });
      expect(req.session.user).toBeUndefined();
    });
  });

  describe('POST /invite', () => {
    let churchId: string;
    let adminUser: SanitizedUser;
    beforeEach(async () => {
      churchId = await createChurch({
        name: 'Test Church',
        address: '123 Main St, Anytown, USA',
        city: 'Anytown',
        state: 'CA',
        zip: '12345',
        county: 'Anytown',
      });

      adminUser = await createAdminUser({
        churchId,
        firstName: 'Test',
        lastName: 'User',
        email: 'test@example.com',
        gender: Gender.Male,
        passwordHash: 'password123',
      });
    });

    test('should generate an invitation code', async () => {
      // Create mock request
      const req = createMockRequest({
        body: {
          email: 'newuser@example.com',
        },
        session: {
          user: {
            userId: adminUser.userId,
            churchId: churchId,
          },
        },
      });

      // Call the route handler
      await testRoute(userRouter(services), 'POST', '/invite', req, res, next);

      // Verify response
      expect(res.status.mock.calls[0][0]).toBe(HttpStatusCodes.CREATED);
      expect(res.json.mock.calls[0][0]).toEqual({ invitationCode: expect.any(String) });
    });

    test('should error if not authenticated', async () => {
      const req = createMockRequest();
      await testRoute(userRouter(services), 'POST', '/invite', req, res, next);

      expect(next.mock.calls[0][0]).toBeInstanceOf(RouteError);
      expect(next.mock.calls[0][0].status).toBe(HttpStatusCodes.UNAUTHORIZED);
    });
  });
});

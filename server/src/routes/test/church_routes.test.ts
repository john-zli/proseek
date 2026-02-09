import { afterEach, beforeEach, describe, expect, mock, test } from 'bun:test';

import { churchRouter } from '../church_routes';
import { testRoute } from './test_helpers';
import { RouteError } from '@server/common/route_errors';
import HttpStatusCodes from '@server/common/status_codes';
import { IServicesBuilder } from '@server/services/services_builder';
import { FakeServicesBuilder } from '@server/services/test/fake_services_builder';
import { setupTestDb, teardownTestDb } from '@server/test/db_test_helper';
import { MockResponse, createMockNext, createMockRequest, createMockResponse } from '@server/test/request_test_helper';
import { MockNextFunction } from '@server/test/request_test_helper';

describe('church routes', () => {
  let res: MockResponse;
  let next: MockNextFunction;
  let services: IServicesBuilder;
  beforeEach(async () => {
    await setupTestDb();
    res = createMockResponse();
    next = createMockNext();
    services = new FakeServicesBuilder();
  });

  afterEach(async () => {
    await teardownTestDb();
    mock.restore();
  });

  test('POST / - should create a new church', async () => {
    // Create mock request
    const req = createMockRequest({
      body: {
        name: 'Test Church',
        address: '123 Test St',
        city: 'Test City',
        state: 'TS',
        zip: '12345',
        email: 'test@church.com',
      },
      session: {
        user: {
          userId: 'user123',
          churchId: 'church123',
        },
      },
    });

    // Call the route handler
    await testRoute(churchRouter(services), 'POST', '/', req, res, next);

    expect(res.status.mock.calls[0][0]).toBe(HttpStatusCodes.CREATED);
    expect(res.json.mock.calls[0][0]).toEqual(expect.any(String));
  });

  test('POST / - should handle storage errors', async () => {
    // Mock createChurch to throw an error
    mock.module('@server/models/churches_storage', () => ({
      createChurch: mock(() => Promise.reject(new Error('Storage error'))),
    }));

    // Create mock request
    const req = createMockRequest({
      body: {
        name: 'Test Church',
        address: '123 Test St',
        city: 'Test City',
        state: 'TS',
        zip: '12345',
        email: 'test@church.com',
      },
      session: {
        user: {
          userId: 'user123',
          churchId: 'church123',
        },
      },
    });

    // Call the route handler
    await testRoute(churchRouter(services), 'POST', '/', req, res, next);

    const lastCall = next.mock.calls.pop();
    expect(lastCall?.[0]).toBeInstanceOf(RouteError);
    expect((lastCall?.[0] as RouteError).status).toBe(HttpStatusCodes.INTERNAL_SERVER_ERROR);
  });

  test('POST / - should return 401 if not authenticated', async () => {
    // Create mock request without session
    const req = createMockRequest({
      body: {
        name: 'Test Church',
        address: '123 Test St',
        city: 'Test City',
        state: 'TS',
        zip: '12345',
      },
    });

    // Call the route handler
    await testRoute(churchRouter(services), 'POST', '/', req, res, next);

    const firstCall = next.mock.calls[0];
    expect(firstCall?.[0]).toBeInstanceOf(RouteError);
    expect((firstCall?.[0] as RouteError).status).toBe(HttpStatusCodes.UNAUTHORIZED);
  });

  test('POST / - should return 400 if request body is invalid', async () => {
    // Create mock request with invalid body
    const req = createMockRequest({
      body: {
        // Missing required fields
        name: 'Test Church',
        // address, city, state, zip are missing
      },
      session: {
        user: {
          userId: 'user123',
          churchId: 'church123',
        },
      },
    });

    // Call the route handler
    await testRoute(churchRouter(services), 'POST', '/', req, res, next);

    const validationCall = next.mock.calls[1];
    expect(validationCall[0]).toBeInstanceOf(RouteError);
    expect((validationCall?.[0] as RouteError).status).toBe(HttpStatusCodes.BAD_REQUEST);
  });
});

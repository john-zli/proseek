import { afterEach, beforeEach, describe, expect, test } from 'bun:test';

import { prayerRequestChatsRouter } from '../prayer_request_chats_routes';
import { testRoute } from './test_helpers';
import { Gender } from '@common/server-api/types/gender';
import { RouteError } from '@server/common/route_errors';
import HttpStatusCodes from '@server/common/status_codes';
import { createChurch } from '@server/models/churches_storage';
import {
  assignPrayerRequestChat,
  createPrayerRequestChat,
  createPrayerRequestChatMessage,
  listPrayerRequestChatMessages,
  listPrayerRequestChats,
} from '@server/models/prayer_request_chats_storage';
import { createAdminUser } from '@server/models/users_storage';
import { IServicesBuilder } from '@server/services/services_builder';
import { FakeServicesBuilder } from '@server/services/test/fake_services_builder';
import { setupTestDb, teardownTestDb } from '@server/test/db_test_helper';
import { MockResponse, createMockNext, createMockRequest, createMockResponse } from '@server/test/request_test_helper';
import { MockNextFunction } from '@server/test/request_test_helper';
import { v4 as uuidv4 } from 'uuid';

describe('prayer request chats routes', () => {
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
  });

  describe('POST /', () => {
    test('should create a new prayer request', async () => {
      const churchId = await createChurch({
        name: 'Test Church',
        address: '123 Main St, Anytown, USA',
        city: 'Anytown',
        state: 'CA',
        zip: '12345',
        county: 'Anytown',
        email: 'test@church.com',
      });

      const req = createMockRequest({
        body: {
          title: 'Test Prayer Request',
          description: 'Test Description',
          token: 'test-token',
          messages: [
            {
              message: 'Test Message',
              messageId: uuidv4(),
              messageTimestamp: Date.now(),
            },
          ],
        },
        ipLocation: {
          city: 'Anytown',
          region: 'CA',
          latitude: 37.774929,
          longitude: -122.419416,
        },
      });

      // Call the route handler
      await testRoute(prayerRequestChatsRouter(services), 'POST', '/', req, res, next);

      // Verify response
      expect(res.status.mock.calls[0][0]).toBe(HttpStatusCodes.CREATED);
      expect(res.json.mock.calls[0][0]).toEqual({ chatroomId: expect.any(String) });

      // Check that prayer request is assigned to the church.
      const prayerRequestChats = await listPrayerRequestChats({ churchId });
      expect(prayerRequestChats).toHaveLength(1);
      expect(prayerRequestChats[0]).toHaveProperty('assignedChurchId', churchId);
    });

    test('does not assign a prayer request to a church if the church is too far away', async () => {
      const churchId = await createChurch({
        name: 'Test Church',
        address: '123 Main St, Anytown, USA',
        city: 'Anytown',
        state: 'CA',
        zip: '12345',
        county: 'Anytown',
        email: 'test@church.com',
      });

      const req = createMockRequest({
        body: {
          title: 'Test Prayer Request',
          description: 'Test Description',
          token: 'test-token',
          messages: [
            {
              message: 'Test Message',
              messageId: uuidv4(),
              messageTimestamp: Date.now(),
            },
          ],
        },
        ipLocation: {
          city: 'Anytown',
          region: 'CA',
          latitude: 37.774929,
          longitude: 122.419416,
        },
      });

      // Call the route handler
      await testRoute(prayerRequestChatsRouter(services), 'POST', '/', req, res, next);

      // Verify response
      expect(res.status.mock.calls[0][0]).toBe(HttpStatusCodes.CREATED);
      expect(res.json.mock.calls[0][0]).toEqual({ chatroomId: expect.any(String) });

      // Check that prayer request is not assigned to the church.
      const prayerRequestChats = await listPrayerRequestChats({ churchId });
      expect(prayerRequestChats).toHaveLength(0);
    });
  });

  describe('POST /:requestId/assign', () => {
    test('should assign a prayer request to a church', async () => {
      const churchId = await createChurch({
        name: 'Test Church',
        address: '123 Main St, Anytown, USA',
        city: 'Anytown',
        state: 'CA',
        zip: '12345',
        county: 'Anytown',
        email: 'test@church.com',
      });

      const prayerRequestChatId = await createPrayerRequestChat({
        requestContactEmail: 'test@example.com',
        requestContactPhone: '1234567890',
        zip: '12345',
        city: 'Anytown',
        region: 'CA',
        messages: [],
        churchId,
      });

      const user = await createAdminUser({
        churchId,
        firstName: 'Test',
        lastName: 'User',
        email: 'test@example.com',
        gender: Gender.Male,
        passwordHash: 'password',
      });

      await assignPrayerRequestChat({
        requestId: prayerRequestChatId,
        userId: user.userId,
      });

      const req = createMockRequest({
        params: {
          requestId: prayerRequestChatId,
        },
        body: {
          // TODO(johnli): Remove from the body.
          userId: user.userId,
        },
        session: {
          user: {
            userId: user.userId,
            churchId,
          },
        },
      });

      // Call the route handler
      await testRoute(prayerRequestChatsRouter(services), 'POST', '/:requestId/assign', req, res, next);

      const prayerRequestChat = await listPrayerRequestChats({ churchId });

      expect(res.status.mock.calls[0][0]).toBe(HttpStatusCodes.OK);
      expect(prayerRequestChat).toHaveLength(1);
      expect(prayerRequestChat[0]).toHaveProperty('assignedUserId', user.userId);
    });
  });

  describe('POST /:requestId/message', () => {
    test('should create a chat message', async () => {
      const prayerRequestChatId = await createPrayerRequestChat({
        requestContactEmail: 'test@example.com',
        requestContactPhone: '1234567890',
        zip: '12345',
        city: 'Anytown',
        region: 'CA',
        messages: [],
      });

      const messageId = uuidv4();
      const messageTimestamp = Date.now();
      const req = createMockRequest({
        params: {
          requestId: prayerRequestChatId,
        },
        body: {
          message: 'Test Message',
          messageId,
          messageTimestamp,
        },
      });

      // Call the route handler
      await testRoute(prayerRequestChatsRouter(services), 'POST', '/:requestId/message', req, res, next);

      const prayerRequestChatMessages = await listPrayerRequestChatMessages({ requestId: prayerRequestChatId });

      // Verify response
      expect(res.status.mock.calls[0][0]).toBe(HttpStatusCodes.CREATED);
      expect(prayerRequestChatMessages).toHaveLength(1);
      expect(prayerRequestChatMessages[0]).toMatchObject({
        message: 'Test Message',
        messageId,
        // TODO(johnli): Fix this timestamp management
        messageTimestamp: Math.floor(messageTimestamp / 1000),
      });
    });
  });

  describe('GET /:requestId/messages', () => {
    test('should list chat messages', async () => {
      const prayerRequestChatId = await createPrayerRequestChat({
        requestContactEmail: 'test@example.com',
        requestContactPhone: '1234567890',
        zip: '12345',
        city: 'Anytown',
        region: 'CA',
        messages: [],
      });

      await createPrayerRequestChatMessage({
        requestId: prayerRequestChatId,
        message: 'Test Message',
        messageId: uuidv4(),
        messageTimestamp: Date.now(),
      });

      const req = createMockRequest({
        params: {
          requestId: prayerRequestChatId,
        },
      });

      // Call the route handler
      await testRoute(prayerRequestChatsRouter(services), 'GET', '/:requestId/messages', req, res, next);

      // Verify response
      expect(res.status.mock.calls[0][0]).toBe(HttpStatusCodes.OK);
      expect(res.json.mock.calls[0][0]).toHaveProperty('messages');
      expect((res.json.mock.calls[0][0] as { messages: { message: string }[] }).messages).toHaveLength(1);
      expect((res.json.mock.calls[0][0] as { messages: { message: string }[] }).messages[0]).toHaveProperty(
        'message',
        'Test Message'
      );
    });
  });

  describe('POST /:requestId/verify', () => {
    test('should throw error if verification fails', async () => {
      const prayerRequestChatId = await createPrayerRequestChat({
        requestContactEmail: 'test@example.com',
        zip: '12345',
        city: 'Anytown',
        region: 'CA',
        messages: [],
      });

      const req = createMockRequest({
        params: {
          requestId: prayerRequestChatId,
        },
        body: {
          requestContactEmail: 'wrong@example.com', // Different email
          token: 'test-token',
        },
        session: {
          verifiedChatIds: [],
        },
      });

      // Call the route handler
      await testRoute(prayerRequestChatsRouter(services), 'POST', '/:requestId/verify', req, res, next);

      // Verify response
      expect(next.mock.calls[2][0]).toBeInstanceOf(RouteError);
      expect((next.mock.calls[2][0] as RouteError).status).toBe(HttpStatusCodes.NOT_FOUND);
      expect((next.mock.calls[2][0] as RouteError).message).toBe('Prayer request not found or verification failed');
    });

    test('should verify a prayer request', async () => {
      // Create mock request
      const prayerRequestChatId = await createPrayerRequestChat({
        requestContactEmail: 'test@example.com',
        requestContactPhone: '1234567890',
        zip: '12345',
        city: 'Anytown',
        region: 'CA',
        messages: [],
      });

      const req = createMockRequest({
        params: {
          requestId: prayerRequestChatId,
        },
        body: {
          requestContactEmail: 'test@example.com',
          requestContactPhone: '1234567890',
          token: 'test-token',
        },
        session: {
          verifiedChatIds: [],
        },
      });

      // Call the route handler
      await testRoute(prayerRequestChatsRouter(services), 'POST', '/:requestId/verify', req, res, next);

      // Verify response
      expect(res.status.mock.calls[0][0]).toBe(HttpStatusCodes.OK);
      expect(res.json.mock.calls[0][0]).toEqual({ isVerified: true });
      expect(req.session.verifiedChatIds).toContain(prayerRequestChatId);
    });
  });

  describe('GET /church/:churchId', () => {
    test('should return prayer requests for the authenticated user church', async () => {
      const churchId = await createChurch({
        name: 'Test Church',
        address: '123 Main St',
        city: 'Anytown',
        state: 'CA',
        zip: '12345',
        county: 'Anytown',
        email: 'test@church.com',
      });

      const user = await createAdminUser({
        churchId,
        firstName: 'Test',
        lastName: 'User',
        email: 'test@example.com',
        gender: Gender.Male,
        passwordHash: 'password',
      });

      const prayerRequestChatId = await createPrayerRequestChat({
        requestContactEmail: 'requester@example.com',
        requestContactPhone: '1234567890',
        zip: '12345',
        city: 'Anytown',
        region: 'CA',
        messages: [],
        churchId,
      });

      const req = createMockRequest({
        params: {
          churchId,
        },
        session: {
          user: {
            userId: user.userId,
            churchIds: [churchId],
            firstName: 'Test',
            lastName: 'User',
            email: 'test@example.com',
            gender: Gender.Male,
          },
        },
      });

      await testRoute(prayerRequestChatsRouter(services), 'GET', `/church/:churchId`, req, res, next);

      expect(res.status.mock.calls[0][0]).toBe(HttpStatusCodes.OK);
      const responseBody = res.json.mock.calls[0][0] as { prayerRequests: { requestId: string }[] };
      expect(responseBody.prayerRequests).toHaveLength(1);
      expect(responseBody.prayerRequests[0]).toHaveProperty('requestId', prayerRequestChatId);
    });

    test('should return 401 if not authenticated', async () => {
      const churchId = await createChurch({
        name: 'Test Church',
        address: '123 Main St',
        city: 'Anytown',
        state: 'CA',
        zip: '12345',
        county: 'Anytown',
        email: 'test@church.com',
      });

      const req = createMockRequest({
        params: {
          churchId,
        },
        session: {},
      });

      await testRoute(prayerRequestChatsRouter(services), 'GET', `/church/:churchId`, req, res, next);
      // 1 because we fail on ensureAuthenticated, happening after validate middleware.
      expect(next.mock.calls[1][0]).toBeInstanceOf(RouteError);
      expect((next.mock.calls[1][0] as RouteError).status).toBe(HttpStatusCodes.UNAUTHORIZED);
    });
  });

  describe('GET /:requestId/messages (church member auth)', () => {
    test('should allow authenticated church member to view messages', async () => {
      const churchId = await createChurch({
        name: 'Test Church',
        address: '123 Main St',
        city: 'Anytown',
        state: 'CA',
        zip: '12345',
        county: 'Anytown',
        email: 'test@church.com',
      });

      const user = await createAdminUser({
        churchId,
        firstName: 'Test',
        lastName: 'User',
        email: 'test@example.com',
        gender: Gender.Male,
        passwordHash: 'password',
      });

      const prayerRequestChatId = await createPrayerRequestChat({
        requestContactEmail: 'requester@example.com',
        requestContactPhone: '1234567890',
        zip: '12345',
        city: 'Anytown',
        region: 'CA',
        messages: [],
        churchId,
      });

      await createPrayerRequestChatMessage({
        requestId: prayerRequestChatId,
        message: 'Test Message',
        messageId: uuidv4(),
        messageTimestamp: Date.now(),
      });

      const req = createMockRequest({
        params: { requestId: prayerRequestChatId },
        session: {
          user: {
            userId: user.userId,
            churchIds: [churchId],
            firstName: 'Test',
            lastName: 'User',
            email: 'test@example.com',
            gender: Gender.Male,
          },
        },
      });

      await testRoute(prayerRequestChatsRouter(services), 'GET', '/:requestId/messages', req, res, next);

      expect(res.status.mock.calls[0][0]).toBe(HttpStatusCodes.OK);
      const responseBody = res.json.mock.calls[0][0] as { messages: { message: string }[] };
      expect(responseBody.messages).toHaveLength(1);
      expect(responseBody.messages[0]).toHaveProperty('message', 'Test Message');
    });

    test('should return 403 if authenticated user belongs to a different church', async () => {
      const churchId = await createChurch({
        name: 'Test Church',
        address: '123 Main St',
        city: 'Anytown',
        state: 'CA',
        zip: '12345',
        county: 'Anytown',
        email: 'test@church.com',
      });

      const otherChurchId = await createChurch({
        name: 'Other Church',
        address: '456 Other St',
        city: 'Othertown',
        state: 'CA',
        zip: '54321',
        county: 'Other County',
        email: 'other@church.com',
      });

      const user = await createAdminUser({
        churchId: otherChurchId,
        firstName: 'Other',
        lastName: 'User',
        email: 'other@example.com',
        gender: Gender.Male,
        passwordHash: 'password',
      });

      const prayerRequestChatId = await createPrayerRequestChat({
        requestContactEmail: 'requester@example.com',
        requestContactPhone: '1234567890',
        zip: '12345',
        city: 'Anytown',
        region: 'CA',
        messages: [],
        churchId,
      });

      const req = createMockRequest({
        params: { requestId: prayerRequestChatId },
        session: {
          user: {
            userId: user.userId,
            churchIds: [otherChurchId],
            firstName: 'Other',
            lastName: 'User',
            email: 'other@example.com',
            gender: Gender.Male,
          },
        },
      });

      await testRoute(prayerRequestChatsRouter(services), 'GET', '/:requestId/messages', req, res, next);

      // Should get a 403 error via next()
      const lastNextCall = next.mock.calls[next.mock.calls.length - 1][0];
      expect(lastNextCall).toBeInstanceOf(RouteError);
      expect((lastNextCall as RouteError).status).toBe(HttpStatusCodes.FORBIDDEN);
    });
  });

  describe('POST /:requestId/message (with authenticated user)', () => {
    test('should include userId from session when authenticated', async () => {
      const churchId = await createChurch({
        name: 'Test Church',
        address: '123 Main St',
        city: 'Anytown',
        state: 'CA',
        zip: '12345',
        county: 'Anytown',
        email: 'test@church.com',
      });

      const user = await createAdminUser({
        churchId,
        firstName: 'Test',
        lastName: 'User',
        email: 'test@example.com',
        gender: Gender.Male,
        passwordHash: 'password',
      });

      const prayerRequestChatId = await createPrayerRequestChat({
        requestContactEmail: 'requester@example.com',
        requestContactPhone: '1234567890',
        zip: '12345',
        city: 'Anytown',
        region: 'CA',
        messages: [],
        churchId,
      });

      const messageId = uuidv4();
      const messageTimestamp = Date.now();
      const req = createMockRequest({
        params: { requestId: prayerRequestChatId },
        body: {
          message: 'Church response',
          messageId,
          messageTimestamp,
        },
        session: {
          user: {
            userId: user.userId,
            churchId,
            firstName: 'Test',
            lastName: 'User',
            email: 'test@example.com',
            gender: Gender.Male,
          },
        },
      });

      await testRoute(prayerRequestChatsRouter(services), 'POST', '/:requestId/message', req, res, next);

      expect(res.status.mock.calls[0][0]).toBe(HttpStatusCodes.CREATED);

      // Verify message was saved with userId
      const messages = await listPrayerRequestChatMessages({ requestId: prayerRequestChatId });
      expect(messages).toHaveLength(1);
      expect(messages[0]).toMatchObject({
        message: 'Church response',
        messageId,
        userId: user.userId,
      });
    });
  });
});

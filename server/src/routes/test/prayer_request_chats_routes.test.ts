import { Mock, afterEach, beforeEach, describe, expect, test } from 'bun:test';
import { v4 as uuidv4 } from 'uuid';

import { prayerRequestChatsRouter } from '../prayer_request_chats_routes';
import { testRoute } from './test_helpers';
import { Gender } from '@common/server-api/types/gender';
import { RouteError } from '@server/common/route_errors';
import HttpStatusCodes from '@server/common/status_codes';
import { createChurch, listChurchesNearUser } from '@server/models/churches_storage';
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

describe('prayer request chats routes', () => {
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
    test('should create a new prayer request', async () => {
      const churchId = await createChurch({
        name: 'Test Church',
        address: '123 Main St, Anytown, USA',
        city: 'Anytown',
        state: 'CA',
        zip: '12345',
        county: 'Anytown',
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

  describe('GET /church/:churchId', () => {
    test('should list prayer requests for a church', async () => {
      /** Setting up test data */
      let churches = await listChurchesNearUser({ zip: '12345' });

      const churchId = await createChurch({
        name: 'Test Church',
        address: '123 Main St, Anytown, USA',
        city: 'Anytown',
        state: 'CA',
        zip: '12345',
        county: 'Anytown',
      });

      churches = await listChurchesNearUser({ zip: '12345' });

      const prayerRequestChatId = await createPrayerRequestChat({
        requestContactEmail: 'test@example.com',
        requestContactPhone: '1234567890',
        zip: '12345',
        city: 'Anytown',
        region: 'CA',
        messages: [],
        churchId,
      });

      // Create mock request
      const req = createMockRequest({
        params: {
          churchId,
        },
      });

      // Call the route handler
      await testRoute(prayerRequestChatsRouter(services), 'GET', '/church/:churchId', req, res, next);

      // Verify response
      expect(res.status.mock.calls[0][0]).toBe(HttpStatusCodes.OK);
      expect(res.json.mock.calls[0][0]).toHaveLength(1);
      expect(res.json.mock.calls[0][0][0]).toHaveProperty('requestId', prayerRequestChatId);
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
        churchId,
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
      expect(res.json.mock.calls[0][0].messages).toHaveLength(1);
      expect(res.json.mock.calls[0][0].messages[0]).toHaveProperty('message', 'Test Message');
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
      expect(next.mock.calls[2][0].status).toBe(HttpStatusCodes.NOT_FOUND);
      expect(next.mock.calls[2][0].message).toBe('Prayer request not found or verification failed');
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
});

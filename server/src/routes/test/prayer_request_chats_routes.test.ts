import { Mock, afterEach, beforeEach, describe, expect, mock, test } from 'bun:test';
import { v4 as uuidv4 } from 'uuid';

import prayerRequestChatsRouter from '../prayer_request_chats_routes';
import { testRoute } from './test_helpers';
import HttpStatusCodes from '@server/common/status_codes';
import { setupTestDb, teardownTestDb } from '@server/test/db_test_helper';
import { MockResponse, createMockNext, createMockRequest, createMockResponse } from '@server/test/request_test_helper';

describe('prayer request chats routes', () => {
  let res: MockResponse;
  let next: Mock;

  beforeEach(() => {
    setupTestDb();
    res = createMockResponse();
    next = createMockNext();
  });

  afterEach(() => {
    teardownTestDb();
  });

  test('POST / - should create a new prayer request', async () => {
    // Create mock request
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
        city: 'Test City',
        region: 'Test Region',
      },
    });

    // Call the route handler
    await testRoute(prayerRequestChatsRouter, 'POST', '/', req, res, next);

    // Verify response
    expect(res.status.mock.calls[0][0]).toBe(HttpStatusCodes.CREATED);
    expect(res.json.mock.calls[0][0]).toEqual({ chatroomId: expect.any(String) });
  });

  test('GET /church/:churchId - should list prayer requests for a church', async () => {
    // Create mock request
    const req = createMockRequest({
      params: {
        churchId: 'church123',
      },
    });

    // Call the route handler
    await testRoute(prayerRequestChatsRouter, 'GET', '/church/:churchId', req, res, next);

    // Verify response
    expect(res.status.mock.calls[0][0]).toBe(HttpStatusCodes.OK);
    expect(res.json.mock.calls[0][0]).toHaveLength(1);
    expect(res.json.mock.calls[0][0][0]).toHaveProperty('id', 'chat123');
    expect(res.json.mock.calls[0][0][0]).toHaveProperty('title', 'Test Prayer Request');
  });

  test('POST /:requestId/message - should create a chat message', async () => {
    // Create mock request
    const req = createMockRequest({
      params: {
        requestId: 'chat123',
      },
      body: {
        message: 'Test Message',
        messageId: 'msg123',
        messageTimestamp: new Date().toISOString(),
      },
    });

    // Call the route handler
    await testRoute(prayerRequestChatsRouter, 'POST', '/:requestId/message', req, res, next);

    // Verify response
    expect(res.status.mock.calls[0][0]).toBe(HttpStatusCodes.CREATED);
  });

  test('GET /:requestId/messages - should list chat messages', async () => {
    // Create mock request
    const req = createMockRequest({
      params: {
        requestId: 'chat123',
      },
    });

    // Call the route handler
    await testRoute(prayerRequestChatsRouter, 'GET', '/:requestId/messages', req, res, next);

    // Verify response
    expect(res.status.mock.calls[0][0]).toBe(HttpStatusCodes.OK);
    expect(res.json.mock.calls[0][0]).toHaveProperty('messages');
    expect(res.json.mock.calls[0][0].messages).toHaveLength(1);
    expect(res.json.mock.calls[0][0].messages[0]).toHaveProperty('message', 'Test Message');
  });

  test('POST /:requestId/verify - should verify a prayer request', async () => {
    // Create mock request
    const req = createMockRequest({
      params: {
        requestId: 'chat123',
      },
      body: {
        requestContactEmail: 'test@example.com',
        requestContactPhone: '1234567890',
      },
      session: {
        verifiedChatIds: [],
      },
    });

    // Call the route handler
    await testRoute(prayerRequestChatsRouter, 'POST', '/:requestId/verify', req, res, next);

    // Verify response
    expect(res.status.mock.calls[0][0]).toBe(HttpStatusCodes.OK);
    expect(res.json.mock.calls[0][0]).toEqual({ isVerified: true });
    expect(req.session.verifiedChatIds).toContain('chat123');
  });
});

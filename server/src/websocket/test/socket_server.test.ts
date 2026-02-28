import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, test } from 'bun:test';

import { setupSocketServer } from '../socket_server';
import { Gender } from '@common/server-api/types/gender';
import { createChurch } from '@server/models/churches_storage';
import { createPrayerRequestChat } from '@server/models/prayer_request_chats_storage';
import { createAdminUser } from '@server/models/users_storage';
import { setupTestDb, teardownTestDb } from '@server/test/db_test_helper';
import { createServer } from 'http';
import type { Server as HttpServer } from 'http';
import type { Server } from 'socket.io';
import { io as ioClient, Socket as ClientSocket } from 'socket.io-client';

let testSessionData: Record<string, unknown> = {};

function mockSessionMiddleware(req: unknown, _res: unknown, next: unknown) {
  (req as { session?: Record<string, unknown> }).session = { ...testSessionData, cookie: { secure: false } };
  (next as () => void)();
}

describe('socket_server', () => {
  let httpServer: HttpServer;
  let ioServer: Server;
  let port: number;

  // Single server for the entire describe block
  beforeAll(async () => {
    httpServer = createServer();
    await new Promise<void>(resolve => {
      httpServer.listen(0, () => {
        const addr = httpServer.address();
        port = typeof addr === 'object' && addr ? addr.port : 0;
        resolve();
      });
    });
    ioServer = setupSocketServer(httpServer, {
      sessionMiddlewareOverride: mockSessionMiddleware,
    });
  });

  afterAll(() => {
    ioServer.disconnectSockets(true);
    ioServer.close();
    // Force exit — socket.io/Redis/DB pool keep handles open that prevent bun from exiting.
    // Safe because test_runner.sh runs each test file as its own process.
    setTimeout(() => process.exit(0), 1000);
  });

  function connectClient(): ClientSocket {
    return ioClient(`http://localhost:${port}`, {
      transports: ['websocket'],
      forceNew: true,
    });
  }

  describe('join_room', () => {
    let churchId: string;
    let requestId: string;
    let userId: string;

    beforeEach(async () => {
      await setupTestDb();

      churchId = await createChurch({
        name: 'Test Church',
        address: '123 Main St',
        city: 'Test City',
        state: 'CA',
        zip: '12345',
        county: 'Test County',
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
      userId = user.userId;

      requestId = await createPrayerRequestChat({
        requestContactEmail: 'seeker@example.com',
        requestContactPhone: '1234567890',
        zip: '12345',
        city: 'Test City',
        churchId,
        messages: [
          {
            message: 'Please pray for me',
            messageId: '123e4567-e89b-12d3-a456-426614174000',
            messageTimestamp: Date.now(),
          },
        ],
      });
    });

    afterEach(async () => {
      ioServer.disconnectSockets(true);
      testSessionData = {};
      await teardownTestDb();
    });

    test('seeker join with valid verifiedChatId should receive joined', done => {
      testSessionData = { verifiedChatIds: [requestId] };
      const client = connectClient();

      client.on('connect', () => {
        client.emit('join_room', { requestId });
      });

      client.on('joined', (data: { requestId: string }) => {
        expect(data.requestId).toBe(requestId);
        client.disconnect();
        done();
      });

      client.on('join_error', (err: { message: string }) => {
        client.disconnect();
        done(new Error(`Unexpected error: ${err.message}`));
      });
    });

    test('church member join with valid churchId should receive joined', done => {
      testSessionData = {
        user: {
          userId,
          churchIds: [churchId],
          firstName: 'Test',
          lastName: 'User',
          email: 'test@example.com',
          gender: Gender.Male,
        },
      };
      const client = connectClient();

      client.on('connect', () => {
        client.emit('join_room', { requestId });
      });

      client.on('joined', (data: { requestId: string }) => {
        expect(data.requestId).toBe(requestId);
        client.disconnect();
        done();
      });

      client.on('join_error', (err: { message: string }) => {
        client.disconnect();
        done(new Error(`Unexpected error: ${err.message}`));
      });
    });

    test('join with wrong auth should receive error', done => {
      testSessionData = { verifiedChatIds: ['wrong-id'] };
      const client = connectClient();

      client.on('connect', () => {
        client.emit('join_room', { requestId });
      });

      client.on('join_error', (data: { message: string }) => {
        expect(data.message).toBe('Chat not verified');
        client.disconnect();
        done();
      });
    });

    test('unauthenticated user should receive error', done => {
      testSessionData = {};
      const client = connectClient();

      client.on('connect', () => {
        client.emit('join_room', { requestId });
      });

      client.on('join_error', (data: { message: string }) => {
        expect(data.message).toBe('Not authenticated');
        client.disconnect();
        done();
      });
    });

    test('broadcast delivers to room members', done => {
      testSessionData = { verifiedChatIds: [requestId] };
      const client = connectClient();

      client.on('connect', () => {
        client.emit('join_room', { requestId });
      });

      client.on('joined', () => {
        ioServer.to(requestId).emit('new_message', {
          messageId: 'test-msg-id',
          requestId,
          message: 'Hello from server',
          messageTimestamp: Date.now(),
          userId: null,
          senderName: null,
        });
      });

      client.on('new_message', (data: { messageId: string; message: string }) => {
        expect(data.messageId).toBe('test-msg-id');
        expect(data.message).toBe('Hello from server');
        client.disconnect();
        done();
      });
    });
  });
});

import { afterEach, beforeEach, describe, expect, test } from 'bun:test';

import { createChurch } from '../churches_storage';
import {
  assignPrayerRequestChat,
  createPrayerRequestChat,
  createPrayerRequestChatMessage,
  listPrayerRequestChatMessages,
  listPrayerRequestChats,
  updateMatchNotificationTimestamps,
  verifyPrayerRequestChat,
} from '../prayer_request_chats_storage';
import { createAdminUser } from '../users_storage';
import { Gender } from '@common/server-api/types/gender';
import { setupTestDb, teardownTestDb } from '@server/test/db_test_helper';
import { v4 as uuidv4 } from 'uuid';

describe('prayer_request_chats_storage', () => {
  let churchId: string;

  beforeEach(async () => {
    await setupTestDb();
    churchId = await createChurch({
      name: 'Test Church',
      address: '123 Main St',
      city: 'Test City',
      state: 'CA',
      zip: '12345',
      county: 'Test County',
    });
  });

  afterEach(async () => {
    await teardownTestDb();
  });

  describe('listPrayerRequestChats', () => {
    test('should list prayer request chats by user ID', async () => {
      // Use a simple timestamp that won't be affected by rounding
      const messageTimestamp1 = 1700000000 * 1000;
      const messageTimestamp2 = 1700000001 * 1000;
      const params = {
        requestContactEmail: 'user@example.com',
        requestContactPhone: '123-456-7890',
        zip: '12345',
        city: 'Test City',
        messages: [
          {
            messageId: uuidv4(),
            message: 'Hello',
            messageTimestamp: messageTimestamp1,
          },
          {
            messageId: uuidv4(),
            message: 'World',
            messageTimestamp: messageTimestamp2,
          },
        ],
      };

      const requestId = await createPrayerRequestChat(params);
      const prayerRequests = await listPrayerRequestChats({});

      expect(prayerRequests).toEqual([
        {
          requestId,
          assignedUserId: null,
          assignedChurchId: null,
          requestContactEmail: 'user@example.com',
          requestContactPhone: '123-456-7890',
          responded: false,
          zip: '12345',
          city: 'Test City',
          creationTimestamp: expect.any(Number),
          modificationTimestamp: expect.any(Number),
          matchNotificationTimestamp: null,
        },
      ]);

      // Test listing messages
      const messages = await listPrayerRequestChatMessages({ requestId });
      expect(messages).toEqual([
        {
          messageId: params.messages[0].messageId,
          requestId,
          message: 'Hello',
          messageTimestamp: 1700000000, // Expect the seconds value
          assignedUserId: null,
          deletionTimestamp: null,
        },
        {
          messageId: params.messages[1].messageId,
          requestId,
          message: 'World',
          messageTimestamp: 1700000001, // Expect the seconds value
          assignedUserId: null,
          deletionTimestamp: null,
        },
      ]);
    });

    test('should list only unnotified prayer requests if specified', async () => {
      const messageTimestamp = 1700000000 * 1000;
      const params = {
        requestContactEmail: 'user@example.com',
        requestContactPhone: '123-456-7890',
        zip: '12345',
        city: 'Test City',
        messages: [
          {
            messageId: uuidv4(),
            message: 'Hello',
            messageTimestamp,
          },
        ],
      };
      const requestId = await createPrayerRequestChat(params);
      let prayerRequests = await listPrayerRequestChats({ onlyUnnotified: true });
      expect(prayerRequests).toEqual([
        {
          requestId,
          assignedUserId: null,
          assignedChurchId: null,
          requestContactEmail: 'user@example.com',
          requestContactPhone: '123-456-7890',
          responded: false,
          zip: '12345',
          city: 'Test City',
          creationTimestamp: expect.any(Number),
          modificationTimestamp: expect.any(Number),
          matchNotificationTimestamp: null,
        },
      ]);

      await updateMatchNotificationTimestamps([requestId]);
      prayerRequests = await listPrayerRequestChats({ onlyUnnotified: true });
      expect(prayerRequests).toEqual([]);
    });
  });

  describe('assignPrayerRequestChat', () => {
    test('should assign a prayer request chat to a user', async () => {
      const messageTimestamp = 1700000000 * 1000;
      // First create a prayer request
      const params = {
        requestContactEmail: 'user@example.com',
        requestContactPhone: '123-456-7890',
        zip: '12345',
        city: 'Test City',
        messages: [
          {
            messageId: uuidv4(),
            message: 'Hello',
            messageTimestamp,
          },
        ],
        churchId,
      };

      // Create a prayer request
      const requestId = await createPrayerRequestChat(params);
      const user = await createAdminUser({
        churchId,
        firstName: 'Test',
        lastName: 'User',
        email: 'user@example.com',
        gender: Gender.Male,
        passwordHash: 'password',
      });

      await assignPrayerRequestChat({ requestId, userId: user.userId, churchId });

      // Verify the assignment
      const prayerRequests = await listPrayerRequestChats({ userId: user.userId });
      expect(prayerRequests).toEqual([
        {
          requestId,
          assignedUserId: user.userId,
          assignedChurchId: churchId,
          requestContactEmail: 'user@example.com',
          requestContactPhone: '123-456-7890',
          responded: false,
          zip: '12345',
          city: 'Test City',
          creationTimestamp: expect.any(Number),
          modificationTimestamp: expect.any(Number),
          matchNotificationTimestamp: null,
        },
      ]);
    });
  });

  describe('verifyPrayerRequestChat', () => {
    test('should verify a prayer request chat by email', async () => {
      const messageTimestamp = 1700000000 * 1000; // 2023-11-14 12:13:20 UTC
      // First create a prayer request
      const params = {
        requestContactEmail: 'user@example.com',
        requestContactPhone: '123-456-7890',
        zip: '12345',
        city: 'Test City',
        messages: [
          {
            messageId: uuidv4(),
            message: 'Hello',
            messageTimestamp,
          },
        ],
      };

      const requestId = await createPrayerRequestChat(params);

      // Verify by email
      const verifiedId = await verifyPrayerRequestChat({
        requestId,
        requestContactEmail: 'user@example.com',
      });

      expect(verifiedId).toBe(requestId);
    });

    test('should verify a prayer request chat by phone', async () => {
      const messageTimestamp = 1700000000 * 1000; // 2023-11-14 12:13:20 UTC
      // First create a prayer request
      const params = {
        requestContactEmail: 'user@example.com',
        requestContactPhone: '123-456-7890',
        zip: '12345',
        city: 'Test City',
        messages: [
          {
            messageId: uuidv4(),
            message: 'Hello',
            messageTimestamp,
          },
        ],
      };

      const requestId = await createPrayerRequestChat(params);

      // Verify by phone
      const verifiedId = await verifyPrayerRequestChat({
        requestId,
        requestContactPhone: '123-456-7890',
      });

      expect(verifiedId).toBe(requestId);
    });
  });

  describe('createPrayerRequestChatMessage', () => {
    test('should create a new message in existing chat room', async () => {
      // First create a chat room
      const requestId = await createPrayerRequestChat({
        requestContactEmail: 'test@example.com',
        requestContactPhone: '1234567890',
        zip: '12345',
        city: 'Test City',
        region: 'Test Region',
        messages: [
          {
            message: 'Initial message',
            messageTimestamp: 1700000000 * 1000,
            messageId: '123e4567-e89b-12d3-a456-426614174000',
          },
        ],
      });

      // Then create a new message in that chat room
      const messageId = '123e4567-e89b-12d3-a456-426614174001';
      const message = 'Follow-up message';
      const messageTimestamp = 1700000001 * 1000;

      await createPrayerRequestChatMessage({
        messageId,
        requestId,
        message,
        messageTimestamp,
      });

      // Verify we can list the messages
      const messages = await listPrayerRequestChatMessages({ requestId });
      expect(messages).toHaveLength(2);
      expect(messages[1]).toEqual({
        messageId,
        requestId,
        message,
        messageTimestamp: 1700000001,
        assignedUserId: null,
        deletionTimestamp: null,
      });
    });
  });
});

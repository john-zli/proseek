import { afterEach, beforeEach, describe, expect, test } from 'bun:test';

import { createChurch } from '../churches_storage';
import {
  assignPrayerRequestChat,
  createPrayerRequestChat,
  createPrayerRequestChatMessage,
  getPrayerRequestChat,
  hidePrayerRequest,
  listChatsNeedingUnreadNotification,
  listPrayerRequestChatMessages,
  listPrayerRequestChats,
  listUnnotifiedPrayedForRequests,
  markPrayerRequestPrayedFor,
  updatePrayedForNotificationTimestamps,
  updateSeekerUnreadNotificationTimestamps,
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
      email: 'test@church.com',
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
          prayedForTimestamp: null,
          prayedForNotificationTimestamp: null,
          hiddenTimestamp: null,
          seekerUnreadNotificationTimestamp: null,
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
          userId: null,
          senderName: null,
          deletionTimestamp: null,
        },
        {
          messageId: params.messages[1].messageId,
          requestId,
          message: 'World',
          messageTimestamp: 1700000001, // Expect the seconds value
          userId: null,
          senderName: null,
          deletionTimestamp: null,
        },
      ]);
    });
  });

  describe('listChatsNeedingUnreadNotification', () => {
    test("should return chats where a church message exists after the seeker's last message", async () => {
      const seekerMsgId = uuidv4();
      const requestId = await createPrayerRequestChat({
        requestContactEmail: 'seeker@example.com',
        zip: '12345',
        city: 'Test City',
        churchId,
        messages: [{ messageId: seekerMsgId, message: 'Please pray for me', messageTimestamp: 1700000000 * 1000 }],
      });

      // No church reply yet — should not appear
      let pending = await listChatsNeedingUnreadNotification();
      expect(pending.map(r => r.requestId)).not.toContain(requestId);

      // Church member replies
      const user = await createAdminUser({
        churchId,
        firstName: 'Church',
        lastName: 'Member',
        email: 'member@church.com',
        gender: Gender.Male,
        passwordHash: 'password',
      });
      await createPrayerRequestChatMessage({
        messageId: uuidv4(),
        requestId,
        message: 'We are praying for you',
        userId: user.userId,
        messageTimestamp: 1700000001 * 1000,
      });

      // Now should appear
      pending = await listChatsNeedingUnreadNotification();
      expect(pending.map(r => r.requestId)).toContain(requestId);

      // After marking as notified, should not appear again
      await updateSeekerUnreadNotificationTimestamps([requestId]);
      pending = await listChatsNeedingUnreadNotification();
      expect(pending.map(r => r.requestId)).not.toContain(requestId);

      // Seeker replies (engages) — timestamp must be after the notification we just set
      const notified = await getPrayerRequestChat(requestId);
      const seekerReplyTimestamp = notified!.seekerUnreadNotificationTimestamp! * 1000 + 5000;
      await createPrayerRequestChatMessage({
        messageId: uuidv4(),
        requestId,
        message: 'Thank you',
        messageTimestamp: seekerReplyTimestamp,
      });

      // Still no new church message yet — should not appear
      pending = await listChatsNeedingUnreadNotification();
      expect(pending.map(r => r.requestId)).not.toContain(requestId);

      // Church replies again after the seeker's engagement
      await createPrayerRequestChatMessage({
        messageId: uuidv4(),
        requestId,
        message: 'God bless you',
        userId: user.userId,
        messageTimestamp: seekerReplyTimestamp + 1000,
      });

      // New sequence after seeker engagement — should appear again
      pending = await listChatsNeedingUnreadNotification();
      expect(pending.map(r => r.requestId)).toContain(requestId);
    });

    test('should not return chats with no contact info', async () => {
      const requestId = await createPrayerRequestChat({
        zip: '12345',
        city: 'Test City',
        churchId,
        messages: [{ messageId: uuidv4(), message: 'Please pray', messageTimestamp: 1700000000 * 1000 }],
      });

      const user = await createAdminUser({
        churchId,
        firstName: 'Church',
        lastName: 'Member',
        email: 'member2@church.com',
        gender: Gender.Male,
        passwordHash: 'password',
      });
      await createPrayerRequestChatMessage({
        messageId: uuidv4(),
        requestId,
        message: 'We pray for you',
        userId: user.userId,
        messageTimestamp: 1700000001 * 1000,
      });

      const pending = await listChatsNeedingUnreadNotification();
      expect(pending.map(r => r.requestId)).not.toContain(requestId);
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

      await assignPrayerRequestChat({ requestId, userId: user.userId });

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
          prayedForTimestamp: null,
          prayedForNotificationTimestamp: null,
          hiddenTimestamp: null,
          seekerUnreadNotificationTimestamp: null,
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
        userId: null,
        senderName: null,
        deletionTimestamp: null,
      });
    });
  });

  describe('getPrayerRequestChat', () => {
    test('should return a prayer request chat by ID', async () => {
      const params = {
        requestContactEmail: 'user@example.com',
        requestContactPhone: '123-456-7890',
        zip: '12345',
        city: 'Test City',
        churchId,
        messages: [
          {
            messageId: uuidv4(),
            message: 'Hello',
            messageTimestamp: 1700000000 * 1000,
          },
        ],
      };

      const requestId = await createPrayerRequestChat(params);
      const result = await getPrayerRequestChat(requestId);

      expect(result).toEqual({
        requestId,
        assignedUserId: null,
        assignedChurchId: churchId,
        responded: false,
        requestContactEmail: 'user@example.com',
        requestContactPhone: '123-456-7890',
        zip: '12345',
        city: 'Test City',
        creationTimestamp: expect.any(Number),
        modificationTimestamp: expect.any(Number),
        prayedForTimestamp: null,
        prayedForNotificationTimestamp: null,
        hiddenTimestamp: null,
        seekerUnreadNotificationTimestamp: null,
      });
    });

    test('should return null for non-existent request ID', async () => {
      const result = await getPrayerRequestChat(uuidv4());
      expect(result).toBeNull();
    });
  });

  describe('markPrayerRequestPrayedFor', () => {
    test('should set prayed_for_timestamp and appear in unnotified list', async () => {
      const requestId = await createPrayerRequestChat({
        requestContactEmail: 'seeker@example.com',
        zip: '12345',
        city: 'Test City',
        messages: [],
        churchId,
      });

      let unnotified = await listUnnotifiedPrayedForRequests();
      expect(unnotified.map(r => r.requestId)).not.toContain(requestId);

      await markPrayerRequestPrayedFor(requestId);

      const result = await getPrayerRequestChat(requestId);
      expect(result?.prayedForTimestamp).not.toBeNull();

      unnotified = await listUnnotifiedPrayedForRequests();
      expect(unnotified.map(r => r.requestId)).toContain(requestId);
    });

    test('should be removed from unnotified list after notification timestamp is set', async () => {
      const requestId = await createPrayerRequestChat({
        requestContactEmail: 'seeker@example.com',
        zip: '12345',
        city: 'Test City',
        messages: [],
        churchId,
      });

      await markPrayerRequestPrayedFor(requestId);
      await updatePrayedForNotificationTimestamps([requestId]);

      const unnotified = await listUnnotifiedPrayedForRequests();
      expect(unnotified.map(r => r.requestId)).not.toContain(requestId);

      const result = await getPrayerRequestChat(requestId);
      expect(result?.prayedForNotificationTimestamp).not.toBeNull();
    });
  });

  describe('hidePrayerRequest', () => {
    test('should set hidden_timestamp and exclude from default list', async () => {
      const requestId = await createPrayerRequestChat({
        requestContactEmail: 'seeker@example.com',
        zip: '12345',
        city: 'Test City',
        messages: [],
        churchId,
      });

      let requests = await listPrayerRequestChats({ churchId });
      expect(requests.map(r => r.requestId)).toContain(requestId);

      await hidePrayerRequest(requestId);

      requests = await listPrayerRequestChats({ churchId });
      expect(requests.map(r => r.requestId)).not.toContain(requestId);
    });

    test('should be visible when showHidden is true', async () => {
      const requestId = await createPrayerRequestChat({
        requestContactEmail: 'seeker@example.com',
        zip: '12345',
        city: 'Test City',
        messages: [],
        churchId,
      });

      await hidePrayerRequest(requestId);

      const requests = await listPrayerRequestChats({ churchId, showHidden: true });
      expect(requests.map(r => r.requestId)).toContain(requestId);

      const result = requests.find(r => r.requestId === requestId);
      expect(result?.hiddenTimestamp).not.toBeNull();
    });
  });
});

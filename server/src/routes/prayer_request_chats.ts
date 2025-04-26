import { Router } from 'express';

import { getCap } from '../captcha';
import { validate } from '../middleware/validate';
import {
  assignPrayerRequestChat,
  createPrayerRequestChat,
  createPrayerRequestChatMessage,
  listPrayerRequestChatMessages,
  listPrayerRequestChats,
  verifyPrayerRequestChat,
} from '../models/prayer_request_chats_storage';
import {
  AssignPrayerRequestChatSchema,
  CreatePrayerRequestChatMessageSchema,
  CreatePrayerRequestChatSchema,
  ListPrayerRequestChatMessagesSchema,
  ListPrayerRequestChatsSchema,
  VerifyPrayerRequestChatSchema,
} from '../schemas/prayer_request_chats';
import { logger } from '@server/logger';

const router = Router();

// Create a new prayer request
router.post('/', validate(CreatePrayerRequestChatSchema), async (req, res) => {
  try {
    const { token } = req.body;
    const cap = getCap();
    const { success } = await cap.validateToken(token);
    if (!success) {
      res.status(400).json({ error: 'Invalid CAPTCHA token' });
      return;
    }

    const chatroomId = await createPrayerRequestChat(req.body);
    res.status(201).json({ chatroomId });
  } catch (error) {
    console.error('Error creating prayer request:', error);
    res.status(500).json({ error: 'Failed to create prayer request' });
  }
});

// List prayer requests for a church
router.get('/church/:churchId', validate(ListPrayerRequestChatsSchema), async (req, res) => {
  try {
    const { churchId } = req.params;
    const prayerRequests = await listPrayerRequestChats({ churchId });
    res.json(prayerRequests);
  } catch (error) {
    console.error('Error listing prayer requests:', error);
    res.status(500).json({ error: 'Failed to list prayer requests' });
  }
});

// Assign a prayer request to a user
router.post('/:requestId/assign', validate(AssignPrayerRequestChatSchema), async (req, res) => {
  try {
    const { requestId } = req.params;
    const { userId } = req.body;
    // TODO(johnli): User should ideally be set on req object. Haven't gotten there yet.
    const chat = await assignPrayerRequestChat(requestId, userId, req.user?.churchId);
    if (!chat) {
      res.status(404).json({ error: 'Prayer request not found' });
    }
    res.json(chat);
  } catch (error) {
    console.error('Error assigning prayer request:', error);
    res.status(500).json({ error: 'Failed to assign prayer request' });
  }
});

// Prayer Request Chat Message Routes
router.post('/:requestId/message', validate(CreatePrayerRequestChatMessageSchema), async (req, res) => {
  try {
    const { requestId } = req.params;
    const { message, assignedUserId, messageId } = req.body;

    // TODO(johnli): If assignedUserId is authenticated, then use that and remove from body.
    await createPrayerRequestChatMessage({
      requestId,
      message,
      assignedUserId,
      messageId,
    });

    res.status(201).send();
  } catch (error) {
    console.error('Error creating prayer request chat message:', error);
    res.status(500).json({ error: 'Failed to create prayer request chat message' });
  }
});

router.get('/:requestId/messages', validate(ListPrayerRequestChatMessagesSchema), async (req, res) => {
  try {
    const { requestId } = req.params;
    const chatMessages = await listPrayerRequestChatMessages({ requestId });
    res.json(chatMessages);
  } catch (error) {
    console.error('Error listing prayer request chat messages:', error);
    res.status(500).json({ error: 'Failed to list prayer request chat messages' });
  }
});

router.post('/:requestId/verify', validate(VerifyPrayerRequestChatSchema), async (req, res) => {
  try {
    const { requestId } = req.params;
    const { requestContactEmail, requestContactPhone, token } = req.body;
    const cap = getCap();
    const { success } = await cap.validateToken(token);

    if (!success) {
      res.status(400).json({ error: 'Invalid CAPTCHA token' });
      return;
    }

    const verifiedChatId = await verifyPrayerRequestChat({ requestId, requestContactEmail, requestContactPhone });
    if (!verifiedChatId) {
      res.status(404).json({ error: 'Prayer request not found' });
      return;
    }

    logger.info(`Verified prayer request chat: ${verifiedChatId}`);
    res.status(200).json({ isVerified: true });
  } catch (error) {
    console.error('Error verifying prayer request chat:', error);
    res.status(500).json({ error: 'Failed to verify prayer request chat' });
  }
});

export default router;

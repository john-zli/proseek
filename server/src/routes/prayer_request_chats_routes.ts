import { Router } from 'express';

import { validate } from '../middleware/validate';
import { verifyCaptcha } from '../middleware/verify_captcha';
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
router.post('/', validate(CreatePrayerRequestChatSchema), verifyCaptcha, async (req, res) => {
  try {
    // Use IP geolocation data if available, otherwise use provided data
    console.log('req.ipLocation', req.ipLocation);
    const chatroomId = await createPrayerRequestChat({
      ...req.body,
      city: req.ipLocation?.city,
      region: req.ipLocation?.region,
      // TODO(johnli): Add latitude and longitude to prayer request chat later for better matching.
    });
    res.status(201).json({ chatroomId });
  } catch (error) {
    console.log('error', error);
    logger.error('Error creating prayer request:', error);
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
    logger.error('Error listing prayer requests:', error);
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
    logger.error('Error assigning prayer request:', error);
    res.status(500).json({ error: 'Failed to assign prayer request' });
  }
});

// Prayer Request Chat Message Routes
router.post('/:requestId/message', validate(CreatePrayerRequestChatMessageSchema), async (req, res) => {
  try {
    const { requestId } = req.params;
    const { message, messageId, messageTimestamp } = req.body;

    // TODO(johnli): If assignedUserId is authenticated, then use that and remove from body.
    await createPrayerRequestChatMessage({
      requestId,
      message,
      messageId,
      messageTimestamp,
    });

    res.status(201).send();
  } catch (error) {
    logger.error('Error creating prayer request chat message:', error);
    res.status(500).json({ error: 'Failed to create prayer request chat message' });
  }
});

router.get('/:requestId/messages', validate(ListPrayerRequestChatMessagesSchema), async (req, res) => {
  try {
    // TODO(johnli): Add auth, set via verify endpoint or captcha.
    const { requestId } = req.params;
    const chatMessages = await listPrayerRequestChatMessages({ requestId });
    res.json({ messages: chatMessages });
  } catch (error) {
    logger.error('Error listing prayer request chat messages:', error);
    res.status(500).json({ error: 'Failed to list prayer request chat messages' });
  }
});

router.post('/:requestId/verify', validate(VerifyPrayerRequestChatSchema), verifyCaptcha, async (req, res) => {
  try {
    const { requestId } = req.params;
    const { requestContactEmail, requestContactPhone } = req.body;

    const verifiedChatId = await verifyPrayerRequestChat({ requestId, requestContactEmail, requestContactPhone });
    if (!verifiedChatId) {
      res.status(404).json({ error: 'Prayer request not found' });
      return;
    }

    logger.info(`Verified prayer request chat: ${verifiedChatId}`);
    req.session.verifiedChatIds = [...(req.session.verifiedChatIds || []), verifiedChatId];

    res.status(200).json({ isVerified: true });
  } catch (error) {
    logger.error('Error verifying prayer request chat:', error);
    res.status(500).json({ error: 'Failed to verify prayer request chat' });
  }
});

export default router;

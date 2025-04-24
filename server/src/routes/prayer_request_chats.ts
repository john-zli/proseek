import { Router } from 'express';

import { validate } from '../middleware/validate';
import {
  assignPrayerRequestChat,
  createPrayerRequestChat,
  createPrayerRequestChatMessage,
  listPrayerRequestChatMessages,
  listPrayerRequestChats,
} from '../models/prayer_request_chats_storage';
import {
  AssignPrayerRequestChatSchema,
  CreatePrayerRequestChatMessageSchema,
  CreatePrayerRequestChatSchema,
  ListPrayerRequestChatMessagesSchema,
  ListPrayerRequestChatsSchema,
} from '../schemas/prayer_request_chats';

const router = Router();

// Create a new prayer request
router.post('/', validate(CreatePrayerRequestChatSchema), async (req, res) => {
  try {
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
router.post('/:requestId/messages', validate(CreatePrayerRequestChatMessageSchema), async (req, res) => {
  try {
    const { requestId } = req.params;
    const { message, assignedUserId } = req.body;

    // TODO(johnli): If assignedUserId is authenticated, then use that and remove from body.
    const chatMessage = await createPrayerRequestChatMessage({
      requestId,
      message,
      assignedUserId,
    });

    res.status(201).json(chatMessage);
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

export default router;

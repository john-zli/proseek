import { Router } from 'express';

import { validate } from '../middleware/validate';
import {
  createPrayerRequestChatMessage,
  listPrayerRequestChatMessages,
} from '../models/prayer_request_chat_messages_storage';
import {
  CreatePrayerRequestChatMessageSchema,
  ListPrayerRequestChatMessagesSchema,
} from '../schemas/prayer_request_chat_messages';

const router = Router();

// Create a new prayer request
router.post('/', validate(CreatePrayerRequestChatMessageSchema), async (req, res) => {
  try {
    const { requestId, message, assignedUserId } = req.body;

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

// List prayer request chat messages
router.get('/:requestId', validate(ListPrayerRequestChatMessagesSchema), async (req, res) => {
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

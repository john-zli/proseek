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
import { RouteError } from '@server/common/route_errors';
import HttpStatusCodes from '@server/common/status_codes';
import { ensureAuthenticated } from '@server/middleware/auth';

const router = Router();

// Create a new prayer request
router.post('/', validate(CreatePrayerRequestChatSchema), verifyCaptcha, async (req, res, next) => {
  try {
    const chatroomId = await createPrayerRequestChat({
      ...req.body,
      city: req.ipLocation?.city,
      region: req.ipLocation?.region,
    });
    res.status(HttpStatusCodes.CREATED).json({ chatroomId });
  } catch (error) {
    return next(error);
  }
});

// List prayer requests for a church
router.get('/church/:churchId', validate(ListPrayerRequestChatsSchema), async (req, res, next) => {
  const { churchId } = req.params;

  try {
    const prayerRequests = await listPrayerRequestChats({ churchId });
    res.status(HttpStatusCodes.OK).json(prayerRequests);
  } catch (error) {
    return next(error);
  }
});

// Assign a prayer request to a user
router.post(
  '/:requestId/assign',
  ensureAuthenticated,
  validate(AssignPrayerRequestChatSchema),
  async (req, res, next) => {
    const { requestId } = req.params;
    const { userId, churchId } = req.session.user!;

    try {
      await assignPrayerRequestChat(requestId, userId, churchId);
      res.status(HttpStatusCodes.OK).json({ success: true });
    } catch (error) {
      return next(error);
    }
  }
);

// Prayer Request Chat Message Routes
router.post('/:requestId/message', validate(CreatePrayerRequestChatMessageSchema), async (req, res, next) => {
  const { requestId } = req.params;
  const { message, messageId, messageTimestamp } = req.body;

  try {
    await createPrayerRequestChatMessage({
      requestId,
      message,
      messageId,
      messageTimestamp,
    });
    res.status(HttpStatusCodes.CREATED).send();
  } catch (error) {
    return next(error);
  }
});

router.get('/:requestId/messages', validate(ListPrayerRequestChatMessagesSchema), async (req, res, next) => {
  const { requestId } = req.params;

  try {
    const chatMessages = await listPrayerRequestChatMessages({ requestId });
    res.status(HttpStatusCodes.OK).json({ messages: chatMessages });
  } catch (error) {
    return next(error);
  }
});

router.post('/:requestId/verify', validate(VerifyPrayerRequestChatSchema), verifyCaptcha, async (req, res, next) => {
  const { requestId } = req.params;
  const { requestContactEmail, requestContactPhone } = req.body;

  try {
    const verifiedChatId = await verifyPrayerRequestChat({ requestId, requestContactEmail, requestContactPhone });
    if (!verifiedChatId) {
      throw new RouteError(HttpStatusCodes.NOT_FOUND, 'Prayer request not found or verification failed');
    }
    req.session.verifiedChatIds = [...(req.session.verifiedChatIds || []), verifiedChatId];
    res.status(HttpStatusCodes.OK).json({ isVerified: true });
  } catch (error) {
    return next(error);
  }
});

export default router;

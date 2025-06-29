import { RequestHandler } from 'express';

import { getNearestChurchToUser } from './helpers.ts ';
import HttpStatusCodes from '@server/common/status_codes';
import { createPrayerRequestChat } from '@server/models/prayer_request_chats_storage';
import { ServicesBuilder } from '@server/services/services_builder';

export function createPrayerRequestChatController(services: ServicesBuilder): RequestHandler {
  return async (req, res, next) => {
    try {
      const nearestChurch = await getNearestChurchToUser(services, {
        userLatitude: req.ipLocation?.latitude,
        userLongitude: req.ipLocation?.longitude,
      });

      const chatroomId = await createPrayerRequestChat({
        ...req.body,
        city: req.ipLocation?.city,
        region: req.ipLocation?.region,
        churchId: nearestChurch?.churchId,
      });

      res.status(HttpStatusCodes.CREATED).json({ chatroomId });
    } catch (error) {
      return next(error);
    }
  };
}

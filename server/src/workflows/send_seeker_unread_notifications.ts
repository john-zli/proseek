import config from '@server/config';
import {
  listChatsNeedingUnreadNotification,
  updateSeekerUnreadNotificationTimestamps,
} from '@server/models/prayer_request_chats_storage';
import { logger } from '@server/services/logger';
import { IServicesBuilder } from '@server/services/services_builder';
import { WorkflowName, WorkflowParams } from '@server/types/workflows';

export async function sendSeekerUnreadNotifications(
  services: IServicesBuilder,
  _payload: WorkflowParams<WorkflowName.SendSeekerUnreadNotifications>
) {
  logger.info('Processing seeker unread message notifications');

  const chats = await listChatsNeedingUnreadNotification();

  if (chats.length === 0) {
    logger.info('No chats with unread notifications pending');
    return;
  }

  const notifiedRequestIds: string[] = [];

  for (const chat of chats) {
    // TODO: handle request_contact_phone via SMS when a text service is added
    if (!chat.requestContactEmail) {
      logger.info(
        { requestId: chat.requestId },
        'Skipping chat with no contact email (phone-only, SMS not yet supported)'
      );
      continue;
    }

    const chatLink = `${config.clientUrl}/chats/${chat.requestId}`;

    const html = `
      <h2>You have unread messages for your prayer request</h2>
      <p>A church member has responded to your prayer request on ProSeek.</p>
      <p><a href="${chatLink}" style="display: inline-block; padding: 10px 20px; background: #4A90D9; color: white; text-decoration: none; border-radius: 4px;">View Your Prayer Chat</a></p>
    `;

    const sent = await services.email.sendEmail(chat.requestContactEmail, 'You have a new message on ProSeek', html);

    if (sent) {
      notifiedRequestIds.push(chat.requestId);
      logger.info({ requestId: chat.requestId }, 'Seeker unread notification email sent');
    } else {
      logger.error({ requestId: chat.requestId }, 'Failed to send seeker unread notification');
    }
  }

  if (notifiedRequestIds.length > 0) {
    await updateSeekerUnreadNotificationTimestamps(notifiedRequestIds);
    logger.info({ count: notifiedRequestIds.length }, 'Seeker unread notification timestamps updated');
  }
}

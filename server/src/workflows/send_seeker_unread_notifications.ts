import config from '@server/config';
import {
  listChatsNeedingUnreadNotification,
  listPrayerRequestChatMessages,
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

    const messages = await listPrayerRequestChatMessages({ requestId: chat.requestId });

    // Find the seeker's most recent message timestamp
    const seekerMessages = messages.filter(m => m.userId === null && m.deletionTimestamp === null);
    const lastSeekerTimestamp =
      seekerMessages.length > 0 ? Math.max(...seekerMessages.map(m => m.messageTimestamp)) : 0;

    // Find the first unread church message (first church message after seeker's last message)
    const firstUnreadChurchMessage = messages.find(
      m => m.userId !== null && m.deletionTimestamp === null && m.messageTimestamp > lastSeekerTimestamp
    );

    const chatLink = `${config.clientUrl}/chats/${chat.requestId}`;
    const senderName = firstUnreadChurchMessage?.senderName ?? 'A church member';
    const preview = firstUnreadChurchMessage?.message;

    const html = `
      <h2>You have a new message on ProSeek</h2>
      <p>${senderName} has sent you a message in your prayer chat.</p>
      ${preview ? `<p style="margin: 8px 0; padding: 12px; background: #f5f5f5; border-radius: 4px; border-left: 3px solid #4A90D9;">${preview}</p>` : ''}
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

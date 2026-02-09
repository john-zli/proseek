import config from '@server/config';
import { getChurchById } from '@server/models/churches_storage';
import {
  listPrayerRequestChats,
  listPrayerRequestChatMessages,
  updateMatchNotificationTimestamps,
} from '@server/models/prayer_request_chats_storage';
import { logger } from '@server/services/logger';
import { IServicesBuilder } from '@server/services/services_builder';
import { WorkflowName, WorkflowParams } from '@server/types/workflows';

export async function sendChurchMatchNotifications(
  services: IServicesBuilder,
  _payload: WorkflowParams<WorkflowName.SendChurchMatchNotifications>
) {
  logger.info('Processing recurring church match notifications');

  const prayerRequests = await listPrayerRequestChats({ onlyUnnotified: true });

  if (prayerRequests.length === 0) {
    logger.info('No unnotified prayer requests found');
    return;
  }

  const notifiedRequestIds: string[] = [];

  for (const prayerRequest of prayerRequests) {
    if (!prayerRequest.assignedChurchId) {
      logger.warn({ requestId: prayerRequest.requestId }, 'Prayer request has no assigned church, skipping');
      continue;
    }

    const church = await getChurchById(prayerRequest.assignedChurchId);
    if (!church) {
      logger.warn(
        { requestId: prayerRequest.requestId, churchId: prayerRequest.assignedChurchId },
        'Assigned church not found, skipping'
      );
      continue;
    }

    const messages = await listPrayerRequestChatMessages({ requestId: prayerRequest.requestId });
    const initialMessages = messages.slice(0, 3);

    const chatLink = `${config.clientUrl}/chats/${prayerRequest.requestId}`;
    const contactInfo = [
      prayerRequest.requestContactEmail && `Email: ${prayerRequest.requestContactEmail}`,
      prayerRequest.requestContactPhone && `Phone: ${prayerRequest.requestContactPhone}`,
    ]
      .filter(Boolean)
      .join('<br>');

    const location = [prayerRequest.city, prayerRequest.zip].filter(Boolean).join(', ');

    const messagesHtml = initialMessages
      .map(m => `<p style="margin: 8px 0; padding: 8px; background: #f5f5f5; border-radius: 4px;">${m.message}</p>`)
      .join('');

    const html = `
      <h2>New Prayer Request</h2>
      <p>A new prayer request has been submitted and matched to your church.</p>
      ${contactInfo ? `<p><strong>Contact:</strong><br>${contactInfo}</p>` : ''}
      ${location ? `<p><strong>Location:</strong> ${location}</p>` : ''}
      ${messagesHtml ? `<h3>Initial Messages</h3>${messagesHtml}` : ''}
      <p><a href="${chatLink}" style="display: inline-block; padding: 10px 20px; background: #4A90D9; color: white; text-decoration: none; border-radius: 4px;">View Prayer Request</a></p>
    `;

    const sent = await services.email.sendEmail(church.email, 'New Prayer Request Match - ProSeek', html);

    if (sent) {
      notifiedRequestIds.push(prayerRequest.requestId);
      logger.info({ requestId: prayerRequest.requestId, churchEmail: church.email }, 'Notification email sent');
    } else {
      logger.error({ requestId: prayerRequest.requestId, churchEmail: church.email }, 'Failed to send notification');
    }
  }

  if (notifiedRequestIds.length > 0) {
    await updateMatchNotificationTimestamps(notifiedRequestIds);
    logger.info({ count: notifiedRequestIds.length }, 'Match notification timestamps updated');
  }
}

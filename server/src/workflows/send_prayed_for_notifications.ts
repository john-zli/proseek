import config from '@server/config';
import {
  listUnnotifiedPrayedForRequests,
  updatePrayedForNotificationTimestamps,
} from '@server/models/prayer_request_chats_storage';
import { logger } from '@server/services/logger';
import { IServicesBuilder } from '@server/services/services_builder';
import { WorkflowName, WorkflowParams } from '@server/types/workflows';

export async function sendPrayedForNotifications(
  services: IServicesBuilder,
  _payload: WorkflowParams<WorkflowName.SendPrayedForNotifications>
) {
  logger.info('Processing prayed-for notifications');

  const prayerRequests = await listUnnotifiedPrayedForRequests();

  if (prayerRequests.length === 0) {
    logger.info('No unnotified prayed-for requests found');
    return;
  }

  const notifiedRequestIds: string[] = [];

  for (const prayerRequest of prayerRequests) {
    const chatLink = `${config.clientUrl}/chats/${prayerRequest.requestId}`;

    const html = `
      <h2>Someone Prayed for You 🙏</h2>
      <p>A member of a local church has prayed for your request on ProSeek.</p>
      <p>You can still visit your prayer chat at any time:</p>
      <p><a href="${chatLink}" style="display: inline-block; padding: 10px 20px; background: #4A90D9; color: white; text-decoration: none; border-radius: 4px;">View Your Prayer Chat</a></p>
    `;

    const sent = await services.email.sendEmail(
      prayerRequest.requestContactEmail!,
      'Someone prayed for you - ProSeek',
      html
    );

    if (sent) {
      notifiedRequestIds.push(prayerRequest.requestId);
      logger.info({ requestId: prayerRequest.requestId }, 'Prayed-for notification email sent');
    } else {
      logger.error({ requestId: prayerRequest.requestId }, 'Failed to send prayed-for notification');
    }
  }

  if (notifiedRequestIds.length > 0) {
    await updatePrayedForNotificationTimestamps(notifiedRequestIds);
    logger.info({ count: notifiedRequestIds.length }, 'Prayed-for notification timestamps updated');
  }
}

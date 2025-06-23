import { listPrayerRequestChats, updateMatchNotificationTimestamps } from '@server/models/prayer_request_chats_storage';
import { logger } from '@server/services/logger';
import { ServicesBuilder } from '@server/services/services_builder';
import { WorkflowName, WorkflowParams } from '@server/types/workflows';

export async function sendChurchMatchNotifications(
  _services: ServicesBuilder,
  _payload: WorkflowParams<WorkflowName.SEND_CHURCH_MATCH_NOTIFICATIONS>
) {
  logger.info(`Processing recurring church match notifications`);

  const prayerRequests = await listPrayerRequestChats({ onlyUnnotified: true });
  // At this point, all churches should have been matched. This is just a batch method to
  // send emails out all at once.

  // TODO (johnli): Handle email/text service here.

  await updateMatchNotificationTimestamps(prayerRequests.map(pr => pr.requestId));
}

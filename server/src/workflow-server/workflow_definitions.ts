import { WorkflowName } from '@server/types/workflows';
import { sendChurchMatchNotifications } from '@server/workflows/send_church_match_notifications';
import { sendPrayedForNotifications } from '@server/workflows/send_prayed_for_notifications';
import { sendUserInvitation } from '@server/workflows/send_user_invitation';

// Job handlers
export const WorkflowDefinitions = {
  [WorkflowName.SendChurchMatchNotifications]: sendChurchMatchNotifications,
  [WorkflowName.SendPrayedForNotifications]: sendPrayedForNotifications,
  [WorkflowName.InviteUser]: sendUserInvitation,
};

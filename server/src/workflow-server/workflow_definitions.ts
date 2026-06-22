import { WorkflowName } from '@server/types/workflows';
import { sendPrayedForNotifications } from '@server/workflows/send_prayed_for_notifications';
import { sendSeekerUnreadNotifications } from '@server/workflows/send_seeker_unread_notifications';
import { sendUserInvitation } from '@server/workflows/send_user_invitation';

// Job handlers
export const WorkflowDefinitions = {
  [WorkflowName.SendPrayedForNotifications]: sendPrayedForNotifications,
  [WorkflowName.SendSeekerUnreadNotifications]: sendSeekerUnreadNotifications,
  [WorkflowName.InviteUser]: sendUserInvitation,
};

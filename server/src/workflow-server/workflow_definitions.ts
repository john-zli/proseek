import { WorkflowName } from '@server/types/workflows';
import { sendChurchMatchNotifications } from '@server/workflows/send_church_match_notifications';

// Job handlers for recurring jobs
export const WorkflowDefinitions = {
  [WorkflowName.SendChurchMatchNotifications]: sendChurchMatchNotifications,
};

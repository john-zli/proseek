// Workflow types
export enum WorkflowName {
  SEND_CHURCH_MATCH_NOTIFICATIONS = 'SEND_CHURCH_MATCH_NOTIFICATIONS',
  // Add more workflow types here
}

// Workflow data interface
export interface WorkflowParams<T extends WorkflowName> {
  type: T;
  payload?: WorkflowParamsForWorkflowName[T];
}

// Specific payload types for different workflows
export interface SendChurchMatchNotificationsPayload extends Record<string, unknown> {}

export interface WorkflowParamsForWorkflowName {
  [WorkflowName.SEND_CHURCH_MATCH_NOTIFICATIONS]: SendChurchMatchNotificationsPayload;
}

interface WorkflowSchedule {
  cron?: string;
  every?: number;
  name: string;

  // Other options
  immediately?: boolean;
  startDate?: Date;
  endDate?: Date;
}

// Workflow schedules
export const WORKFLOW_SCHEDULES: Record<WorkflowName, WorkflowSchedule> = {
  [WorkflowName.SEND_CHURCH_MATCH_NOTIFICATIONS]: {
    every: 5 * 60 * 1000, // Every 5 minutes
    name: 'send-notification-to-requester',
  },
};
// Redis configuration
export const REDIS_CONFIG = {
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379'),
  password: process.env.REDIS_PASSWORD,
};

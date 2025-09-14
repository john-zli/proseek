// Workflow types
export enum WorkflowName {
  SendChurchMatchNotifications = 'SendChurchMatchNotifications',
  // Add more workflow types here
}

export enum WorkflowStatus {
  Unprocessed = 'unprocessed',
  Queued = 'queued',
  Running = 'running',
  Completed = 'completed',
  Failed = 'failed',
  Cancelled = 'cancelled',
}

// Workflow data interface
export interface WorkflowParams<T extends WorkflowName> {
  type: T;
  payload?: WorkflowParamsForWorkflowName[T];
}

// Specific payload types for different workflows
export interface SendChurchMatchNotificationsPayload extends Record<string, unknown> {}

export interface WorkflowParamsForWorkflowName {
  [WorkflowName.SendChurchMatchNotifications]: SendChurchMatchNotificationsPayload;
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
  [WorkflowName.SendChurchMatchNotifications]: {
    every: 5 * 60 * 1000, // Every 5 minutes
    name: WorkflowName.SendChurchMatchNotifications,
  },
};
// Redis configuration
export const REDIS_CONFIG = {
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379'),
  password: process.env.REDIS_PASSWORD,
};

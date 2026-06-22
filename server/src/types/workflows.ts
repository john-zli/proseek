import config from '@server/config';

// Workflow types
export enum WorkflowName {
  SendChurchMatchNotifications = 'SendChurchMatchNotifications',
  SendPrayedForNotifications = 'SendPrayedForNotifications',
  InviteUser = 'InviteUser',
}

export enum WorkflowStatus {
  Queued = 'queued',
  Running = 'running',
  Completed = 'completed',
  Failed = 'failed',
  Cancelled = 'cancelled',
}

// Workflow data interface
export interface WorkflowParams<T extends WorkflowName> {
  type: T;
  runId?: string;
  payload: WorkflowParamsForWorkflowName[T];
}

export interface InviteUserPayload extends Record<string, unknown> {
  targetEmail: string;
  churchId: string;
  createdByUserId: string;
}

export interface WorkflowParamsForWorkflowName {
  [WorkflowName.SendChurchMatchNotifications]: undefined;
  [WorkflowName.SendPrayedForNotifications]: undefined;
  [WorkflowName.InviteUser]: InviteUserPayload;
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

export type RecurringWorkflowName = WorkflowName.SendChurchMatchNotifications | WorkflowName.SendPrayedForNotifications;

// Workflow schedules
export const RECURRING_WORKFLOW_SCHEDULES: Record<RecurringWorkflowName, WorkflowSchedule> = {
  [WorkflowName.SendChurchMatchNotifications]: {
    every: 5 * 60 * 1000, // Every 5 minutes
    name: WorkflowName.SendChurchMatchNotifications,
  },
  [WorkflowName.SendPrayedForNotifications]: {
    every: 5 * 60 * 1000, // Every 5 minutes
    name: WorkflowName.SendPrayedForNotifications,
  },
};
// Redis configuration
export const REDIS_CONFIG = {
  host: config.redisHost,
  port: config.redisPort,
  password: config.redisPassword,
};

// Workflow types
export enum WorkflowName {}

// Workflow data interface
export interface WorkflowParams {
  type: WorkflowName;
  payload?: Record<string, unknown>;
}

// Workflow schedules
export const WORKFLOW_SCHEDULES: Record<WorkflowName, { cron: string; name: string }> = {};

// Redis configuration
export const REDIS_CONFIG = {
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379'),
  password: process.env.REDIS_PASSWORD,
};

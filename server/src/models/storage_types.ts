import { WorkflowName, WorkflowParamsForWorkflowName, WorkflowStatus } from '@server/types/workflows';

// At least one of them must be populated.
export interface ListChurchesNearUserParams {
  zip?: string;
  county?: string;
  city?: string;
}

export interface CreatedUser {
  userId: string;
  churchId: string;
}

export interface QueuedWorkflowRun {
  runId: string;
  workflowName: WorkflowName;
  isRecurring: boolean;
  payload: WorkflowParamsForWorkflowName[WorkflowName] | null;
}

export interface RepeatingJob {
  workflowName: string;
  isRecurring: boolean;
}

export interface WorkflowRun {
  runId: string;
  workflowName: WorkflowName;
  isRecurring: boolean;
  status: WorkflowStatus;
  payload: WorkflowParamsForWorkflowName[WorkflowName] | null;
  startedTimestamp: number | null;
  completedTimestamp: number | null;
  creationTimestamp: number;
  deletionTimestamp: number | null;
  modificationTimestamp: number;
}

import { WorkflowStatus } from '@server/types/workflows';

// At least one of them must be populated.
export interface ListChurchesNearUserParams {
  zip?: string;
  county?: string;
  city?: string;
}

export interface Church {
  churchId: string;
  name: string;
  zip: string;
  county: string;
  city: string;
  state: string;
  address: string;
  email: string;
}

export interface CreatedUser {
  userId: string;
  churchId: string;
}

export interface QueuedWorkflowRun {
  runId: string;
  workflowName: string;
  isRecurring: boolean;
}

export interface RepeatingJob {
  workflowName: string;
  isRecurring: boolean;
}

export interface WorkflowRun {
  runId: string;
  workflowName: string;
  isRecurring: boolean;
  status: WorkflowStatus;
  startedTimestamp: number | null;
  completedTimestamp: number | null;
  creationTimestamp: number;
  deletionTimestamp: number | null;
  modificationTimestamp: number;
}

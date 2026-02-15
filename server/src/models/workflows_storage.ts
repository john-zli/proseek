import { nonQuery, queryRows, queryScalar, querySingleRow } from './db_query_helper';
import { QueuedWorkflowRun, WorkflowRun } from './storage_types';
import { WorkflowStatus } from '@server/types/workflows';

const ColumnKeyMappings = {
  QueuedWorkflowRun: {
    runId: 'run_id',
    workflowName: 'workflow_name',
    isRecurring: 'is_recurring',
    payload: 'payload',
  },
  WorkflowRun: {
    runId: 'run_id',
    workflowName: 'workflow_name',
    isRecurring: 'is_recurring',
    status: 'status',
    payload: 'payload',
    startedTimestamp: 'started_timestamp',
    completedTimestamp: 'completed_timestamp',
    creationTimestamp: 'creation_timestamp',
    deletionTimestamp: 'deletion_timestamp',
    modificationTimestamp: 'modification_timestamp',
  },
  RepeatingJob: {
    workflowName: 'workflow_name',
    isRecurring: 'is_recurring',
  },
};

const SqlCommands = {
  GetQueuedWorkflowRuns: `
    SELECT      workflow_runs.run_id,
                workflow_runs.workflow_name,
                workflow_runs.is_recurring,
                workflow_runs.payload
    FROM        core.workflow_runs
    WHERE       workflow_runs.deletion_timestamp IS NULL AND
                workflow_runs.status = '${WorkflowStatus.Queued}'
    ORDER BY    workflow_runs.creation_timestamp ASC;`,

  GetWorkflowRunById: `
    SELECT      workflow_runs.run_id,
                workflow_runs.workflow_name,
                workflow_runs.is_recurring,
                workflow_runs.status,
                workflow_runs.payload,
                EXTRACT(EPOCH FROM workflow_runs.started_timestamp)::bigint AS started_timestamp,
                EXTRACT(EPOCH FROM workflow_runs.completed_timestamp)::bigint AS completed_timestamp,
                EXTRACT(EPOCH FROM workflow_runs.creation_timestamp)::bigint AS creation_timestamp,
                EXTRACT(EPOCH FROM workflow_runs.deletion_timestamp)::bigint AS deletion_timestamp,
                EXTRACT(EPOCH FROM workflow_runs.modification_timestamp)::bigint AS modification_timestamp
    FROM        core.workflow_runs
    WHERE       workflow_runs.run_id = $1::uuid;`,

  InsertWorkflowRun: `
    INSERT INTO core.workflow_runs (
      workflow_name,
      is_recurring,
      payload
    )
    VALUES (
      $1::varchar(100),
      $2::boolean,
      $3::jsonb
    )
    RETURNING run_id;`,
  StartWorkflowRun: `
    UPDATE      core.workflow_runs
    SET         status = '${WorkflowStatus.Running}',
                started_timestamp = now(),
                modification_timestamp = now()
    WHERE       run_id = $1::uuid AND
                deletion_timestamp IS NULL;`,

  FinishWorkflowRun: `
    UPDATE      core.workflow_runs
    SET         status = $2::varchar(20),
                completed_timestamp = now(),
                modification_timestamp = now()
    WHERE       run_id = $1::uuid AND
                deletion_timestamp IS NULL;`,
};

export async function getQueuedWorkflowRuns(): Promise<QueuedWorkflowRun[]> {
  return queryRows<QueuedWorkflowRun>({
    commandIdentifier: 'GetQueuedWorkflowRuns',
    query: SqlCommands.GetQueuedWorkflowRuns,
    params: [],
    mapping: ColumnKeyMappings.QueuedWorkflowRun,
  });
}

export async function getWorkflowRunById(runId: string): Promise<WorkflowRun> {
  return querySingleRow<WorkflowRun>({
    commandIdentifier: 'GetWorkflowRunById',
    query: SqlCommands.GetWorkflowRunById,
    params: [runId],
    mapping: ColumnKeyMappings.WorkflowRun,
  });
}

export async function insertWorkflowRun(params: {
  workflowName: string;
  isRecurring: boolean;
  payload?: Record<string, unknown>;
}): Promise<string> {
  return queryScalar<string>({
    commandIdentifier: 'InsertWorkflowRun',
    query: SqlCommands.InsertWorkflowRun,
    params: [params.workflowName, params.isRecurring, params.payload ? JSON.stringify(params.payload) : null],
  });
}

export async function startWorkflowRun(runId: string): Promise<void> {
  await nonQuery({
    commandIdentifier: 'StartWorkflowRun',
    query: SqlCommands.StartWorkflowRun,
    params: [runId],
  });
}

export async function finishWorkflowRun(params: { runId: string; status: 'completed' | 'failed' }): Promise<void> {
  await nonQuery({
    commandIdentifier: 'FinishWorkflowRun',
    query: SqlCommands.FinishWorkflowRun,
    params: [params.runId, params.status],
  });
}

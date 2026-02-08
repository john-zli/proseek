import { afterEach, beforeEach, describe, expect, test } from 'bun:test';

import {
  cancelActiveWorkflowRuns,
  finishWorkflowRun,
  getUnprocessedWorkflowRuns,
  getWorkflowRunById,
  insertWorkflowRun,
  startWorkflowRun,
  updateWorkflowRunsWithJobIds,
} from '../workflows_storage';
import { setupTestDb, teardownTestDb } from '@server/test/db_test_helper';
import { WorkflowName, WorkflowStatus } from '@server/types/workflows';

describe('workflows_storage', () => {
  beforeEach(async () => {
    await setupTestDb();
  });

  afterEach(async () => {
    await teardownTestDb();
  });

  describe('insertWorkflowRun', () => {
    test('should insert a workflow run', async () => {
      await insertWorkflowRun({
        workflowName: WorkflowName.SendChurchMatchNotifications,
        isRecurring: false,
      });

      const unprocessedRuns = await getUnprocessedWorkflowRuns();
      expect(unprocessedRuns).toHaveLength(1);
      expect(unprocessedRuns[0]).toEqual({
        runId: expect.any(String),
        workflowName: WorkflowName.SendChurchMatchNotifications,
        isRecurring: false,
      });
    });
  });

  describe('getUnprocessedWorkflowRuns', () => {
    test('should return empty array when no unprocessed runs exist', async () => {
      const unprocessedRuns = await getUnprocessedWorkflowRuns();
      expect(unprocessedRuns).toEqual([]);
    });

    test('should return only unprocessed runs', async () => {
      // Insert some workflow runs
      await insertWorkflowRun({
        workflowName: WorkflowName.SendChurchMatchNotifications,
        isRecurring: true,
      });

      const unprocessedRuns = await getUnprocessedWorkflowRuns();
      expect(unprocessedRuns).toHaveLength(1);

      // Also kinda tests `updateWorkflowRunsWithJobIds` too
      await updateWorkflowRunsWithJobIds({
        runIds: [unprocessedRuns[0].runId],
        jobIds: ['job-123'],
      });

      const unprocessedRunsAfter = await getUnprocessedWorkflowRuns();
      expect(unprocessedRunsAfter).toHaveLength(0);
    });
  });

  describe('getWorkflowRunById', () => {
    let runId: string;

    beforeEach(async () => {
      await insertWorkflowRun({
        workflowName: WorkflowName.SendChurchMatchNotifications,
        isRecurring: true,
      });

      const unprocessedRuns = await getUnprocessedWorkflowRuns();
      runId = unprocessedRuns[0].runId;
    });

    test('should return a workflow run by id', async () => {
      const workflowRun = await getWorkflowRunById(runId);
      expect(workflowRun).toEqual({
        runId,
        workflowName: WorkflowName.SendChurchMatchNotifications,
        isRecurring: true,
        status: WorkflowStatus.Unprocessed,
        jobId: null,
        queuedTimestamp: null,
        startedTimestamp: null,
        completedTimestamp: null,
        deletionTimestamp: null,
        creationTimestamp: expect.any(Number),
        modificationTimestamp: expect.any(Number),
      });
    });
  });

  describe('updateWorkflowRunsWithJobIds', () => {
    let runId: string;

    beforeEach(async () => {
      await insertWorkflowRun({
        workflowName: WorkflowName.SendChurchMatchNotifications,
        isRecurring: true,
      });

      const unprocessedRuns = await getUnprocessedWorkflowRuns();
      runId = unprocessedRuns[0].runId;
    });

    test('should update a workflow run with job id', async () => {
      await updateWorkflowRunsWithJobIds({
        runIds: [runId],
        jobIds: ['job-123'],
      });

      const workflowRun = await getWorkflowRunById(runId);
      expect(workflowRun).toEqual({
        runId,
        workflowName: WorkflowName.SendChurchMatchNotifications,
        isRecurring: true,
        status: WorkflowStatus.Queued,
        jobId: 'job-123',
        queuedTimestamp: expect.any(Number),
        startedTimestamp: null,
        completedTimestamp: null,
        deletionTimestamp: null,
        creationTimestamp: expect.any(Number),
        modificationTimestamp: expect.any(Number),
      });
    });
  });

  describe('startWorkflowRun', () => {
    let runId: string;

    beforeEach(async () => {
      await insertWorkflowRun({
        workflowName: WorkflowName.SendChurchMatchNotifications,
        isRecurring: true,
      });

      const unprocessedRuns = await getUnprocessedWorkflowRuns();
      runId = unprocessedRuns[0].runId;

      // Queue the run first
      await updateWorkflowRunsWithJobIds({
        runIds: [runId],
        jobIds: ['job-123'],
      });
    });

    test('should start a workflow run and set status to running', async () => {
      // Start the run
      await startWorkflowRun(runId);

      const workflowRun = await getWorkflowRunById(runId);
      expect(workflowRun).toEqual({
        runId,
        workflowName: WorkflowName.SendChurchMatchNotifications,
        isRecurring: true,
        status: WorkflowStatus.Running,
        jobId: 'job-123',
        queuedTimestamp: expect.any(Number),
        startedTimestamp: expect.any(Number),
        completedTimestamp: null,
        deletionTimestamp: null,
        creationTimestamp: expect.any(Number),
        modificationTimestamp: expect.any(Number),
      });
    });
  });

  describe('finishWorkflowRun', () => {
    let runId: string;

    beforeEach(async () => {
      await insertWorkflowRun({
        workflowName: WorkflowName.SendChurchMatchNotifications,
        isRecurring: true,
      });

      const unprocessedRuns = await getUnprocessedWorkflowRuns();
      runId = unprocessedRuns[0].runId;

      // Queue and start the run
      await updateWorkflowRunsWithJobIds({
        runIds: [runId],
        jobIds: ['job-123'],
      });

      await startWorkflowRun(runId);
    });

    test('should finish a workflow run with completed status', async () => {
      // Finish the run
      await finishWorkflowRun({
        runId,
        status: WorkflowStatus.Completed,
      });

      const workflowRun = await getWorkflowRunById(runId);
      expect(workflowRun).toEqual({
        runId,
        workflowName: WorkflowName.SendChurchMatchNotifications,
        isRecurring: true,
        status: WorkflowStatus.Completed,
        jobId: 'job-123',
        queuedTimestamp: expect.any(Number),
        startedTimestamp: expect.any(Number),
        completedTimestamp: expect.any(Number),
        deletionTimestamp: null,
        creationTimestamp: expect.any(Number),
        modificationTimestamp: expect.any(Number),
      });
    });

    test('should finish a workflow run with failed status', async () => {
      // Finish the run with failed status
      await finishWorkflowRun({
        runId,
        status: WorkflowStatus.Failed,
      });

      const workflowRun = await getWorkflowRunById(runId);
      expect(workflowRun).toEqual({
        runId,
        workflowName: WorkflowName.SendChurchMatchNotifications,
        isRecurring: true,
        status: WorkflowStatus.Failed,
        jobId: 'job-123',
        queuedTimestamp: expect.any(Number),
        startedTimestamp: expect.any(Number),
        completedTimestamp: expect.any(Number),
        deletionTimestamp: null,
        creationTimestamp: expect.any(Number),
        modificationTimestamp: expect.any(Number),
      });
    });
  });

  describe('cancelActiveWorkflowRuns', () => {
    test('should cancel queued workflow runs', async () => {
      await insertWorkflowRun({
        workflowName: WorkflowName.SendChurchMatchNotifications,
        isRecurring: true,
      });

      const unprocessedRuns = await getUnprocessedWorkflowRuns();
      const runId = unprocessedRuns[0].runId;

      // Queue the run
      await updateWorkflowRunsWithJobIds({
        runIds: [runId],
        jobIds: ['job-123'],
      });

      // Cancel active runs
      await cancelActiveWorkflowRuns();

      const workflowRun = await getWorkflowRunById(runId);
      expect(workflowRun).toEqual({
        runId,
        workflowName: WorkflowName.SendChurchMatchNotifications,
        isRecurring: true,
        status: WorkflowStatus.Cancelled,
        jobId: 'job-123',
        queuedTimestamp: expect.any(Number),
        startedTimestamp: null,
        completedTimestamp: null,
        deletionTimestamp: null,
        creationTimestamp: expect.any(Number),
        modificationTimestamp: expect.any(Number),
      });
    });

    test('should cancel running workflow runs', async () => {
      await insertWorkflowRun({
        workflowName: WorkflowName.SendChurchMatchNotifications,
        isRecurring: true,
      });

      const unprocessedRuns = await getUnprocessedWorkflowRuns();
      const runId = unprocessedRuns[0].runId;

      // Queue and start the run
      await updateWorkflowRunsWithJobIds({
        runIds: [runId],
        jobIds: ['job-123'],
      });
      await startWorkflowRun(runId);

      // Cancel active runs
      await cancelActiveWorkflowRuns();

      const workflowRun = await getWorkflowRunById(runId);
      expect(workflowRun).toEqual({
        runId,
        workflowName: WorkflowName.SendChurchMatchNotifications,
        isRecurring: true,
        status: WorkflowStatus.Cancelled,
        jobId: 'job-123',
        queuedTimestamp: expect.any(Number),
        startedTimestamp: expect.any(Number),
        completedTimestamp: null,
        deletionTimestamp: null,
        creationTimestamp: expect.any(Number),
        modificationTimestamp: expect.any(Number),
      });
    });

    test('should not cancel completed or unprocessed workflow runs', async () => {
      // Insert two runs
      await insertWorkflowRun({
        workflowName: WorkflowName.SendChurchMatchNotifications,
        isRecurring: true,
      });
      await insertWorkflowRun({
        workflowName: WorkflowName.SendChurchMatchNotifications,
        isRecurring: false,
      });

      const unprocessedRuns = await getUnprocessedWorkflowRuns();
      const completedRunId = unprocessedRuns[0].runId;
      const unprocessedRunId = unprocessedRuns[1].runId;

      // Complete the first run
      await updateWorkflowRunsWithJobIds({
        runIds: [completedRunId],
        jobIds: ['job-123'],
      });
      await startWorkflowRun(completedRunId);
      await finishWorkflowRun({
        runId: completedRunId,
        status: WorkflowStatus.Completed,
      });

      // Cancel active runs (should not affect completed or unprocessed)
      await cancelActiveWorkflowRuns();

      const completedRun = await getWorkflowRunById(completedRunId);
      expect(completedRun.status).toBe(WorkflowStatus.Completed);

      const unprocessedRun = await getWorkflowRunById(unprocessedRunId);
      expect(unprocessedRun.status).toBe(WorkflowStatus.Unprocessed);
    });
  });
});

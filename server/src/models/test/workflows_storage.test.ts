import { afterEach, beforeEach, describe, expect, test } from 'bun:test';

import {
  finishWorkflowRun,
  getQueuedWorkflowRuns,
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
    test('should insert a workflow run and return runId', async () => {
      const runId = await insertWorkflowRun({
        workflowName: WorkflowName.SendChurchMatchNotifications,
        isRecurring: false,
      });

      expect(runId).toEqual(expect.any(String));

      const queuedRuns = await getQueuedWorkflowRuns();
      expect(queuedRuns).toHaveLength(1);
      expect(queuedRuns[0]).toEqual({
        runId,
        workflowName: WorkflowName.SendChurchMatchNotifications,
        isRecurring: false,
      });
    });
  });

  describe('getQueuedWorkflowRuns', () => {
    test('should return empty array when no queued runs exist', async () => {
      const queuedRuns = await getQueuedWorkflowRuns();
      expect(queuedRuns).toEqual([]);
    });

    test('should not return runs that have been started', async () => {
      const runId = await insertWorkflowRun({
        workflowName: WorkflowName.SendChurchMatchNotifications,
        isRecurring: true,
      });

      const queuedRuns = await getQueuedWorkflowRuns();
      expect(queuedRuns).toHaveLength(1);

      // After starting, it should no longer appear in queued results
      await startWorkflowRun(runId);

      const queuedRunsAfter = await getQueuedWorkflowRuns();
      expect(queuedRunsAfter).toHaveLength(0);
    });
  });

  describe('getWorkflowRunById', () => {
    let runId: string;

    beforeEach(async () => {
      runId = await insertWorkflowRun({
        workflowName: WorkflowName.SendChurchMatchNotifications,
        isRecurring: true,
      });
    });

    test('should return a workflow run by id', async () => {
      const workflowRun = await getWorkflowRunById(runId);
      expect(workflowRun).toEqual({
        runId,
        workflowName: WorkflowName.SendChurchMatchNotifications,
        isRecurring: true,
        status: WorkflowStatus.Queued,
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
      runId = await insertWorkflowRun({
        workflowName: WorkflowName.SendChurchMatchNotifications,
        isRecurring: true,
      });
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
      runId = await insertWorkflowRun({
        workflowName: WorkflowName.SendChurchMatchNotifications,
        isRecurring: true,
      });

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
      runId = await insertWorkflowRun({
        workflowName: WorkflowName.SendChurchMatchNotifications,
        isRecurring: true,
      });

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
});

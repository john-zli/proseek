import { afterEach, beforeEach, describe, expect, test } from 'bun:test';

import {
  finishWorkflowRun,
  getQueuedWorkflowRuns,
  getWorkflowRunById,
  insertWorkflowRun,
  startWorkflowRun,
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
    });

    test('should start a workflow run and set status to running', async () => {
      await startWorkflowRun(runId);

      const workflowRun = await getWorkflowRunById(runId);
      expect(workflowRun).toEqual({
        runId,
        workflowName: WorkflowName.SendChurchMatchNotifications,
        isRecurring: true,
        status: WorkflowStatus.Running,

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

        startedTimestamp: expect.any(Number),
        completedTimestamp: expect.any(Number),
        deletionTimestamp: null,
        creationTimestamp: expect.any(Number),
        modificationTimestamp: expect.any(Number),
      });
    });
  });
});

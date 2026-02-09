import { getQueuedWorkflowRuns, updateWorkflowRunsWithJobIds } from '@server/models/workflows_storage';
import { logger } from '@server/services/logger';
import { REDIS_CONFIG, RECURRING_WORKFLOW_SCHEDULES, WorkflowName, WorkflowParams } from '@server/types/workflows';
import { Queue, RepeatOptions } from 'bullmq';

// Create queue instance for recurring jobs
const jobQueue = new Queue<WorkflowParams<WorkflowName>>('queue', {
  connection: REDIS_CONFIG,
});

// Setup recurring jobs
export async function setupRecurringJobs() {
  try {
    logger.info('Setting up recurring jobs...');

    // Add new repeatable jobs
    for (const [type, schedule] of Object.entries(RECURRING_WORKFLOW_SCHEDULES)) {
      const repeatOptions: RepeatOptions = {};

      if (schedule.every) {
        repeatOptions.every = schedule.every;
      }

      if (schedule.cron) {
        repeatOptions.pattern = schedule.cron;
      }

      await jobQueue.upsertJobScheduler(schedule.name, repeatOptions, {
        name: type,
        data: { type: type as WorkflowName },
      });
      logger.info(`Added recurring job: ${schedule.name} with pattern: ${schedule.cron ?? schedule.every}`);
    }

    logger.info('Recurring jobs setup completed');
  } catch (error) {
    logger.error(error, 'Error setting up recurring jobs:');
    throw error;
  }
}

// Sweep for queued one-off jobs and enqueue them into BullMQ
const SWEEP_INTERVAL_MS = 10_000;
let sweepInterval: ReturnType<typeof setInterval> | null = null;

async function sweepQueuedWorkflowRuns() {
  try {
    const queuedRuns = await getQueuedWorkflowRuns();
    if (queuedRuns.length === 0) return;

    logger.info(`Sweeper found ${queuedRuns.length} queued workflow run(s)`);

    const runIds: string[] = [];
    const jobIds: string[] = [];

    for (const run of queuedRuns) {
      const job = await jobQueue.add(
        run.workflowName,
        {
          type: run.workflowName as WorkflowName,
          runId: run.runId,
        },
        { jobId: run.runId }
      );

      if (job.id) {
        runIds.push(run.runId);
        jobIds.push(job.id);
      }
    }

    if (runIds.length > 0) {
      await updateWorkflowRunsWithJobIds({ runIds, jobIds });
      logger.info(`Sweeper enqueued ${runIds.length} workflow run(s) into BullMQ`);
    }
  } catch (error) {
    logger.error(error, 'Error in sweeper:');
  }
}

export function startSweeper() {
  sweepInterval = setInterval(sweepQueuedWorkflowRuns, SWEEP_INTERVAL_MS);
  logger.info(`Sweeper started, polling every ${SWEEP_INTERVAL_MS / 1000}s`);
}

export function stopSweeper() {
  if (sweepInterval) {
    clearInterval(sweepInterval);
    sweepInterval = null;
    logger.info('Sweeper stopped');
  }
}

// Graceful shutdown
export async function shutdownRecurringJobManager() {
  try {
    await jobQueue.close();
    logger.info('Recurring job manager closed successfully');
  } catch (error) {
    logger.error(error, 'Error closing recurring job manager:');
    throw error;
  }
}

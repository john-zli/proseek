import { finishWorkflowRun, insertWorkflowRun, startWorkflowRun } from '@server/models/workflows_storage';
import { setupRecurringJobs, shutdownRecurringJobManager, startSweeper, stopSweeper } from './queue_manager';
import { WorkflowDefinitions } from './workflow_definitions';
import { logger } from '@server/services/logger';
import { ServicesBuilder } from '@server/services/services_builder';
import { REDIS_CONFIG, WorkflowName, WorkflowParams } from '@server/types/workflows';
import { Worker } from 'bullmq';

let recurringWorker: Worker<WorkflowParams<WorkflowName>>;

async function main() {
  const services = new ServicesBuilder();

  // Setup recurring jobs
  await setupRecurringJobs();

  // Define worker for processing jobs
  recurringWorker = new Worker<WorkflowParams<WorkflowName>>(
    'queue',
    async job => {
      const workflowName = job.data.type as WorkflowName;
      logger.info(`Processing job ${job.id} of type ${workflowName}`);

      // For one-off jobs, the runId is already in job data (created by the caller, enqueued by the sweeper).
      // For recurring jobs, we insert a new workflow run record here.
      // TODO(johnli): If the server crashes mid-execution (OOM, power loss), BullMQ retries the stalled job.
      // For recurring jobs this creates a duplicate DB row, leaving the old one stuck as 'running' forever.
      // Consider adding a startup cleanup that marks stale 'running' rows as 'failed'.
      let runId: string;
      if (job.data.runId) {
        runId = job.data.runId;
      } else {
        runId = await insertWorkflowRun({ workflowName, isRecurring: true });
      }
      await startWorkflowRun(runId);

      try {
        const handler = WorkflowDefinitions[workflowName];
        if (!handler) {
          throw new Error(`No handler found for job type: ${workflowName}`);
        }

        await handler(services, job.data);
        logger.info(`Job ${job.id} completed successfully`);
        return runId;
      } catch (error) {
        logger.error(error, `Error processing job ${job.id}:`);
        await finishWorkflowRun({ runId, status: 'failed' });
        throw error;
      }
    },
    {
      connection: REDIS_CONFIG,
      concurrency: 3,
      stalledInterval: 30000,
    }
  );

  // Handle worker events
  recurringWorker.on('completed', async job => {
    const runId = job.returnvalue as string;
    if (runId) {
      await finishWorkflowRun({ runId, status: 'completed' });
    }
    logger.info(`Job ${job.id} has completed`);
  });

  recurringWorker.on('failed', (job, error) => {
    logger.error(`Job ${job?.id} has failed with error:`, error);
  });

  recurringWorker.on('error', error => {
    logger.error('Recurring worker error:', error);
  });

  recurringWorker.on('stalled', jobId => {
    logger.warn(`Recurring job ${jobId} has stalled`);
  });

  // Start sweeper for queued one-off jobs
  startSweeper();

  logger.info('Workflow server started');
}

// Graceful shutdown
async function shutdown() {
  logger.info('Shutting down workflow server...');
  if (!recurringWorker) {
    logger.error('Recurring worker was not initialized');
    process.exit(0);
  }

  try {
    stopSweeper();
    await recurringWorker.close();
    await shutdownRecurringJobManager();
    logger.info('Workflow server closed successfully');
    process.exit(0);
  } catch (error) {
    logger.error('Error during shutdown:', error);
    process.exit(1);
  }
}

process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);

// Handle uncaught errors
process.on('uncaughtException', error => {
  logger.error('Uncaught exception:', error);
  shutdown();
});

process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled rejection at:', promise, 'reason:', reason);
  shutdown();
});

main().catch(error => {
  logger.error('Failed to start workflow server:', error);
  process.exit(1);
});

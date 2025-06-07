import { Job, JobData, JobType, Worker } from 'bullmq';

import { getPool } from '@server/services/db';
import { logger } from '@server/services/logger';
import { REDIS_CONFIG, WorkflowName, WorkflowParams } from '@server/types/workflows';

// Job handlers will be moved to a separate file later. workflows/index most likely.
const jobHandlers: Record<WorkflowName, (job: Job<WorkflowParams>) => Promise<void>> = {};

// Define worker for processing jobs
const worker = new Worker<WorkflowParams>(
  'job-queue',
  async job => {
    logger.info(`Processing job ${job.id} of type ${job.data.type}`);

    try {
      // Process job based on its type
      const handler = jobHandlers[job.data.type];
      if (!handler) {
        throw new Error(`No handler found for job type: ${job.data.type}`);
      }

      await handler(job);
      logger.info(`Job ${job.id} completed successfully`);
    } catch (error) {
      logger.error(`Error processing job ${job.id}:`, error);
      throw error;
    }
  },
  {
    connection: REDIS_CONFIG,
    concurrency: 5, // Process 5 jobs concurrently
    stalledInterval: 30000, // Check for stalled jobs every 30 seconds
  }
);

// Handle worker events
worker.on('completed', job => {
  logger.info(`Job ${job.id} has completed`);
});

worker.on('failed', (job, error) => {
  logger.error(`Job ${job?.id} has failed with error:`, error);
});

worker.on('error', error => {
  logger.error('Worker error:', error);
});

worker.on('stalled', jobId => {
  logger.warn(`Job ${jobId} has stalled`);
});

// Graceful shutdown
async function shutdown() {
  logger.info('Shutting down worker...');
  try {
    await worker.close();
    logger.info('Worker closed successfully');
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

// Log startup
logger.info('Workflow server started');

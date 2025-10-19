import { setupRecurringJobs, shutdownRecurringJobManager } from './recurring_job_manager';
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
  logger.info('Recurring jobs setup completed');

  // Define worker for processing recurring jobs
  recurringWorker = new Worker<WorkflowParams<WorkflowName>>(
    'recurring-job-queue',
    async job => {
      logger.info(`Processing recurring job ${job.id} of type ${job.data.type}`);

      try {
        // Process job based on its type
        const handler = WorkflowDefinitions[job.data.type];
        if (!handler) {
          throw new Error(`No handler found for recurring job type: ${job.data.type}`);
        }

        await handler(services, job.data);
        logger.info(`Recurring job ${job.id} completed successfully`);
      } catch (error) {
        logger.error(error, `Error processing recurring job ${job.id}:`);
        throw error;
      }
    },
    {
      connection: REDIS_CONFIG,
      concurrency: 3, // Process 3 recurring jobs concurrently
      stalledInterval: 30000, // Check for stalled jobs every 30 seconds
    }
  );

  // Handle worker events
  recurringWorker.on('completed', job => {
    logger.info(`Recurring job ${job.id} has completed`);
  });

  recurringWorker.on('failed', (job, error) => {
    logger.error(`Recurring job ${job?.id} has failed with error:`, error);
  });

  recurringWorker.on('error', error => {
    logger.error('Recurring worker error:', error);
  });

  recurringWorker.on('stalled', jobId => {
    logger.warn(`Recurring job ${jobId} has stalled`);
  });

  logger.info('Workflow server started - handling recurring jobs only');
}

// Graceful shutdown
async function shutdown() {
  logger.info('Shutting down workflow server...');
  if (!recurringWorker) {
    logger.error('Recurring worker was not initialized');
    process.exit(0);
  }

  try {
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

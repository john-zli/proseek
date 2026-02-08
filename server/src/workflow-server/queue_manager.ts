import { cancelActiveWorkflowRuns } from '@server/models/workflows_storage';
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
        name: type as unknown as WorkflowName,
      });
      logger.info(`Added recurring job: ${schedule.name} with pattern: ${schedule.cron}`);
    }

    logger.info('Recurring jobs setup completed');
  } catch (error) {
    logger.error(error, 'Error setting up recurring jobs:');
    throw error;
  }
}

// Graceful shutdown
export async function shutdownRecurringJobManager() {
  try {
    await cancelActiveWorkflowRuns();
    logger.info('Cancelled active workflow runs on shutdown');

    await jobQueue.close();
    logger.info('Recurring job manager closed successfully');
  } catch (error) {
    logger.error(error, 'Error closing recurring job manager:');
    throw error;
  }
}

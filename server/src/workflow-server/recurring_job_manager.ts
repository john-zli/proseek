import { logger } from '@server/services/logger';
import { REDIS_CONFIG, WORKFLOW_SCHEDULES, WorkflowName, WorkflowParams } from '@server/types/workflows';
import { Queue, RepeatOptions } from 'bullmq';

// Create queue instance for recurring jobs
const recurringQueue = new Queue<WorkflowParams<WorkflowName>>('recurring-job-queue', {
  connection: REDIS_CONFIG,
});

// Setup recurring jobs
export async function setupRecurringJobs() {
  try {
    logger.info('Setting up recurring jobs...');

    // Remove existing repeatable jobs
    const repeatableJobs = await recurringQueue.getJobSchedulers();
    await Promise.all(repeatableJobs.filter(job => job.id).map(job => recurringQueue.removeJobScheduler(job.id!)));

    logger.info(`Removed ${repeatableJobs.length} existing repeatable jobs`);

    // Add new repeatable jobs
    for (const [type, schedule] of Object.entries(WORKFLOW_SCHEDULES)) {
      const repeatOptions: RepeatOptions = {};

      if (schedule.every) {
        repeatOptions.every = schedule.every;
      }

      if (schedule.cron) {
        repeatOptions.pattern = schedule.cron;
      }

      await recurringQueue.add(
        schedule.name,
        { type: type as unknown as WorkflowName },
        {
          repeat: repeatOptions,
        }
      );
      logger.info(`Added recurring job: ${schedule.name} with pattern: ${schedule.cron}`);
    }

    logger.info('Recurring jobs setup completed');
  } catch (error) {
    logger.error(error, 'Error setting up recurring jobs:');
    throw error;
  }
}

// Get all recurring jobs
export async function getRecurringJobs() {
  try {
    const jobs = await recurringQueue.getJobSchedulers();
    return jobs.map(job => ({
      key: job.key,
      name: job.name,
      pattern: job.pattern,
      next: job.next,
    }));
  } catch (error) {
    logger.error(error, 'Error getting recurring jobs:');
    throw error;
  }
}

// Graceful shutdown
export async function shutdownRecurringJobManager() {
  try {
    await recurringQueue.close();
    logger.info('Recurring job manager closed successfully');
  } catch (error) {
    logger.error(error, 'Error closing recurring job manager:');
    throw error;
  }
}

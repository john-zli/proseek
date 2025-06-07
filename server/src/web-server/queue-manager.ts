import { JobType, Queue } from 'bullmq';

import { logger } from '@server/services/logger';
import { REDIS_CONFIG, WORKFLOW_SCHEDULES, WorkflowName, WorkflowParams } from '@server/types/workflows';

// Create queue instance
const queue = new Queue<WorkflowParams>('job-queue', {
  connection: REDIS_CONFIG,
});

// Setup recurring jobs
export async function setupRecurringJobs() {
  try {
    // Remove existing repeatable jobs
    const repeatableJobs = await queue.getRepeatableJobs();
    await Promise.all(repeatableJobs.map(job => queue.removeRepeatableByKey(job.key)));

    // Add new repeatable jobs
    for (const [type, schedule] of Object.entries(WORKFLOW_SCHEDULES)) {
      await queue.add(
        schedule.name,
        { type: type as unknown as WorkflowName },
        {
          repeat: {
            pattern: schedule.cron,
          },
        }
      );
      logger.info(`Added recurring job: ${schedule.name}`);
    }
  } catch (error) {
    logger.error('Error setting up recurring jobs:', error);
    throw error;
  }
}

// Graceful shutdown
export async function shutdownQueue() {
  try {
    await queue.close();
    logger.info('Queue closed successfully');
  } catch (error) {
    logger.error('Error closing queue:', error);
    throw error;
  }
}

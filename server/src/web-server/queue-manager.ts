import { Queue } from 'bullmq';

import { logger } from '@server/services/logger';
import {
  REDIS_CONFIG,
  SendChurchMatchNotificationsPayload,
  WORKFLOW_SCHEDULES,
  WorkflowName,
  WorkflowParams,
} from '@server/types/workflows';

// Create queue instance
const queue = new Queue<WorkflowParams<WorkflowName>>('job-queue', {
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
      const repeatPattern = schedule.cron ? { pattern: schedule.cron } : { every: schedule.every };
      await queue.add(
        schedule.name,
        { type: type as unknown as WorkflowName },
        {
          repeat: repeatPattern,
        }
      );
      logger.info(`Added recurring job: ${schedule.name}`);
    }
  } catch (error) {
    logger.error('Error setting up recurring jobs:', error);
    throw error;
  }
}

// Add a one-time job with parameters
export async function addJob<T extends Record<string, unknown>>(
  type: WorkflowName,
  payload?: T,
  options?: {
    delay?: number; // Delay in milliseconds
    priority?: number; // Higher number = higher priority
    attempts?: number; // Number of retry attempts
  }
) {
  try {
    const job = await queue.add(
      type,
      { type, payload },
      {
        delay: options?.delay,
        priority: options?.priority,
        attempts: options?.attempts || 3,
        backoff: {
          type: 'exponential',
          delay: 2000, // Start with 2 seconds
        },
      }
    );

    logger.info(`Added job ${job.id} of type ${type}`);
    return job;
  } catch (error) {
    logger.error(`Error adding job of type ${type}:`, error);
    throw error;
  }
}

// Convenience functions for specific job types
export async function addSendChurchMatchNotificationsJob(payload: SendChurchMatchNotificationsPayload) {
  return addJob(WorkflowName.SEND_CHURCH_MATCH_NOTIFICATIONS, payload);
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

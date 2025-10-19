import { logger } from '@server/services/logger';
import { REDIS_CONFIG, WorkflowName, WorkflowParams } from '@server/types/workflows';
import { Queue } from 'bullmq';

// Create queue instance
const queue = new Queue<WorkflowParams<WorkflowName>>('job-queue', {
  connection: REDIS_CONFIG,
});

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

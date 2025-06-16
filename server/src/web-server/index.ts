import config from '../config';
import { setupRecurringJobs, shutdownQueue } from './queue-manager';
import { startServer } from './server';
import { logger } from '@server/services/logger';
import { ServicesBuilder } from '@server/services/services_builder';

const port = config.port;

async function start() {
  try {
    // Setup recurring jobs
    await setupRecurringJobs();
    logger.info('Queue manager started successfully');

    const services = new ServicesBuilder();
    // Start the server
    const app = startServer(services);
    app.listen(port, () => {
      logger.info(`Server started on port ${port}`);
    });
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
}

// Graceful shutdown
async function shutdown() {
  logger.info('Shutting down server...');
  try {
    await shutdownQueue();
    logger.info('Server and queue closed successfully');
    process.exit(0);
  } catch (error) {
    logger.error('Error during shutdown:', error);
    process.exit(1);
  }
}

process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);

// Log unhandled rejections but don't exit
process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled rejection at:', promise, 'reason:', reason);
});

// Start the server
start();

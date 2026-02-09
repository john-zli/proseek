import config from '../config';
import { startAdminServer } from './server';
import { logger } from '@server/services/logger';

const port = config.adminPort;

async function start() {
  try {
    const app = startAdminServer();

    app.listen(port, () => {
      logger.info(`Admin server started on port ${port}`);
    });
  } catch (error) {
    logger.error('Failed to start admin server:', error);
    process.exit(1);
  }
}

async function shutdown() {
  logger.info('Shutting down admin server...');
  try {
    logger.info('Admin server closed successfully');
    process.exit(0);
  } catch (error) {
    logger.error('Error during admin server shutdown:', error);
    process.exit(1);
  }
}

process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);

process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled rejection at:', promise, 'reason:', reason);
});

start();

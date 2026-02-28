import config from '../config';
import { startServer } from './server';
import { logger } from '@server/services/logger';
import { ServicesBuilder } from '@server/services/services_builder';
import { setupSocketServer } from '@server/websocket/socket_server';
import type { Server } from 'http';

const port = config.port;

let httpServer: Server | null = null;

async function start() {
  try {
    const services = new ServicesBuilder();
    // Start the server
    const app = startServer(services);
    httpServer = app.listen(port, () => {
      logger.info(`Server started on port ${port}`);
    });
    setupSocketServer(httpServer);
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
}

// Graceful shutdown
async function shutdown() {
  logger.info('Shutting down server...');
  try {
    if (httpServer) {
      httpServer.close();
    }
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

import config from './config';
import { startServer } from './server';
import { logger } from './services/logger';

const port = config.port;
const SERVER_START_MSG = 'Express server started on port: ' + port;

// Initialize everything.
const server = startServer({});
server.listen(port, () => logger.info(SERVER_START_MSG));

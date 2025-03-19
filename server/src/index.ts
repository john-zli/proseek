import {logger} from './logger';
import {startServer} from './server';

const port = process.env.PORT || 3000;
const SERVER_START_MSG = ('Express server started on port: ' + port);

// Initialize everything.
const server = startServer({});
server.listen(port, () => logger.info(SERVER_START_MSG));

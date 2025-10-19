import { SessionData as SharedSessionData } from '@common/server-api/types/session';
import { NodeEnvs } from '@server/common/constants';
import config from '@server/config';
import { logger } from '@server/services/logger';
import { RedisStore } from 'connect-redis';
import session from 'express-session';
import { createClient } from 'redis';

// Create Redis client
const redisClient = createClient({
  url: process.env.REDIS_URL || 'redis://localhost:6379',
});

redisClient.connect().catch(error => logger.error(error, 'Error connecting to Redis:'));

// Configure session middleware
export const sessionMiddleware = session({
  store: new RedisStore({ client: redisClient }),
  secret: process.env.SESSION_SECRET || 'your-secret-key',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: config.env === NodeEnvs.Production,
    httpOnly: true,
    maxAge: 24 * 60 * 60 * 1000, // 24 hours
  },
});

// Type declaration for session
declare module 'express-session' {
  interface SessionData extends SharedSessionData {} // eslint-disable-line @typescript-eslint/no-empty-object-type
}

import { NodeEnvs } from './common/constants';
import * as dotenv from 'dotenv';
import path from 'path';

// Configure dotenv to load environment variables
const NODE_ENV = process.env.NODE_ENV ?? 'development';
const result = dotenv.config({
  path: path.join(__dirname, `../config/.env.${NODE_ENV}`),
});

if (result.error) {
  throw result.error;
}

interface ServerConfig {
  env: NodeEnvs;
  port: number;
  dbConnectionString?: string;
  dbUser?: string;
  dbHost?: string;
  dbPort?: number;
  googleMapsApiKey?: string;
  redisUrl: string;
  redisHost: string;
  redisPort: number;
  redisPassword?: string;
  sessionSecret: string;
  disableHelmet: boolean;
  clientUrl: string;
  resendApiKey?: string;
  fromEmail: string;
}

const config: ServerConfig = {
  env: process.env.NODE_ENV as NodeEnvs,
  port: process.env.PORT ? parseInt(process.env.PORT, 10) : 3000,
  dbConnectionString: process.env.DATABASE_CONNECTION_STRING,
  googleMapsApiKey: process.env.GOOGLE_MAPS_API_KEY,
  redisUrl: process.env.REDIS_URL || 'redis://localhost:6379',
  redisHost: process.env.REDIS_HOST || 'localhost',
  redisPort: parseInt(process.env.REDIS_PORT || '6379'),
  redisPassword: process.env.REDIS_PASSWORD,
  sessionSecret: process.env.SESSION_SECRET || 'your-secret-key',
  disableHelmet: !!process.env.DISABLE_HELMET,
  clientUrl: process.env.CLIENT_URL || 'http://localhost:5173',
  resendApiKey: process.env.RESEND_API_KEY,
  fromEmail: process.env.FROM_EMAIL || 'notifications@proseek.church',
};

export default config;

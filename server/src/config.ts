import dotenv from 'dotenv';
import path from 'path';

import { NodeEnvs } from './common/constants';

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
}

const config: ServerConfig = {
  env: process.env.NODE_ENV as NodeEnvs,
  port: process.env.PORT ? parseInt(process.env.PORT, 10) : 3000,
  dbConnectionString: process.env.DATABASE_CONNECTION_STRING,
  googleMapsApiKey: process.env.GOOGLE_MAPS_API_KEY,
};

export default config;

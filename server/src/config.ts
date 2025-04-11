import { NodeEnvs } from './common/constants';

interface ServerConfig {
  env: NodeEnvs;
  port: number;
  dbConnectionString?: string;
  dbUser?: string;
  dbHost?: string;
  dbPort?: number;
}

const config: ServerConfig = {
  env: process.env.NODE_ENV as NodeEnvs,
  port: process.env.PORT ? parseInt(process.env.PORT, 10) : 3000,
  dbConnectionString: process.env.DATABASE_CONNECTION_STRING,
  dbUser: process.env.DATABASE_USER,
  dbHost: process.env.DATABASE_HOST,
  dbPort: process.env.DATABASE_PORT ? parseInt(process.env.DATABASE_PORT, 10) : 5432,
};

export default config;

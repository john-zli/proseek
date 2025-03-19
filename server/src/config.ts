import { NodeEnvs } from "./common/constants";

interface ServerConfig {
  env: NodeEnvs;
  port: number;
}

const config: ServerConfig = {
  env: process.env.NODE_ENV as NodeEnvs,
  port: process.env.PORT ? parseInt(process.env.PORT, 10) : 3000,
}

export default config;
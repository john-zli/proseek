module.exports = {
  apps: [
    {
      name: 'proseek-web',
      script: 'src/web-server/index.ts',
      watch: ['src'],
      ignore_watch: ['node_modules', 'client'],
      env: {
        NODE_ENV: 'development',
      },
      interpreter: 'doppler',
      interpreter_args: 'run -- bun',
    },
    {
      name: 'proseek-workflow',
      script: 'src/workflow-server/index.ts',
      watch: ['src'],
      ignore_watch: ['node_modules', 'client'],
      env: {
        NODE_ENV: 'development',
      },
      interpreter: 'doppler',
      interpreter_args: 'run -- bun',
      instances: 1,
    },
    {
      name: 'proseek-admin',
      script: 'src/admin-server/index.ts',
      watch: ['src'],
      ignore_watch: ['node_modules', 'client'],
      env: {
        NODE_ENV: 'development',
      },
      interpreter: 'doppler',
      interpreter_args: 'run -- bun',
      instances: 1,
    },
  ],
};

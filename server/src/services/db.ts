import config from '@server/config';
import { Pool } from 'pg';
import { types } from 'pg';

let pool: Pool;

// Also handle BIGINT type
types.setTypeParser(types.builtins.INT8, val => {
  if (val === null) return null;
  return Number(val);
});

export function getPool() {
  if (!pool) {
    pool = new Pool({ connectionString: config.dbConnectionString });
  }
  return pool;
}

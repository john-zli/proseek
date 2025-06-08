import { getPool } from '@server/services/db';

export async function setupTestDb() {
  const pool = getPool();
  await pool.query('BEGIN');
  return pool;
}

export async function teardownTestDb() {
  const pool = getPool();
  await pool.query('ROLLBACK');
}

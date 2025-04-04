import {getPool} from '../db';

const SqlCommands = {
  ListUsersFromChurch: `
    SELECT      users.user_id,
                users.church_id,
                users.first_name,
                users.last_name,
                users.email,
                users.phone,
                users.gender
    FROM        core.users
    WHERE       users.deletion_timestamp IS NULL AND
                users.church_id = $1::uuid
    ORDER BY    users.creation_timestamp DESC;`,
  GetUser: `
    SELECT      users.user_id,
                users.church_id,
                users.first_name,
                users.last_name,
                users.email,
                users.phone,
                users.gender
    FROM        core.users
    WHERE       users.deletion_timestamp IS NULL AND
                users.user_id = $1::uuid;`,
};

// TODO(johnli): Add abstractions for db to transform fields to camelCase.
// Also different kind of db query wrappers.
export async function listUsersFromChurch(churchId: string) {
  const pool = getPool();
  const result = await pool.query(SqlCommands.ListUsersFromChurch, [churchId]);
  return result.rows;
}

export async function getUser(userId: string) {
  const pool = getPool();
  const result = await pool.query(SqlCommands.GetUser, [userId]);
  return result.rows[0];
}

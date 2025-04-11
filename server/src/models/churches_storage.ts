import { getPool } from '../db';
import { Church, ListChurchesNearUserParams } from './storage_types';

const SqlCommands = {
  ListChurchesNearUser: `
    SELECT      churches.church_id,
                churches.name,
                churches.address,
                churches.city,
                churches.state,
                churches.zip,
                churches.county,
                churches.country
    FROM        core.churches
    WHERE       churches.deletion_timestamp IS NULL AND
                (
                  ($1::text IS NULL OR churches.zip = $1::varchar(20)) OR
                  ($2::text IS NULL OR churches.city = $2::varchar(100)) OR
                  ($3::text IS NULL OR churches.state = $3::varchar(50))
                )
    ORDER BY    churches.creation_timestamp DESC;`,
};

// TODO(johnli): Add abstractions for db to transform fields to camelCase.
// Also different kind of db query wrappers.
export async function listChurchesNearUser(params: ListChurchesNearUserParams): Promise<Church[]> {
  const { zip, city, county } = params;
  const pool = getPool();
  const result = await pool.query(SqlCommands.ListChurchesNearUser, [zip, city, county]);
  return result.rows;
}

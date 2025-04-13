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
  CreateChurch: `
    INSERT INTO core.churches (
      name,
      address,
      city,
      state,
      zip,
      county,
      country,
      phone,
      email,
      website
    )
    VALUES (
      $1::varchar(100),
      $2::varchar(200),
      $3::varchar(100),
      $4::varchar(50),
      $5::varchar(20),
      $6::varchar(100),
      'US',
      $7::varchar(20),
      $8::varchar(100),
      $9::varchar(200)
    )
    RETURNING
      church_id,
      name,
      address,
      city,
      state,
      zip,
      county,
      country,
      phone,
      email,
      website,
      creation_timestamp;`,
};

// TODO(johnli): Add abstractions for db to transform fields to camelCase.
// Also different kind of db query wrappers.
export async function listChurchesNearUser(params: ListChurchesNearUserParams): Promise<Church[]> {
  const { zip, city, county } = params;
  const pool = getPool();
  const result = await pool.query(SqlCommands.ListChurchesNearUser, [zip, city, county]);
  return result.rows;
}

export async function createChurch(params: {
  name: string;
  address: string;
  city: string;
  state: string;
  zip: string;
  county: string;
  phone?: string;
  email?: string;
  website?: string;
}): Promise<Church> {
  const pool = getPool();
  const result = await pool.query(SqlCommands.CreateChurch, [
    params.name,
    params.address,
    params.city,
    params.state,
    params.zip,
    params.county,
    params.phone,
    params.email,
    params.website,
  ]);
  return result.rows[0];
}

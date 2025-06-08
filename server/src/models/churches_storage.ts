import { queryRows, queryScalar } from './db_query_helper';
import { Church, ListChurchesNearUserParams } from './storage_types';

const ColumnKeyMappings = {
  Church: {
    churchId: 'church_id',
    name: 'name',
    zip: 'zip',
    county: 'county',
    city: 'city',
    state: 'state',
    address: 'address',
  },
};

const SqlCommands = {
  ListChurchesNearUser: `
    SELECT      churches.church_id,
                churches.name,
                churches.address,
                churches.city,
                churches.state,
                churches.zip,
                churches.county
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
      country
    )
    VALUES (
      $1::varchar(100),
      $2::varchar(200),
      $3::varchar(100),
      $4::varchar(50),
      $5::varchar(20),
      $6::varchar(100),
      'US'
    )
    RETURNING church_id;`,
};

// TODO(johnli): Add abstractions for db to transform fields to camelCase.
// Also different kind of db query wrappers.
export async function listChurchesNearUser(params: ListChurchesNearUserParams): Promise<Church[]> {
  const { zip, city, county } = params;
  return queryRows<Church>({
    commandIdentifier: 'ListChurchesNearUser',
    query: SqlCommands.ListChurchesNearUser,
    params: [zip, city, county],
    mapping: ColumnKeyMappings.Church,
  });
}

export async function createChurch(params: {
  name: string;
  address: string;
  city: string;
  state: string;
  zip: string;
  county: string;
}): Promise<string> {
  return queryScalar<string>({
    commandIdentifier: 'CreateChurch',
    query: SqlCommands.CreateChurch,
    allowNull: false,
    params: [params.name, params.address, params.city, params.state, params.zip, params.county],
  });
}

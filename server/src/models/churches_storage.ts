import { nonQuery, queryRows, queryScalar, querySingleRow } from './db_query_helper';
import { ListChurchesNearUserParams } from './storage_types';
import { Church } from '@common/server-api/types/churches';

const ColumnKeyMappings = {
  Church: {
    churchId: 'church_id',
    name: 'name',
    zip: 'zip',
    county: 'county',
    city: 'city',
    state: 'state',
    address: 'address',
    email: 'email',
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
                churches.county,
                churches.email
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
      email
    )
    VALUES (
      $1::varchar(100),
      $2::varchar(200),
      $3::varchar(100),
      $4::varchar(50),
      $5::varchar(20),
      $6::varchar(100),
      'US',
      $7::varchar(100)
    )
    RETURNING church_id;`,
  GetChurchById: `
    SELECT      churches.church_id,
                churches.name,
                churches.address,
                churches.city,
                churches.state,
                churches.zip,
                churches.county,
                churches.email
    FROM        core.churches
    WHERE       churches.church_id = $1::uuid
                AND churches.deletion_timestamp IS NULL;`,
  ListAllChurches: `
    SELECT      churches.church_id,
                churches.name,
                churches.address,
                churches.city,
                churches.state,
                churches.zip,
                churches.county,
                churches.email
    FROM        core.churches
    WHERE       churches.deletion_timestamp IS NULL
    ORDER BY    churches.creation_timestamp DESC;`,
  UpdateChurch: `
    UPDATE      core.churches
    SET         name = $2::varchar(100),
                address = $3::varchar(200),
                city = $4::varchar(100),
                state = $5::varchar(50),
                zip = $6::varchar(20),
                county = $7::varchar(100),
                email = $8::varchar(100),
                modification_timestamp = now()
    WHERE       church_id = $1::uuid
                AND deletion_timestamp IS NULL;`,
  DeleteChurch: `
    UPDATE      core.churches
    SET         deletion_timestamp = now(),
                modification_timestamp = now()
    WHERE       church_id = $1::uuid
                AND deletion_timestamp IS NULL;`,
};

export async function listChurchesNearUser(params: ListChurchesNearUserParams): Promise<Church[]> {
  const { zip, city, county } = params;
  return queryRows<Church>({
    commandIdentifier: 'ListChurchesNearUser',
    query: SqlCommands.ListChurchesNearUser,
    params: [zip, city, county],
    mapping: ColumnKeyMappings.Church,
  });
}

export async function getChurchById(churchId: string): Promise<Church | null> {
  return querySingleRow<Church>({
    commandIdentifier: 'GetChurchById',
    query: SqlCommands.GetChurchById,
    params: [churchId],
    mapping: ColumnKeyMappings.Church,
    allowNull: true,
  });
}

export async function createChurch(params: {
  name: string;
  address: string;
  city: string;
  state: string;
  zip: string;
  county: string;
  email: string;
}): Promise<string> {
  return queryScalar<string>({
    commandIdentifier: 'CreateChurch',
    query: SqlCommands.CreateChurch,
    allowNull: false,
    params: [params.name, params.address, params.city, params.state, params.zip, params.county, params.email],
  });
}

export async function listAllChurches(): Promise<Church[]> {
  return queryRows<Church>({
    commandIdentifier: 'ListAllChurches',
    query: SqlCommands.ListAllChurches,
    params: [],
    mapping: ColumnKeyMappings.Church,
  });
}

export async function updateChurch(params: {
  churchId: string;
  name: string;
  address: string;
  city: string;
  state: string;
  zip: string;
  county: string;
  email: string;
}): Promise<void> {
  await nonQuery({
    commandIdentifier: 'UpdateChurch',
    query: SqlCommands.UpdateChurch,
    params: [
      params.churchId,
      params.name,
      params.address,
      params.city,
      params.state,
      params.zip,
      params.county,
      params.email,
    ],
  });
}

export async function deleteChurch(churchId: string): Promise<void> {
  await nonQuery({
    commandIdentifier: 'DeleteChurch',
    query: SqlCommands.DeleteChurch,
    params: [churchId],
  });
}

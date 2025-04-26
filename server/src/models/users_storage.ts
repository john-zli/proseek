import { queryRows, queryScalar } from './db_query_helper';
import { User } from './storage_types';

const ColumnKeyMappings = {
  User: {
    userId: 'user_id',
    churchId: 'church_id',
    name: 'name',
    email: 'email',
    creationTimestamp: 'creation_timestamp',
    modifiedTimestamp: 'modification_timestamp',
  },
};

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
  CreateUser: `
    INSERT INTO core.users (
      church_id,
      first_name,
      last_name,
      email,
      phone,
      gender
    )
    VALUES (
      $1::uuid,
      $2::varchar(50),
      $3::varchar(50),
      $4::varchar(100),
      $5::varchar(20),
      $6::varchar(10)
    )
    RETURNING user_id;`,
};

// TODO(johnli): Add abstractions for db to transform fields to camelCase.
// Also different kind of db query wrappers.
export async function listUsersFromChurch(churchId: string): Promise<User[]> {
  return queryRows<User>({
    commandIdentifier: 'ListUsersFromChurch',
    query: SqlCommands.ListUsersFromChurch,
    params: [churchId],
    mapping: ColumnKeyMappings.User,
  });
}

export async function getUser(userId: string): Promise<User> {
  return queryRows<User>({
    commandIdentifier: 'GetUser',
    query: SqlCommands.GetUser,
    params: [userId],
    mapping: ColumnKeyMappings.User,
  }).then(rows => rows[0]);
}

export async function createUser(params: {
  churchId?: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  gender?: string;
}): Promise<string> {
  return queryScalar<string>({
    commandIdentifier: 'CreateUser',
    query: SqlCommands.CreateUser,
    allowNull: false,
    params: [params.churchId, params.firstName, params.lastName, params.email, params.phone, params.gender],
  });
}

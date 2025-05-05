import { queryRows, queryScalar, querySingleRow } from './db_query_helper';
import { SanitizedUser, User } from '@common/server-api/types/users';

const ColumnKeyMappings = {
  User: {
    userId: 'user_id',
    churchId: 'church_id',
    firstName: 'first_name',
    lastName: 'last_name',
    email: 'email',
    gender: 'gender',
    creationTimestamp: 'creation_timestamp',
    modifiedTimestamp: 'modification_timestamp',
    passwordHash: 'password_hash',
  },
  SanitizedUser: {
    userId: 'user_id',
    churchId: 'church_id',
    firstName: 'first_name',
    lastName: 'last_name',
    email: 'email',
    gender: 'gender',
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
                users.gender,
                EXTRACT(EPOCH FROM users.creation_timestamp) AS creation_timestamp,
                EXTRACT(EPOCH FROM users.modified_timestamp) AS modified_timestamp
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
                users.gender,
                users.password_hash,
                EXTRACT(EPOCH FROM users.creation_timestamp) AS creation_timestamp,
                EXTRACT(EPOCH FROM users.modified_timestamp) AS modified_timestamp
    FROM        core.users
    WHERE       users.deletion_timestamp IS NULL AND
                users.user_id = $1::uuid;`,
  GetUserByEmail: `
    SELECT      users.user_id,
                users.church_id,
                users.first_name,
                users.last_name,
                users.email,
                users.phone,
                users.gender,
                users.password_hash,
                EXTRACT(EPOCH FROM users.creation_timestamp) AS creation_timestamp,
                EXTRACT(EPOCH FROM users.modified_timestamp) AS modified_timestamp
    FROM        core.users
    WHERE       users.deletion_timestamp IS NULL AND
                users.email = $1::varchar(100);`,
  CreateUser: `
    SELECT      user_id,
                church_id,
                first_name,
                last_name,
                email,
                gender
    FROM        core.create_user_and_redeem_code(
                  $1::varchar(100),
                  $2::varchar(50),
                  $3::varchar(50),
                  $4::varchar(10),
                  $5::text,
                  $6::varchar(20)
                );`,
  GenerateInvitationCode: `SELECT core.generate_invitation_code($1::uuid, $2::uuid, $3::varchar(100)) as code;`,
};

export async function listUsersFromChurch(churchId: string): Promise<User[]> {
  return queryRows<User>({
    commandIdentifier: 'ListUsersFromChurch',
    query: SqlCommands.ListUsersFromChurch,
    params: [churchId],
    mapping: ColumnKeyMappings.User,
  });
}

export async function getUser(userId: string): Promise<User | undefined> {
  return querySingleRow<User>({
    commandIdentifier: 'GetUser',
    query: SqlCommands.GetUser,
    params: [userId],
    mapping: ColumnKeyMappings.User,
  });
}

export async function createUser(params: {
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  gender: string;
  passwordHash: string;
  invitationCode: string;
}): Promise<SanitizedUser> {
  return querySingleRow<SanitizedUser>({
    commandIdentifier: 'CreateUser',
    query: SqlCommands.CreateUser,
    mapping: ColumnKeyMappings.SanitizedUser,
    allowNull: false,
    params: [
      params.email,
      params.firstName,
      params.lastName,
      params.gender,
      params.passwordHash,
      params.invitationCode,
    ],
  });
}

export async function getUserByEmail(email: string): Promise<User | null> {
  const users = await queryRows<User>({
    commandIdentifier: 'GetUserByEmail',
    query: SqlCommands.GetUserByEmail,
    params: [email],
    mapping: ColumnKeyMappings.User,
  });
  return users.length > 0 ? users[0] : null;
}

// Function to generate an invitation code
export async function generateInvitationCode(
  churchId: string,
  createdByUserId: string,
  targetEmail: string
): Promise<string> {
  return queryScalar<string>({
    commandIdentifier: 'GenerateInvitationCode',
    query: SqlCommands.GenerateInvitationCode,
    allowNull: false,
    params: [churchId, createdByUserId, targetEmail],
  });
}

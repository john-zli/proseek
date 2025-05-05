import { nonQuery, queryRows, queryScalar, querySingleRow } from './db_query_helper';
import { InvitationCode, User } from './storage_types';

const ColumnKeyMappings = {
  User: {
    userId: 'user_id',
    churchId: 'church_id',
    firstName: 'first_name',
    lastName: 'last_name',
    email: 'email',
    phone: 'phone',
    gender: 'gender',
    creationTimestamp: 'creation_timestamp',
    modificationTimestamp: 'modification_timestamp',
    passwordHash: 'password_hash',
  },
  InvitationCode: {
    codeId: 'code_id',
    churchId: 'church_id',
    code: 'code',
    createdByUserId: 'created_by_user_id',
    redeemedByUserId: 'redeemed_by_user_id',
    expiresAt: 'expires_at',
    createdAt: 'created_at',
    redeemedAt: 'redeemed_at',
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
  CreateUser: `SELECT core.create_user_and_redeem_code($1, $2, $3, $4, $5, $6);`,
  GetInvitationCode: `
    SELECT      ic.code_id,
                ic.church_id,
                ic.code,
                ic.created_by_user_id,
                ic.redeemed_by_user_id,
                EXTRACT(EPOCH FROM ic.expires_at) * 1000 AS expires_at,
                EXTRACT(EPOCH FROM ic.created_at) * 1000 AS created_at,
                EXTRACT(EPOCH FROM ic.redeemed_at) * 1000 AS redeemed_at
    FROM        core.invitation_codes ic
    WHERE       ic.code = $1::varchar(20);`,
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

export async function getInvitationCode(code: string): Promise<InvitationCode | null> {
  return querySingleRow<InvitationCode>({
    commandIdentifier: 'GetInvitationCode',
    query: SqlCommands.GetInvitationCode,
    params: [code],
    mapping: ColumnKeyMappings.InvitationCode,
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
}): Promise<string> {
  return queryScalar<string>({
    commandIdentifier: 'CreateUser',
    query: SqlCommands.CreateUser,
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

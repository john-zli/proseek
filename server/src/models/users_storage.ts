import { nonQuery, queryRows, queryScalar, querySingleRow } from './db_query_helper';
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
    modificationTimestamp: 'modification_timestamp',
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
                EXTRACT(EPOCH FROM users.creation_timestamp)::bigint AS creation_timestamp,
                EXTRACT(EPOCH FROM users.modification_timestamp)::bigint AS modification_timestamp
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
                EXTRACT(EPOCH FROM users.creation_timestamp)::bigint AS creation_timestamp,
                EXTRACT(EPOCH FROM users.modification_timestamp)::bigint AS modification_timestamp
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
                EXTRACT(EPOCH FROM users.creation_timestamp)::bigint AS creation_timestamp,
                EXTRACT(EPOCH FROM users.modification_timestamp)::bigint AS modification_timestamp
    FROM        core.users
    WHERE       users.deletion_timestamp IS NULL AND
                users.email = $1::varchar(100);`,
  // Used to create church admins. CreateUser used for prayer users.
  CreateAdminUser: `
    INSERT INTO core.users (
      church_id,
      first_name,
      last_name,
      email,
      gender,
      password_hash
    )
    VALUES (
      $1::uuid,
      $2::varchar(50),
      $3::varchar(50),
      $4::varchar(100),
      $5::varchar(10),
      $6::text
    )
    RETURNING user_id, church_id, first_name, last_name, email, gender;`,
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
  ListAllUsers: `
    SELECT      users.user_id,
                users.church_id,
                users.first_name,
                users.last_name,
                users.email,
                users.gender,
                EXTRACT(EPOCH FROM users.creation_timestamp)::bigint AS creation_timestamp,
                EXTRACT(EPOCH FROM users.modification_timestamp)::bigint AS modification_timestamp
    FROM        core.users
    WHERE       users.deletion_timestamp IS NULL
    ORDER BY    users.creation_timestamp DESC;`,
  UpdateUser: `
    UPDATE      core.users
    SET         first_name = $2::varchar(50),
                last_name = $3::varchar(50),
                email = $4::varchar(100),
                gender = $5::varchar(10),
                modification_timestamp = now()
    WHERE       user_id = $1::uuid
                AND deletion_timestamp IS NULL;`,
  DeleteUser: `
    UPDATE      core.users
    SET         deletion_timestamp = now(),
                modification_timestamp = now()
    WHERE       user_id = $1::uuid
                AND deletion_timestamp IS NULL;`,
};

export async function listUsersFromChurch(churchId: string): Promise<User[]> {
  return queryRows<User>({
    commandIdentifier: 'ListUsersFromChurch',
    query: SqlCommands.ListUsersFromChurch,
    params: [churchId],
    mapping: ColumnKeyMappings.User,
  });
}

export async function $getUser(userId: string): Promise<User> {
  return querySingleRow<User>({
    commandIdentifier: 'GetUser',
    query: SqlCommands.GetUser,
    params: [userId],
    mapping: ColumnKeyMappings.User,
  });
}

export async function createAdminUser(params: {
  churchId: string;
  firstName: string;
  lastName: string;
  email: string;
  gender: string;
  passwordHash: string;
}): Promise<SanitizedUser> {
  return querySingleRow<SanitizedUser>({
    commandIdentifier: 'CreateAdminUser',
    query: SqlCommands.CreateAdminUser,
    mapping: ColumnKeyMappings.SanitizedUser,
    allowNull: false,
    params: [params.churchId, params.firstName, params.lastName, params.email, params.gender, params.passwordHash],
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

export async function listAllUsers(): Promise<SanitizedUser[]> {
  return queryRows<SanitizedUser>({
    commandIdentifier: 'ListAllUsers',
    query: SqlCommands.ListAllUsers,
    params: [],
    mapping: ColumnKeyMappings.SanitizedUser,
  });
}

export async function updateUser(params: {
  userId: string;
  firstName: string;
  lastName: string;
  email: string;
  gender: string;
}): Promise<void> {
  await nonQuery({
    commandIdentifier: 'UpdateUser',
    query: SqlCommands.UpdateUser,
    params: [params.userId, params.firstName, params.lastName, params.email, params.gender],
  });
}

export async function deleteUser(userId: string): Promise<void> {
  await nonQuery({
    commandIdentifier: 'DeleteUser',
    query: SqlCommands.DeleteUser,
    params: [userId],
  });
}

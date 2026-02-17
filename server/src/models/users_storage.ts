import { nonQuery, queryRows, queryScalar, querySingleRow } from './db_query_helper';
import { InvitationInfo, SanitizedUser, SessionUser, User } from '@common/server-api/types/users';

const ColumnKeyMappings = {
  User: {
    userId: 'user_id',
    churchIds: 'church_ids',
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
    firstName: 'first_name',
    lastName: 'last_name',
    email: 'email',
    gender: 'gender',
  },
  SessionUser: {
    userId: 'user_id',
    churchIds: 'church_ids',
    firstName: 'first_name',
    lastName: 'last_name',
    email: 'email',
    gender: 'gender',
  },
  // Used for create_user_and_redeem_code which returns singular church_id
  UserCreationResult: {
    userId: 'user_id',
    churchId: 'church_id',
    firstName: 'first_name',
    lastName: 'last_name',
    email: 'email',
    gender: 'gender',
  },
  InvitationInfo: {
    targetEmail: 'target_email',
    churchName: 'church_name',
    churchId: 'church_id',
  },
};

const SqlCommands = {
  ListUsersFromChurch: `
    SELECT      users.user_id,
                users.first_name,
                users.last_name,
                users.email,
                users.gender
    FROM        core.users
    JOIN        core.church_members cm
                ON cm.user_id = users.user_id
                AND cm.church_id = $1::uuid
                AND cm.deletion_timestamp IS NULL
    WHERE       users.deletion_timestamp IS NULL
    ORDER BY    users.creation_timestamp DESC;`,
  GetUser: `
    SELECT      users.user_id,
                users.first_name,
                users.last_name,
                users.email,
                users.gender,
                users.password_hash,
                COALESCE(ARRAY_AGG(cm.church_id) FILTER (WHERE cm.church_id IS NOT NULL), '{}') AS church_ids,
                EXTRACT(EPOCH FROM users.creation_timestamp)::bigint AS creation_timestamp,
                EXTRACT(EPOCH FROM users.modification_timestamp)::bigint AS modification_timestamp
    FROM        core.users
    LEFT JOIN   core.church_members cm
                ON cm.user_id = users.user_id
                AND cm.deletion_timestamp IS NULL
    WHERE       users.deletion_timestamp IS NULL AND
                users.user_id = $1::uuid
    GROUP BY    users.user_id;`,
  GetUserByEmail: `
    SELECT      users.user_id,
                users.first_name,
                users.last_name,
                users.email,
                users.gender,
                users.password_hash,
                COALESCE(ARRAY_AGG(cm.church_id) FILTER (WHERE cm.church_id IS NOT NULL), '{}') AS church_ids,
                EXTRACT(EPOCH FROM users.creation_timestamp)::bigint AS creation_timestamp,
                EXTRACT(EPOCH FROM users.modification_timestamp)::bigint AS modification_timestamp
    FROM        core.users
    LEFT JOIN   core.church_members cm
                ON cm.user_id = users.user_id
                AND cm.deletion_timestamp IS NULL
    WHERE       users.deletion_timestamp IS NULL AND
                users.email = $1::varchar(100)
    GROUP BY    users.user_id;`,
  CreateAdminUser: `
    WITH new_user AS (
      INSERT INTO core.users (
        first_name,
        last_name,
        email,
        gender,
        password_hash
      )
      VALUES (
        $1::varchar(50),
        $2::varchar(50),
        $3::varchar(100),
        $4::varchar(10),
        $5::text
      )
      RETURNING user_id, first_name, last_name, email, gender
    ),
    new_member AS (
      INSERT INTO core.church_members (user_id, church_id, role)
      SELECT user_id, $6::uuid, 'Admin'
      FROM new_user
    )
    SELECT user_id, first_name, last_name, email, gender, ARRAY[$6::uuid] AS church_ids
    FROM new_user;`,
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
  GetInvitationByCode: `
    SELECT      inv.target_email,
                ch.name AS church_name,
                ch.church_id AS church_id
    FROM        core.user_invitations inv
    JOIN        core.churches ch USING (church_id)
    WHERE       inv.code = $1::varchar(20)
                AND inv.redeemed_by_user_id IS NULL
                AND (inv.expiration_timestamp IS NULL OR inv.expiration_timestamp > now());`,
  ListAllUsers: `
    SELECT      users.user_id,
                users.first_name,
                users.last_name,
                users.email,
                users.gender
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

export async function listUsersFromChurch(churchId: string): Promise<SanitizedUser[]> {
  return queryRows<SanitizedUser>({
    commandIdentifier: 'ListUsersFromChurch',
    query: SqlCommands.ListUsersFromChurch,
    params: [churchId],
    mapping: ColumnKeyMappings.SanitizedUser,
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
  firstName: string;
  lastName: string;
  email: string;
  gender: string;
  passwordHash: string;
  churchId: string;
}): Promise<SessionUser> {
  return querySingleRow<SessionUser>({
    commandIdentifier: 'CreateAdminUser',
    query: SqlCommands.CreateAdminUser,
    mapping: ColumnKeyMappings.SessionUser,
    allowNull: false,
    params: [params.firstName, params.lastName, params.email, params.gender, params.passwordHash, params.churchId],
  });
}

// The SQL function returns singular church_id; we wrap it into churchIds array
interface UserCreationResult {
  userId: string;
  churchId: string;
  firstName: string;
  lastName: string;
  email: string;
  gender: string;
}

export async function createUser(params: {
  firstName: string;
  lastName: string;
  email: string;
  gender: string;
  passwordHash: string;
  invitationCode: string;
}): Promise<SessionUser> {
  const result = await querySingleRow<UserCreationResult>({
    commandIdentifier: 'CreateUser',
    query: SqlCommands.CreateUser,
    mapping: ColumnKeyMappings.UserCreationResult,
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
  // SQL function create_user_and_redeem_code returns a single church_id; wrap to match SessionUser
  return {
    userId: result.userId,
    churchIds: [result.churchId],
    firstName: result.firstName,
    lastName: result.lastName,
    email: result.email,
    gender: result.gender,
  };
}

export async function getUserByEmail(email: string): Promise<User | null> {
  return querySingleRow<User>({
    commandIdentifier: 'GetUserByEmail',
    query: SqlCommands.GetUserByEmail,
    params: [email],
    mapping: ColumnKeyMappings.User,
    allowNull: true,
  });
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

export async function getInvitationByCode(code: string): Promise<InvitationInfo | null> {
  return querySingleRow<InvitationInfo>({
    commandIdentifier: 'GetInvitationByCode',
    query: SqlCommands.GetInvitationByCode,
    params: [code],
    mapping: ColumnKeyMappings.InvitationInfo,
    allowNull: true,
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

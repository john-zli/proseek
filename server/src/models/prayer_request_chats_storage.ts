import { extractArraysByKeys } from './db_helpers';
import { nonQuery, queryRows, queryScalar } from './db_query_helper';
import {
  AssignPrayerRequestChatToUserParams,
  CreatePrayerRequestChatMessageParams,
  CreatePrayerRequestChatParams,
  ListPrayerRequestChatMessagesParams,
  ListPrayerRequestChatsParams,
  MatchPrayerRequestChatToChurchParams,
  PrayerRequestChat,
  PrayerRequestChatMessage,
  VerifyPrayerRequestChatParams,
} from '@common/server-api/types/prayer_request_chats';

const ColumnKeyMappings = {
  PrayerRequestChat: {
    requestId: 'request_id',
    assignedUserId: 'assigned_user_id',
    assignedChurchId: 'assigned_church_id',
    responded: 'responded',
    requestContactEmail: 'request_contact_email',
    requestContactPhone: 'request_contact_phone',
    zip: 'zip',
    city: 'city',
    region: 'region',
    creationTimestamp: 'creation_timestamp',
    modificationTimestamp: 'modification_timestamp',
  },
  PrayerRequestChatMessage: {
    messageId: 'message_id',
    requestId: 'request_id',
    message: 'message',
    messageTimestamp: 'message_timestamp',
    assignedUserId: 'assigned_user_id',
    deletionTimestamp: 'deletion_timestamp',
  },
};

const SqlCommands = {
  ListPrayerRequestChats: `
    SELECT      prayer_request_chats.request_id,
                prayer_request_chats.assigned_user_id,
                prayer_request_chats.assigned_church_id,
                prayer_request_chats.responded,
                prayer_request_chats.request_contact_email,
                prayer_request_chats.request_contact_phone,
                prayer_request_chats.zip,
                prayer_request_chats.city,
                EXTRACT(EPOCH FROM prayer_request_chats.creation_timestamp)::bigint AS creation_timestamp,
                EXTRACT(EPOCH FROM prayer_request_chats.modification_timestamp)::bigint AS modification_timestamp
    FROM        core.prayer_request_chats
    WHERE       ($1::uuid IS NULL OR prayer_request_chats.assigned_user_id = $1::uuid) AND
                ($2::uuid IS NULL OR prayer_request_chats.assigned_church_id = $2::uuid)
    ORDER BY    prayer_request_chats.creation_timestamp DESC;`,
  VerifyPrayerRequestChat: `
    SELECT      prayer_request_chats.request_id
    FROM        core.prayer_request_chats
    WHERE       ($1::varchar(100) IS NOT NULL OR $2::varchar(20) IS NOT NULL) AND
                (
                  ($1::varchar(100) IS NOT NULL AND prayer_request_chats.request_contact_email = $1::varchar(100)) OR
                  ($2::varchar(20) IS NOT NULL AND prayer_request_chats.request_contact_phone = $2::varchar(20))
                ) AND
                prayer_request_chats.request_id = $3::uuid;
  `,
  CreatePrayerRequestChatroom: `
    SELECT * FROM core.create_prayer_request_chat_with_church_assignment(
      $1::varchar(100),
      $2::varchar(20),
      $3::varchar(20),
      $4::varchar(100),
      $5::varchar(100),
      $6::text[],
      $7::bigint[],
      $8::uuid[]
    );`,

  MatchPrayerRequestChatToChurch: `
    UPDATE core.prayer_request_chats
    SET assigned_church_id = $1::uuid,
        modification_timestamp = CURRENT_TIMESTAMP
    WHERE request_id = $2::uuid;`,

  AssignPrayerRequestChatToUser: `
    UPDATE core.prayer_request_chats
    SET assigned_user_id = $1::uuid,
        modification_timestamp = CURRENT_TIMESTAMP
    WHERE request_id = $2::uuid
    AND assigned_church_id = $3::uuid;`,

  ListPrayerRequestChatMessages: `
    SELECT      prayer_request_chat_messages.message_id,
                prayer_request_chat_messages.request_id,
                prayer_request_chat_messages.message,
                EXTRACT(EPOCH FROM prayer_request_chat_messages.message_timestamp)::bigint AS message_timestamp,
                prayer_request_chat_messages.assigned_user_id,
                EXTRACT(EPOCH FROM prayer_request_chat_messages.deletion_timestamp)::bigint AS deletion_timestamp
    FROM        core.prayer_request_chat_messages
    WHERE       prayer_request_chat_messages.request_id = $1::uuid
    ORDER BY    prayer_request_chat_messages.message_timestamp ASC;`,

  CreatePrayerRequestChatMessage: `
    INSERT INTO core.prayer_request_chat_messages (
      message_id,
      request_id,
      message,
      assigned_user_id,
      message_timestamp
    ) VALUES ($1::uuid, $2::uuid, $3::text, $4::uuid, to_timestamp($5::bigint / 1000) AT TIME ZONE 'UTC');`,
};

// TODO(johnli): Add abstractions for db to transform fields to camelCase.
// Also different kind of db query wrappers.
export async function listPrayerRequestChats(params: ListPrayerRequestChatsParams): Promise<PrayerRequestChat[]> {
  const { userId, churchId } = params;
  return queryRows<PrayerRequestChat>({
    commandIdentifier: 'ListPrayerRequestChats',
    query: SqlCommands.ListPrayerRequestChats,
    params: [userId, churchId],
    mapping: ColumnKeyMappings.PrayerRequestChat,
  });
}

export async function assignPrayerRequestChat(params: AssignPrayerRequestChatToUserParams): Promise<void> {
  const { requestId, userId, churchId } = params;
  await nonQuery({
    commandIdentifier: 'AssignPrayerRequestChatToUser',
    query: SqlCommands.AssignPrayerRequestChatToUser,
    params: [userId, requestId, churchId],
  });
}

export async function matchPrayerRequestChatToChurch(params: MatchPrayerRequestChatToChurchParams): Promise<void> {
  const { requestId, churchId } = params;
  await nonQuery({
    commandIdentifier: 'MatchPrayerRequestChatToChurch',
    query: SqlCommands.MatchPrayerRequestChatToChurch,
    params: [churchId, requestId],
  });
}

export async function createPrayerRequestChat(params: CreatePrayerRequestChatParams): Promise<string> {
  const messageArrays = extractArraysByKeys(params.messages, ['message', 'messageTimestamp', 'messageId']);
  const [messageTexts, messageTimestamps, messageIds] = messageArrays;

  return queryScalar<string>({
    commandIdentifier: 'CreatePrayerRequestChatroom',
    query: SqlCommands.CreatePrayerRequestChatroom,
    allowNull: false,
    params: [
      params.requestContactEmail,
      params.requestContactPhone,
      params.zip,
      params.city,
      params.region,
      messageTexts,
      messageTimestamps,
      messageIds,
    ],
  });
}

// Prayer Request Chat Message Functions
export async function listPrayerRequestChatMessages(
  params: ListPrayerRequestChatMessagesParams
): Promise<PrayerRequestChatMessage[]> {
  const { requestId } = params;
  return queryRows<PrayerRequestChatMessage>({
    commandIdentifier: 'ListPrayerRequestChatMessages',
    query: SqlCommands.ListPrayerRequestChatMessages,
    params: [requestId],
    mapping: ColumnKeyMappings.PrayerRequestChatMessage,
  });
}

export async function createPrayerRequestChatMessage(params: CreatePrayerRequestChatMessageParams): Promise<void> {
  const { requestId, message, assignedUserId, messageTimestamp, messageId } = params;
  return nonQuery({
    commandIdentifier: 'CreatePrayerRequestChatMessage',
    query: SqlCommands.CreatePrayerRequestChatMessage,
    params: [messageId, requestId, message, assignedUserId, messageTimestamp],
  });
}

export async function verifyPrayerRequestChat(params: VerifyPrayerRequestChatParams): Promise<string> {
  const { requestId, requestContactEmail, requestContactPhone } = params;
  return queryScalar<string>({
    commandIdentifier: 'VerifyPrayerRequestChat',
    query: SqlCommands.VerifyPrayerRequestChat,
    params: [requestContactEmail, requestContactPhone, requestId],
  });
}

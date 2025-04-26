import { extractArraysByKeys } from './db_helpers';
import { nonQuery, queryRows, queryScalar } from './db_query_helper';
import {
  CreatePrayerRequestChatMessageParams,
  CreatePrayerRequestChatParams,
  ListPrayerRequestChatMessagesParams,
  ListPrayerRequestChatsParams,
  PrayerRequestChat,
  PrayerRequestChatMessage,
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
    creationTimestamp: 'creation_timestamp',
    modifiedTimestamp: 'modified_timestamp',
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
                EXTRACT(EPOCH FROM prayer_request_chats.creation_timestamp) AS creation_timestamp,
                EXTRACT(EPOCH FROM prayer_request_chats.modified_timestamp) AS modified_timestamp
    FROM        core.prayer_request_chats
    WHERE       ($1::uuid IS NULL OR prayer_request_chats.assigned_user_id = $1::uuid) AND
                ($2::uuid IS NULL OR prayer_request_chats.assigned_church_id = $2::uuid)
    ORDER BY    prayer_request_chats.creation_timestamp DESC;`,

  CreatePrayerRequestChatroom: `
    SELECT * FROM core.create_prayer_request_chat_with_church_assignment(
      $1::varchar(100),
      $2::varchar(20),
      $3::varchar(20),
      $4::varchar(100),
      $5::text[],
      $6::bigint[],
      $7::uuid[]
    );`,

  AssignPrayerRequestChat: `
    UPDATE core.prayer_request_chats
    SET assigned_user_id = $1::uuid,
        modified_timestamp = CURRENT_TIMESTAMP
    WHERE request_id = $2::uuid
    AND assigned_church_id = $3::uuid;`,

  ListPrayerRequestChatMessages: `
    SELECT      prayer_request_chat_messages.message_id,
                prayer_request_chat_messages.request_id,
                prayer_request_chat_messages.message,
                EXTRACT(EPOCH FROM prayer_request_chat_messages.message_timestamp) AS message_timestamp,
                prayer_request_chat_messages.assigned_user_id,
                EXTRACT(EPOCH FROM prayer_request_chat_messages.deletion_timestamp) AS deletion_timestamp
    FROM        core.prayer_request_chat_messages
    WHERE       prayer_request_chat_messages.request_id = $1::uuid
    ORDER BY    prayer_request_chat_messages.message_timestamp DESC;`,

  CreatePrayerRequestChatMessage: `
    INSERT INTO core.prayer_request_chat_messages (
      message_id,
      request_id,
      message,
      assigned_user_id
    ) VALUES ($1::uuid, $2::uuid, $3::text, $4::uuid);`,
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

export async function assignPrayerRequestChat(requestId: string, userId: string, churchId: string): Promise<void> {
  await nonQuery({
    commandIdentifier: 'AssignPrayerRequestChat',
    query: SqlCommands.AssignPrayerRequestChat,
    params: [userId, requestId, churchId],
  });
}

export async function createPrayerRequestChat(params: CreatePrayerRequestChatParams): Promise<string> {
  const messageArrays = extractArraysByKeys(params.messages, ['text', 'timestamp', 'messageId']);
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
  const { requestId, message, assignedUserId } = params;
  return nonQuery({
    commandIdentifier: 'CreatePrayerRequestChatMessage',
    query: SqlCommands.CreatePrayerRequestChatMessage,
    params: [requestId, message, assignedUserId],
  });
}

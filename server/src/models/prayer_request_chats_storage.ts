import { extractArraysByKeys } from './db_helpers';
import { nonQuery, queryRows, queryScalar, querySingleRow } from './db_query_helper';
import {
  AssignPrayerRequestChatToUserParams,
  CreatePrayerRequestChatMessageParams,
  CreatePrayerRequestChatParams,
  ListPrayerRequestChatMessagesParams,
  ListPrayerRequestChatsParams,
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
    matchNotificationTimestamp: 'match_notification_timestamp',
  },
  PrayerRequestChatMessage: {
    messageId: 'message_id',
    requestId: 'request_id',
    message: 'message',
    messageTimestamp: 'message_timestamp',
    userId: 'user_id',
    senderName: 'sender_name',
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
                EXTRACT(EPOCH FROM prayer_request_chats.modification_timestamp)::bigint AS modification_timestamp,
                EXTRACT(EPOCH FROM prayer_request_chats.match_notification_timestamp)::bigint AS match_notification_timestamp
    FROM        core.prayer_request_chats
    WHERE       ($1::uuid IS NULL OR prayer_request_chats.assigned_user_id = $1::uuid) AND
                ($2::uuid IS NULL OR prayer_request_chats.assigned_church_id = $2::uuid) AND
                ($3::boolean IS NOT TRUE OR
                 ($3::boolean AND prayer_request_chats.match_notification_timestamp IS NULL))
    ORDER BY    prayer_request_chats.creation_timestamp DESC;`,
  GetPrayerRequestChat: `
    SELECT      prayer_request_chats.request_id,
                prayer_request_chats.assigned_user_id,
                prayer_request_chats.assigned_church_id,
                prayer_request_chats.responded,
                prayer_request_chats.request_contact_email,
                prayer_request_chats.request_contact_phone,
                prayer_request_chats.zip,
                prayer_request_chats.city,
                EXTRACT(EPOCH FROM prayer_request_chats.creation_timestamp)::bigint AS creation_timestamp,
                EXTRACT(EPOCH FROM prayer_request_chats.modification_timestamp)::bigint AS modification_timestamp,
                EXTRACT(EPOCH FROM prayer_request_chats.match_notification_timestamp)::bigint AS match_notification_timestamp
    FROM        core.prayer_request_chats
    WHERE       prayer_request_chats.request_id = $1::uuid;`,
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
      $8::uuid[],
      $9::uuid
    );`,

  UpdateMatchNotificationTimestamps: `
    UPDATE core.prayer_request_chats
    SET match_notification_timestamp = CURRENT_TIMESTAMP
    WHERE request_id = ANY($1::uuid[]) AND match_notification_timestamp IS NULL;`,

  AssignPrayerRequestChatToUser: `
    UPDATE core.prayer_request_chats
    SET assigned_user_id = $1::uuid,
        modification_timestamp = CURRENT_TIMESTAMP
    WHERE request_id = $2::uuid;`,

  ListPrayerRequestChatMessages: `
    SELECT      m.message_id,
                m.request_id,
                m.message,
                EXTRACT(EPOCH FROM m.message_timestamp)::bigint AS message_timestamp,
                m.user_id,
                u.first_name AS sender_name,
                EXTRACT(EPOCH FROM m.deletion_timestamp)::bigint AS deletion_timestamp
    FROM        core.prayer_request_chat_messages m
    LEFT JOIN   core.users u ON m.user_id = u.user_id
    WHERE       m.request_id = $1::uuid
    ORDER BY    m.message_timestamp ASC;`,

  CreatePrayerRequestChatMessage: `
    INSERT INTO core.prayer_request_chat_messages (
      message_id,
      request_id,
      message,
      user_id,
      message_timestamp
    ) VALUES ($1::uuid, $2::uuid, $3::text, $4::uuid, to_timestamp($5::bigint / 1000) AT TIME ZONE 'UTC');`,
};

// TODO(johnli): Add abstractions for db to transform fields to camelCase.
// Also different kind of db query wrappers.
export async function listPrayerRequestChats(params: ListPrayerRequestChatsParams): Promise<PrayerRequestChat[]> {
  const { userId, churchId, onlyUnnotified } = params;
  return queryRows<PrayerRequestChat>({
    commandIdentifier: 'ListPrayerRequestChats',
    query: SqlCommands.ListPrayerRequestChats,
    params: [userId, churchId, onlyUnnotified],
    mapping: ColumnKeyMappings.PrayerRequestChat,
  });
}

export async function getPrayerRequestChat(requestId: string): Promise<PrayerRequestChat | null> {
  return querySingleRow<PrayerRequestChat>({
    commandIdentifier: 'GetPrayerRequestChat',
    query: SqlCommands.GetPrayerRequestChat,
    params: [requestId],
    mapping: ColumnKeyMappings.PrayerRequestChat,
    allowNull: true,
  });
}

export async function assignPrayerRequestChat(params: AssignPrayerRequestChatToUserParams): Promise<void> {
  const { requestId, userId } = params;
  await nonQuery({
    commandIdentifier: 'AssignPrayerRequestChatToUser',
    query: SqlCommands.AssignPrayerRequestChatToUser,
    params: [userId, requestId],
  });
}

export async function updateMatchNotificationTimestamps(requestIds: string[]): Promise<void> {
  await nonQuery({
    commandIdentifier: 'UpdateMatchNotificationTimestamps',
    query: SqlCommands.UpdateMatchNotificationTimestamps,
    params: [requestIds],
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
      params.churchId,
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
  const { requestId, message, userId, messageTimestamp, messageId } = params;
  return nonQuery({
    commandIdentifier: 'CreatePrayerRequestChatMessage',
    query: SqlCommands.CreatePrayerRequestChatMessage,
    params: [messageId, requestId, message, userId, messageTimestamp],
  });
}

export async function verifyPrayerRequestChat(params: VerifyPrayerRequestChatParams): Promise<string> {
  const { requestId, requestContactEmail, requestContactPhone } = params;
  return queryScalar<string>({
    commandIdentifier: 'VerifyPrayerRequestChat',
    query: SqlCommands.VerifyPrayerRequestChat,
    params: [requestContactEmail, requestContactPhone, requestId],
    allowNull: false,
  });
}

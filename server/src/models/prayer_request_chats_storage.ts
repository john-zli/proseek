import { getPool } from '../db';
import { extractArraysByKeys } from './db_helpers';
import {
  CreatePrayerRequestChatMessageParams,
  ListPrayerRequestChatMessagesParams,
  ListPrayerRequestChatsParams,
  PrayerRequestChat,
  PrayerRequestChatMessage,
} from '@common/server-api/types/prayer_request_chats';

const SqlCommands = {
  ListPrayerRequestChats: `
    SELECT      prayer_request_chats.request_id,
                prayer_request_chats.assigned_user_id,
                prayer_request_chats.assigned_church_id,
                prayer_request_chats.responded,
                prayer_request_chats.request_contact_email,
                prayer_request_chats.request_contact_phone,
                prayer_request_chats.request_contact_name,
                prayer_request_chats.request_contact_method,
                prayer_request_chats.request_summary,
                prayer_request_chats.zip,
                prayer_request_chats.county,
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
    AND assigned_church_id = $3::uuid
    RETURNING *;`,

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
      request_id,
      message,
      assigned_user_id
    ) VALUES ($1::uuid, $2::text, $3::uuid)
    RETURNING *;`,
};

// TODO(johnli): Add abstractions for db to transform fields to camelCase.
// Also different kind of db query wrappers.
export async function listPrayerRequestChats(params: ListPrayerRequestChatsParams): Promise<PrayerRequestChat[]> {
  const { userId, churchId } = params;
  const pool = getPool();
  const result = await pool.query(SqlCommands.ListPrayerRequestChats, [userId, churchId]);
  return result.rows;
}

export async function assignPrayerRequestChat(
  requestId: string,
  userId: string,
  churchId: string
): Promise<PrayerRequestChat | null> {
  const pool = getPool();
  const result = await pool.query(SqlCommands.AssignPrayerRequestChat, [userId, requestId, churchId]);
  return result.rows[0] || null;
}

export async function createPrayerRequestChat(request: {
  requestContactEmail?: string;
  requestContactPhone?: string;
  zip?: string;
  city?: string;
  messages: { text: string; timestamp: number; messageId: string }[];
}): Promise<string> {
  const messageArrays = extractArraysByKeys(request.messages, ['text', 'timestamp', 'messageId']);
  const [messageTexts, messageTimestamps, messageIds] = messageArrays;
  const pool = getPool();

  const result = await pool.query(SqlCommands.CreatePrayerRequestChatroom, [
    request.requestContactEmail,
    request.requestContactPhone,
    request.zip,
    request.city,
    messageTexts,
    messageTimestamps,
    messageIds,
  ]);

  return result.rows[0];
}

// Prayer Request Chat Message Functions
export async function listPrayerRequestChatMessages(
  params: ListPrayerRequestChatMessagesParams
): Promise<PrayerRequestChatMessage[]> {
  const { requestId } = params;
  const pool = getPool();
  const result = await pool.query(SqlCommands.ListPrayerRequestChatMessages, [requestId]);
  return result.rows;
}

export async function createPrayerRequestChatMessage(
  params: CreatePrayerRequestChatMessageParams
): Promise<PrayerRequestChatMessage> {
  const { requestId, message, assignedUserId } = params;
  const pool = getPool();
  const result = await pool.query(SqlCommands.CreatePrayerRequestChatMessage, [requestId, message, assignedUserId]);
  return result.rows[0];
}

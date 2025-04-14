import { getPool } from '../db';
import {
  CreatePrayerRequestChatMessageParams,
  ListPrayerRequestChatMessagesParams,
  PrayerRequestChatMessage,
} from '@common/server-api/types/prayer_request_chat_messages';
import { PrayerRequestChat } from '@common/server-api/types/prayer_request_chats';

const SqlCommands = {
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

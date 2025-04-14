import { getPool } from '../db';
import { ListPrayerRequestChatsParams, PrayerRequestChat } from '@common/server-api/types/prayer_request_chats';

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

  CreatePrayerRequestChat: `
    SELECT * FROM core.create_prayer_request_with_church_assignment(
      $1::text,
      $2::varchar(100),
      $3::varchar(20),
      $4::varchar(100),
      $5::varchar(20),
      $6::varchar(20),
      $7::varchar(50),
      $8::varchar(100)
    );`,

  AssignPrayerRequestChat: `
    UPDATE core.prayer_request_chats
    SET assigned_user_id = $1::uuid,
        modified_timestamp = CURRENT_TIMESTAMP
    WHERE request_id = $2::uuid
    AND assigned_church_id = $3::uuid
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

export async function createPrayerRequestChatWithChurchAssignment(request: {
  requestSummary: string;
  requestContactEmail?: string;
  requestContactPhone?: string;
  requestContactName?: string;
  requestContactMethod?: string;
  zip?: string;
  county?: string;
  city?: string;
}): Promise<PrayerRequestChat> {
  const pool = getPool();
  const result = await pool.query(SqlCommands.CreatePrayerRequestChat, [
    request.requestSummary,
    request.requestContactEmail,
    request.requestContactPhone,
    request.requestContactName,
    request.requestContactMethod,
    request.zip,
    request.county,
    request.city,
  ]);

  return result.rows[0];
}

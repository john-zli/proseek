import { getPool } from '../db'
import { ListPrayerRequestsParams, PrayerRequest } from './storage_types'

const SqlCommands = {
  ListPrayerRequests: `
    SELECT      prayer_requests.request_id,
                prayer_requests.assigned_user_id,
                prayer_requests.assigned_church_id,
                prayer_requests.responded,
                prayer_requests.request_contact_email,
                prayer_requests.request_contact_phone,
                prayer_requests.request_contact_name,
                prayer_requests.request_contact_method,
                prayer_requests.request_summary,
                prayer_requests.zip,
                prayer_requests.county,
                prayer_requests.city,
                prayer_requests.creation_timestamp,
                prayer_requests.modified_timestamp
    FROM        core.prayer_requests
    WHERE       ($1::uuid IS NULL OR prayer_requests.assigned_user_id = $1::uuid) AND
                ($2::uuid IS NULL OR prayer_requests.assigned_church_id = $2::uuid)
    ORDER BY    prayer_requests.creation_timestamp DESC;`,

  CreatePrayerRequest: `
    SELECT * FROM core.create_prayer_request_with_church_assignment(
      $1::text,
      $2::varchar(100),
      $3::varchar(10),
      $4::varchar(100),
      $5::varchar(20),
      $6::varchar(20),
      $7::varchar(50),
      $8::varchar(100)
    );`,

  AssignPrayerRequest: `
    UPDATE core.prayer_requests
    SET assigned_user_id = $1::uuid,
        modified_timestamp = CURRENT_TIMESTAMP
    WHERE request_id = $2::uuid
    AND assigned_church_id = $3::uuid
    RETURNING *;`,
}

// TODO(johnli): Add abstractions for db to transform fields to camelCase.
// Also different kind of db query wrappers.
export async function listPrayerRequests(params: ListPrayerRequestsParams): Promise<PrayerRequest[]> {
  const { userId, churchId } = params
  const pool = getPool()
  const result = await pool.query(SqlCommands.ListPrayerRequests, [userId, churchId])
  return result.rows
}

export async function assignPrayerRequest(
  requestId: string,
  userId: string,
  churchId: string
): Promise<PrayerRequest | null> {
  const pool = getPool()
  const result = await pool.query(SqlCommands.AssignPrayerRequest, [userId, requestId, churchId])
  return result.rows[0] || null
}

export async function createPrayerRequestWithChurchAssignment(request: {
  requestSummary: string
  requestContactEmail?: string
  requestContactPhone?: string
  requestContactName?: string
  requestContactMethod?: string
  zip?: string
  county?: string
  city?: string
}): Promise<PrayerRequest> {
  const pool = getPool()
  const result = await pool.query(SqlCommands.CreatePrayerRequest, [
    request.requestSummary,
    request.requestContactEmail,
    request.requestContactPhone,
    request.requestContactName,
    request.requestContactMethod,
    request.zip,
    request.county,
    request.city,
  ])

  return result.rows[0]
}

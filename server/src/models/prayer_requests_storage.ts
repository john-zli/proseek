import {getPool} from '../db';
import { ListPrayerRequestsParams, PrayerRequest } from './storage_types';

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
    FROM        core.prayer_requests
    WHERE       ($1::uuid IS NULL OR prayer_requests.assigned_user_id = $1::uuid) AND
                ($2::uuid IS NULL OR prayer_requests.assigned_church_id = $2::uuid)
    ORDER BY    prayer_requests.creation_timestamp DESC;`,
};

// TODO(johnli): Add abstractions for db to transform fields to camelCase.
// Also different kind of db query wrappers.
export async function listPrayerRequests(params: ListPrayerRequestsParams): Promise<PrayerRequest[]> {
  const { userId, churchId } = params;
  const pool = getPool();
  const result = await pool.query(SqlCommands.ListPrayerRequests, [userId, churchId]);
  return result.rows;
}
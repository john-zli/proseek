-- Each prayer request corresponds to a chat that starts from a request 
-- user. 
CREATE TABLE IF NOT EXISTS core.prayer_request_chats (
  request_id                    uuid                PRIMARY KEY DEFAULT gen_random_uuid(),
  assigned_user_id              uuid,
  assigned_church_id            uuid,                
  responded                     boolean             NOT NULL DEFAULT false,

  -- Location information
  zip                           varchar(20),
  city                          varchar(100),
  region                        varchar(100),

  request_contact_email         varchar(100),
  request_contact_phone         varchar(20),

  -- Metadata
  creation_timestamp                    timestamp   NOT NULL DEFAULT now(),
  modification_timestamp                timestamp   NOT NULL DEFAULT now(),
  prayed_for_timestamp                  timestamp,
  prayed_for_notification_timestamp     timestamp,
  hidden_timestamp                      timestamp,
  seeker_unread_notification_timestamp  timestamp,

  CONSTRAINT assigned_user_fk FOREIGN KEY (assigned_user_id)
    REFERENCES core.users(user_id) ON DELETE SET NULL,
  CONSTRAINT assigned_church_fk FOREIGN KEY (assigned_church_id)
    REFERENCES core.churches(church_id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS core.prayer_request_chat_messages (
  message_id                uuid                PRIMARY KEY,
  request_id                uuid                NOT NULL,
  message                   text                NOT NULL,
  message_timestamp         timestamp           NOT NULL DEFAULT now(),
  -- The user who sent this message. Null means the seeker (anonymous).
  user_id                   uuid,

  -- If deleted, we can have the UI show "deleted" instead of the message.
  deletion_timestamp        timestamp,

  CONSTRAINT request_fk FOREIGN KEY (request_id)
    REFERENCES core.prayer_request_chats(request_id) ON DELETE CASCADE,
  CONSTRAINT user_fk FOREIGN KEY (user_id)
    REFERENCES core.users(user_id)
);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_indexes
    WHERE schemaname = 'core'
    AND tablename = 'prayer_request_chat_messages'
    AND indexname = 'prayer_request_chat_messages_request_id_idx'
  ) THEN
      CREATE INDEX prayer_request_chat_messages_request_id_idx ON core.prayer_request_chat_messages(request_id);
  END IF;
END $$;

-- Create index for location-based searches
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM pg_indexes 
        WHERE schemaname = 'core' 
        AND tablename = 'prayer_request_chats' 
        AND indexname = 'idx_prayer_requests_location'
    ) THEN
        CREATE INDEX idx_prayer_requests_location ON core.prayer_request_chats(zip, city, region);
    END IF;
END $$;

-- Indices on prayer_request_chats table for faster lookups.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_indexes
    WHERE schemaname = 'core'
      AND tablename = 'prayer_request_chats'
      AND indexname = 'prayer_requests_user_id_idx'
  ) THEN
    CREATE INDEX prayer_requests_user_id_idx ON core.prayer_request_chats(assigned_user_id);
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_indexes
    WHERE schemaname = 'core'
      AND tablename = 'prayer_request_chats'
      AND indexname = 'prayer_requests_church_id_idx'
  ) THEN
    CREATE INDEX prayer_requests_church_id_idx ON core.prayer_request_chats(assigned_church_id);
  END IF;
END $$;

-- Add index for prayer_request_chats creation_timestamp
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_indexes
    WHERE schemaname = 'core'
      AND tablename = 'prayer_request_chats'
      AND indexname = 'prayer_request_chats_creation_timestamp_idx'
  ) THEN
    CREATE INDEX prayer_request_chats_creation_timestamp_idx ON core.prayer_request_chats(creation_timestamp);
  END IF;
END $$;

-- Drop match_notification_timestamp (church match notifications removed)
DO $$ BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'core' AND table_name = 'prayer_request_chats'
      AND column_name = 'match_notification_timestamp'
  ) THEN
    ALTER TABLE core.prayer_request_chats DROP COLUMN match_notification_timestamp;
  END IF;
END $$;

-- Add seeker_unread_notification_timestamp
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'core' AND table_name = 'prayer_request_chats'
      AND column_name = 'seeker_unread_notification_timestamp'
  ) THEN
    ALTER TABLE core.prayer_request_chats ADD COLUMN seeker_unread_notification_timestamp timestamp;
  END IF;
END $$;

-- Add index for prayer_request_chat_messages message_timestamp
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_indexes
    WHERE schemaname = 'core'
      AND tablename = 'prayer_request_chat_messages'
      AND indexname = 'prayer_request_chat_messages_message_timestamp_idx'
  ) THEN
    CREATE INDEX prayer_request_chat_messages_message_timestamp_idx ON core.prayer_request_chat_messages(message_timestamp);
  END IF;
END $$;

-- Composite index for sender+timestamp lookups in correlated subqueries
-- (e.g. MAX(message_timestamp) WHERE request_id=X AND user_id IS [NOT] NULL AND deletion_timestamp IS NULL)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes
    WHERE schemaname = 'core'
      AND tablename = 'prayer_request_chat_messages'
      AND indexname = 'prayer_request_chat_messages_request_sender_time_idx'
  ) THEN
    CREATE INDEX prayer_request_chat_messages_request_sender_time_idx
      ON core.prayer_request_chat_messages(request_id, user_id, message_timestamp)
      WHERE deletion_timestamp IS NULL;
  END IF;
END $$;

-- Partial index to speed up ListUnnotifiedPrayedForRequests
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes
    WHERE schemaname = 'core'
      AND tablename = 'prayer_request_chats'
      AND indexname = 'prayer_request_chats_prayed_for_unnotified_idx'
  ) THEN
    CREATE INDEX prayer_request_chats_prayed_for_unnotified_idx
      ON core.prayer_request_chats(prayed_for_timestamp)
      WHERE prayed_for_notification_timestamp IS NULL
        AND prayed_for_timestamp IS NOT NULL
        AND (request_contact_email IS NOT NULL OR request_contact_phone IS NOT NULL);
  END IF;
END $$;

-- Partial index to narrow outer scan of ListChatsNeedingUnreadNotification
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes
    WHERE schemaname = 'core'
      AND tablename = 'prayer_request_chats'
      AND indexname = 'prayer_request_chats_seeker_unread_candidates_idx'
  ) THEN
    CREATE INDEX prayer_request_chats_seeker_unread_candidates_idx
      ON core.prayer_request_chats(creation_timestamp)
      WHERE (request_contact_email IS NOT NULL OR request_contact_phone IS NOT NULL);
  END IF;
END $$;

-- participant_type is the PK discriminator instead of user_id because seekers are anonymous
-- (no user_id). user_id is stored alongside for church members so we know who last marked read.
-- Future migration: if multi-member chat is needed, change PK to (request_id, user_id) with
-- a partial unique index for the seeker (null user_id) case.
CREATE TABLE IF NOT EXISTS core.prayer_request_chat_read_receipts (
  request_id            uuid        NOT NULL,
  participant_type      varchar(10) NOT NULL CHECK (participant_type IN ('seeker', 'church')),
  user_id               uuid,
  last_read_message_id  uuid        NOT NULL,

  PRIMARY KEY (request_id, participant_type),
  CONSTRAINT read_receipt_request_fk FOREIGN KEY (request_id)
    REFERENCES core.prayer_request_chats(request_id) ON DELETE CASCADE,
  CONSTRAINT read_receipt_message_fk FOREIGN KEY (last_read_message_id)
    REFERENCES core.prayer_request_chat_messages(message_id) ON DELETE CASCADE,
  CONSTRAINT read_receipt_user_fk FOREIGN KEY (user_id)
    REFERENCES core.users(user_id) ON DELETE SET NULL
);

-- Function to create a prayer request and assign it to a nearby church
CREATE OR REPLACE FUNCTION core.create_prayer_request_chat_with_church_assignment(
  PARAM_contact_email       varchar(100),
  PARAM_contact_phone       varchar(20),
  PARAM_zip                 varchar(20),
  PARAM_city                varchar(100),
  PARAM_region              varchar(100),
  PARAM_messages            text[],
  PARAM_message_timestamps  bigint[],
  PARAM_message_ids         uuid[],
  PARAM_church_id           uuid
) RETURNS UUID AS $$
DECLARE
  VAR_prayer_request_chat_id  UUID;
BEGIN
  -- Create the prayer request
  INSERT INTO core.prayer_request_chats (
    request_contact_email,
    request_contact_phone,
    zip,
    city,
    region,
    creation_timestamp,
    modification_timestamp,
    assigned_church_id
  ) VALUES (
    PARAM_contact_email,
    PARAM_contact_phone,
    PARAM_zip,
    PARAM_city,
    PARAM_region,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP,
    PARAM_church_id
  )
  RETURNING request_id INTO VAR_prayer_request_chat_id;

  -- Insert the messages into the prayer request chat messages table
  INSERT INTO core.prayer_request_chat_messages (
    request_id,
    message,
    message_timestamp,
    message_id
  ) SELECT
    VAR_prayer_request_chat_id,
    mes,
    to_timestamp(epoch / 1000) AT TIME ZONE 'UTC',
    mes_id
  FROM UNNEST(PARAM_messages, PARAM_message_timestamps, PARAM_message_ids)
    AS t(mes, epoch, mes_id);

  RETURN VAR_prayer_request_chat_id;
END;
$$ LANGUAGE plpgsql; 
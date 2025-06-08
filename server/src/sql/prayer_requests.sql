-- Each prayer request corresponds to a chat that starts from a request 
-- user. 
CREATE TABLE IF NOT EXISTS core.prayer_request_chats (
  request_id                uuid                PRIMARY KEY DEFAULT gen_random_uuid(),
  assigned_user_id          uuid,
  assigned_church_id        uuid,                
  responded                 boolean             NOT NULL DEFAULT false,

  -- Location information
  zip                       varchar(20),
  city                      varchar(100),
  region                    varchar(100),

  request_contact_email     varchar(100),
  request_contact_phone     varchar(20),

  -- Metadata
  creation_timestamp        timestamp           NOT NULL DEFAULT now(),
  modification_timestamp    timestamp           NOT NULL DEFAULT now(),

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
  -- Since we are only doing 1:1 chats for now, if this is null it must be
  -- the user speaking. Otherwise, it is the prayer team.
  assigned_user_id          uuid,

  -- If deleted, we can have the UI show "deleted" instead of the message.
  deletion_timestamp        timestamp,

  CONSTRAINT request_fk FOREIGN KEY (request_id)
    REFERENCES core.prayer_request_chats(request_id) ON DELETE CASCADE,
  CONSTRAINT assigned_user_fk FOREIGN KEY (assigned_user_id)
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
    CREATE UNIQUE INDEX prayer_requests_user_id_idx ON core.prayer_request_chats(assigned_user_id);
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
    CREATE UNIQUE INDEX prayer_requests_church_id_idx ON core.prayer_request_chats(assigned_church_id);
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

-- Function to create a prayer request and assign it to a nearby church
CREATE OR REPLACE FUNCTION core.create_prayer_request_chat_with_church_assignment(
  PARAM_contact_email       varchar(100),
  PARAM_contact_phone       varchar(20),
  PARAM_zip                 varchar(20),
  PARAM_city                varchar(100),
  PARAM_region              varchar(100),
  PARAM_messages            text[],
  PARAM_message_timestamps  bigint[],
  PARAM_message_ids         uuid[]
) RETURNS UUID AS $$
DECLARE
  VAR_prayer_request_chat_id  UUID;
BEGIN
  -- -- Find a nearby church based on location
  -- SELECT  church_id 
  -- INTO    VAR_church_id
  -- FROM    core.churches
  -- WHERE   (PARAM_zip IS NULL OR zip = PARAM_zip) 
  -- AND     (PARAM_county IS NULL OR county = PARAM_county) 
  -- AND     (PARAM_city IS NULL OR city = PARAM_city)
  -- LIMIT   1;

  -- Create the prayer request
  INSERT INTO core.prayer_request_chats (
    request_contact_email,
    request_contact_phone,
    zip,
    city,
    region,
    creation_timestamp,
    modification_timestamp
  ) VALUES (
    PARAM_contact_email,
    PARAM_contact_phone,
    PARAM_zip,
    PARAM_city,
    PARAM_region,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
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
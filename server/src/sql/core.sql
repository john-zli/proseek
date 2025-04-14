CREATE SCHEMA IF NOT EXISTS core;

GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA core TO proseek_admin;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA core TO proseek_admin;

CREATE TABLE IF NOT EXISTS core.genders (
  gender        varchar(10) PRIMARY KEY
);

INSERT INTO core.genders(gender) VALUES 
  ('Male'),
  ('Female')
ON CONFLICT DO NOTHING;

CREATE TABLE IF NOT EXISTS core.users (
  user_id                   uuid                PRIMARY KEY DEFAULT gen_random_uuid(),
  church_id                 uuid                NOT NULL,
  first_name                varchar(50)         NOT NULL,
  last_name                 varchar(50)         NOT NULL,
  password_hash             varchar(255)        NOT NULL,

  -- Demographic information
  email                     varchar(100)        UNIQUE,
  phone                     varchar(20)         UNIQUE,
  gender                    varchar(10)         NOT NULL,

  -- Metadata
  creation_timestamp        timestamp           DEFAULT now(),
  modification_timestamp    timestamp           DEFAULT now(),
  deletion_timestamp        timestamp,

  CONSTRAINT church_fk FOREIGN KEY (church_id)
    REFERENCES core.churches(church_id) ON DELETE CASCADE,
  CONSTRAINT gender_fk FOREIGN KEY (gender) REFERENCES core.genders(gender),
  CONSTRAINT email_or_phone_check CHECK (email IS NOT NULL OR phone IS NOT NULL)
);

DO $$
BEGIN
  IF NOT EXISTS ( SELECT 1
                  FROM  pg_indexes
                  WHERE schemaname = 'core'
                    AND tablename = 'users'
                    AND indexname = 'users_church_id_idx'
  ) THEN
    CREATE INDEX users_church_id_idx ON core.users (church_id);
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS ( SELECT 1
                  FROM  pg_indexes
                  WHERE schemaname = 'core'
                    AND tablename = 'users'
                    AND indexname = 'users_creation_timestamp_idx'
  ) THEN
    CREATE INDEX users_creation_timestamp_idx ON core.users (creation_timestamp);
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS core.churches (
  church_id                 uuid                PRIMARY KEY DEFAULT gen_random_uuid(),
  name                      varchar(100)        NOT NULL,
  address                   varchar(255)        NOT NULL,
  city                      varchar(100)        NOT NULL,
  state                     varchar(50)         NOT NULL,
  zip                       varchar(20)         NOT NULL,
  country                   varchar(50)         NOT NULL,
  county                    varchar(50),

  -- Metadata
  creation_timestamp        timestamp           NOT NULL DEFAULT now(),
  modification_timestamp    timestamp           NOT NULL DEFAULT now(),
  deletion_timestamp        timestamp,

  CONSTRAINT church_name_unique UNIQUE (name, address, city, state, zip, country)
);

CREATE TABLE IF NOT EXISTS core.request_contact_methods(
  method                   varchar(20)        PRIMARY KEY
);

INSERT INTO core.request_contact_methods(method) VALUES 
  ('Email'),
  ('Text')
ON CONFLICT DO NOTHING;

-- Each prayer request corresponds to a chat that starts from a request 
-- user. 
CREATE TABLE IF NOT EXISTS core.prayer_request_chats (
  request_id                uuid                PRIMARY KEY DEFAULT gen_random_uuid(),
  assigned_user_id          uuid,
  assigned_church_id        uuid,                
  responded                 boolean             NOT NULL DEFAULT false,

  -- Location information
  zip                       varchar(20),
  county                    varchar(50),
  city                      varchar(100),

  request_contact_email     varchar(100),
  request_contact_phone     varchar(20),
  request_contact_name      varchar(100),
  request_contact_method    varchar(20)         NOT NULL,
  request_summary           text                NOT NULL,

  -- Metadata
  creation_timestamp        timestamp           NOT NULL DEFAULT now(),
  modified_timestamp        timestamp           NOT NULL DEFAULT now(),

  CONSTRAINT assigned_user_fk FOREIGN KEY (assigned_user_id)
    REFERENCES core.users(user_id) ON DELETE SET NULL,
  CONSTRAINT assigned_church_fk FOREIGN KEY (assigned_church_id)
    REFERENCES core.churches(church_id) ON DELETE SET NULL,
  CONSTRAINT contact_method_fk FOREIGN KEY (request_contact_method)
    REFERENCES core.request_contact_methods(method),
  CONSTRAINT request_contact_email_check CHECK (
    (request_contact_email IS NOT NULL AND request_contact_method = 'Email') OR 
    (request_contact_phone IS NOT NULL AND request_contact_method = 'Text')
  )
);

CREATE TABLE IF NOT EXISTS core.prayer_request_chat_messages (
  message_id                uuid                PRIMARY KEY DEFAULT gen_random_uuid(),
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
        CREATE INDEX idx_prayer_requests_location ON core.prayer_request_chats(zip, county, city);
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

-- Creating a unique index for churches, so no two churches can have same address.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_indexes
    WHERE schemaname = 'core'
      AND tablename = 'churches'
      AND indexname = 'churches_unique_idx'
  ) THEN

    -- We don't do unique index on just addres, because multiple churches can exist
    -- at one addres.
    CREATE UNIQUE INDEX churches_unique_idx
      ON core.churches (name, address, city, state, zip, country)
      WHERE deletion_timestamp IS NULL;
  END IF;
END $$;

-- Function to create a prayer request and assign it to a nearby church
CREATE OR REPLACE FUNCTION core.create_prayer_request_chat_with_church_assignment(
  PARAM_summary           text,
  PARAM_contact_email     varchar(100),
  PARAM_contact_phone     varchar(20),
  PARAM_contact_name      varchar(100),
  PARAM_contact_method    varchar(20),
  PARAM_zip               varchar(20),
  PARAM_county            varchar(50),
  PARAM_city              varchar(100)
) RETURNS core.prayer_request_chats AS $$
DECLARE
  VAR_church_id       UUID;
  VAR_prayer_request  core.prayer_request_chats;
BEGIN
  -- Find a nearby church based on location
  SELECT  church_id 
  INTO    VAR_church_id
  FROM    core.churches
  WHERE   (PARAM_zip IS NULL OR zip = PARAM_zip) 
  AND     (PARAM_county IS NULL OR county = PARAM_county) 
  AND     (PARAM_city IS NULL OR city = PARAM_city)
  LIMIT   1;

  -- Create the prayer request
  INSERT INTO core.prayer_request_chats (
    request_summary,
    request_contact_email,
    request_contact_phone,
    request_contact_name,
    request_contact_method,
    zip,
    county,
    city,
    assigned_church_id,
    creation_timestamp,
    modified_timestamp
  ) VALUES (
    PARAM_summary,
    PARAM_contact_email,
    PARAM_contact_phone,
    PARAM_contact_name,
    PARAM_contact_method,
    PARAM_zip,
    PARAM_county,
    PARAM_city,
    VAR_church_id,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
  )
  RETURNING * INTO VAR_prayer_request;

  RETURN VAR_prayer_request;
END;
$$ LANGUAGE plpgsql;

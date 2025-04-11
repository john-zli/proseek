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

CREATE TABLE IF NOT EXISTS core.prayer_requests (
  request_id                uuid                PRIMARY KEY DEFAULT gen_random_uuid(),
  assigned_user_id          uuid,
  assigned_church_id        uuid,                
  responded                 boolean             NOT NULL DEFAULT false,

  -- TODO(johnli): How to store location and find closest areas?
  -- request_location ?
  request_contact_email     varchar(100),
  request_contact_phone     varchar(20),
  request_contact_name      varchar(100),
  request_contact_method    varchar(20)         NOT NULL,
  request_summary           text                NOT NULL,

  -- Do we need responses?

  -- Metadata
  creation_timestamp        timestamp           DEFAULT now(),
  modification_timestamp    timestamp           DEFAULT now(),

  CONSTRAINT assigned_church_fk FOREIGN KEY (assigned_church_id)
    REFERENCES core.churches(church_id) ON DELETE CASCADE,
  CONSTRAINT assigned_user_fk FOREIGN KEY (assigned_user_id) REFERENCES core.users(user_id),
  CONSTRAINT request_contact_method_fk FOREIGN KEY (request_contact_method)
    REFERENCES core.request_contact_methods(method),
  CONSTRAINT request_contact_email_check CHECK (
    (request_contact_email IS NOT NULL AND request_contact_method = 'Email') OR (request_contact_phone IS NOT NULL AND request_contact_method = 'Text')
  ) 
);

-- Indices on prayer_requests table for faster lookups.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_indexes
    WHERE schemaname = 'core'
      AND tablename = 'prayer_requests'
      AND indexname = 'prayer_requests_user_id_idx'
  ) THEN
    CREATE UNIQUE INDEX prayer_requests_user_id_idx ON core.prayer_requests(assigned_user_id);
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_indexes
    WHERE schemaname = 'core'
      AND tablename = 'prayer_requests'
      AND indexname = 'prayer_requests_church_id_idx'
  ) THEN
    CREATE UNIQUE INDEX prayer_requests_church_id_idx ON core.prayer_requests(assigned_church_id);
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

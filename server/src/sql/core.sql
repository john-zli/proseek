CREATE SCHEMA core;

CREATE TABLE IF NOT EXISTS core.genders (
  gender        varchar(10) PRIMARY KEY
);

INSERT INTO core.genders(gender) VALUES 
  ('Male'),
  ('Female')
ON CONFLICT DO NOTHING;

CREATE TABLE IF NOT EXISTS core.users (
  id                        uuid                PRIMARY KEY DEFAULT gen_random_uuid(),
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

CREATE TABLE IF NOT EXISTS core.churches (
  church_id                 uuid                PRIMARY KEY DEFAULT gen_random_uuid(),
  name                      varchar(100)        NOT NULL,
  address                   varchar(255)        NOT NULL,
  city                      varchar(100)        NOT NULL,
  state                     varchar(50)         NOT NULL,
  zip                       varchar(20)         NOT NULL,
  country                   varchar(50)         NOT NULL,

  -- Metadata
  creation_timestamp        timestamp           NOT NULL DEFAULT now(),
  modification_timestamp    timestamp           NOT NULL DEFAULT now(),
  deletion_timestamp        timestamp,

  CONSTRAINT church_name_unique UNIQUE (name, address, city, state, zip, country)
);

CREATE TABLE IF NOT EXISTS core.prayer_requests (
  request_id                uuid                PRIMARY KEY DEFAULT gen_random_uuid(),
  assigned_user_id          uuid,
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
);

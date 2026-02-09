CREATE TABLE IF NOT EXISTS core.churches (
  church_id                 uuid                PRIMARY KEY DEFAULT gen_random_uuid(),
  name                      varchar(100)        NOT NULL,
  address                   varchar(255)        NOT NULL,
  city                      varchar(100)        NOT NULL,
  state                     varchar(50)         NOT NULL,
  zip                       varchar(20)         NOT NULL,
  country                   varchar(50)         NOT NULL,
  county                    varchar(50),
  email                     varchar(100)        NOT NULL UNIQUE,

  -- Metadata
  creation_timestamp        timestamp           NOT NULL DEFAULT now(),
  modification_timestamp    timestamp           NOT NULL DEFAULT now(),
  deletion_timestamp        timestamp,

  CONSTRAINT church_name_unique UNIQUE (name, address, city, state, zip, country)
);

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

-- Migration: Add email column if it doesn't exist (for existing databases)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'core'
      AND table_name = 'churches'
      AND column_name = 'email'
  ) THEN
    ALTER TABLE core.churches ADD COLUMN email varchar(100) NOT NULL UNIQUE;
  END IF;
END $$;

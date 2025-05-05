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
  password_hash             text,

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

CREATE TABLE IF NOT EXISTS core.user_invitations (
    code_id                 uuid                PRIMARY KEY DEFAULT gen_random_uuid(),
    church_id               uuid                NOT NULL,
    code                    varchar(20)         UNIQUE NOT NULL,
    target_email            varchar(100)        NOT NULL,
    created_by_user_id      uuid                NOT NULL,
    redeemed_by_user_id     uuid, 
    expiration_timestamp    timestamp,
    creation_timestamp      timestamp           DEFAULT now(),
    redemption_timestamp    timestamp,

    CONSTRAINT church_fk FOREIGN KEY (church_id)
        REFERENCES core.churches(church_id) ON DELETE CASCADE,
    CONSTRAINT created_by_user_fk FOREIGN KEY (created_by_user_id)
        REFERENCES core.users(user_id) ON DELETE SET NULL, -- Keep code even if creator deleted
    CONSTRAINT redeemed_by_user_fk FOREIGN KEY (redeemed_by_user_id)
        REFERENCES core.users(user_id) ON DELETE SET NULL -- Keep record even if redeemed user deleted
);

CREATE INDEX IF NOT EXISTS user_invitations_church_id_idx ON core.user_invitations (church_id);
CREATE INDEX IF NOT EXISTS user_invitations_code_idx ON core.user_invitations (code);
CREATE INDEX IF NOT EXISTS user_invitations_redeemed_by_user_id_idx ON core.user_invitations (redeemed_by_user_id);

-- Define a type to hold the result of user creation
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_type
    WHERE typname = 'user_creation_result'
      AND typnamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'core')
  ) THEN
    CREATE TYPE core.user_creation_result AS (
      user_id   uuid,
      church_id uuid,
      first_name varchar(50),
      last_name varchar(50),
      email varchar(100),
      gender varchar(10)
    );
  END IF;
END $$;

CREATE OR REPLACE FUNCTION core.create_user_and_redeem_code(
    PARAM_email             varchar(100),
    PARAM_first_name        varchar(50),
    PARAM_last_name         varchar(50),
    PARAM_gender            varchar(10),
    PARAM_password_hash     text,
    PARAM_invitation_code   varchar(20)
) RETURNS core.user_creation_result AS $$
DECLARE
  VAR_invitation_code_id  uuid;
  VAR_church_id           uuid;
  VAR_user_id             uuid;
BEGIN
    -- 1. Find and validate the invitation code and target email
    SELECT code_id, church_id
    INTO VAR_invitation_code_id, VAR_church_id
    FROM core.user_invitations
    WHERE code = PARAM_invitation_code
        AND target_email = PARAM_email
        AND redeemed_by_user_id IS NULL
        AND (expiration_timestamp IS NULL OR expiration_timestamp > now());

    IF VAR_invitation_code_id IS NULL THEN
        -- Code invalid, expired, already redeemed, or for a different email
        RAISE EXCEPTION 'INVALID_INVITATION_CODE' USING ERRCODE = 'P0001', HINT = 'Code may be expired, redeemed, or assigned to a different email.';
    END IF;

    -- 2. Check if user email already exists
    IF EXISTS (SELECT 1 FROM core.users WHERE email = PARAM_email) THEN
        RAISE EXCEPTION 'USER_EMAIL_EXISTS' USING ERRCODE = '23505'; -- unique_violation
    END IF;

    -- 3. Create the user
    INSERT INTO core.users (
        church_id,
        first_name,
        last_name,
        email,
        gender,
        password_hash
    ) VALUES (
        VAR_church_id,
        PARAM_first_name,
        PARAM_last_name,
        PARAM_email,
        PARAM_gender,
        PARAM_password_hash
    )
    RETURNING user_id, church_id INTO VAR_user_id, VAR_church_id;

    -- 4. Redeem the invitation code
    UPDATE core.user_invitations
    SET redeemed_by_user_id = VAR_user_id,
        redemption_timestamp = now()
    WHERE code_id = VAR_invitation_code_id;

    RETURN (VAR_user_id, VAR_church_id, PARAM_first_name, PARAM_last_name, PARAM_email, PARAM_gender);
END;
$$ LANGUAGE plpgsql;

-- Function to generate a unique invitation code
CREATE OR REPLACE FUNCTION core.generate_invitation_code(
    PARAM_church_id         uuid,
    PARAM_created_by_user_id uuid,
    PARAM_target_email      varchar(100),
    PARAM_code_length       integer DEFAULT 8 -- Default length for the code
) RETURNS varchar AS $$
DECLARE
    VAR_generated_code  varchar;
    VAR_code_exists     boolean;
    VAR_max_attempts    integer := 10; -- Prevent infinite loops
    VAR_attempt         integer := 0;
BEGIN
    LOOP
        -- Generate a random alphanumeric code
        SELECT string_agg(
            (
                SELECT substr('ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789', floor(random() * 62)::integer + 1, 1)
            ), ''
        )
        INTO VAR_generated_code
        FROM generate_series(1, PARAM_code_length);

        -- Check if the code already exists (case-sensitive check)
        SELECT EXISTS (
            SELECT 1 FROM core.user_invitations WHERE code = VAR_generated_code
        ) INTO VAR_code_exists;

        -- Exit loop if code is unique or max attempts reached
        EXIT WHEN NOT VAR_code_exists OR VAR_attempt >= VAR_max_attempts;

        VAR_attempt := VAR_attempt + 1;
    END LOOP;

    -- Raise an error if a unique code couldn't be generated
    IF VAR_code_exists THEN
        RAISE EXCEPTION 'Could not generate a unique invitation code after % attempts.', VAR_max_attempts;
    END IF;

    -- Insert the new invitation code
    INSERT INTO core.user_invitations (
        church_id,
        code,
        target_email,
        created_by_user_id,
        expiration_timestamp
    ) VALUES (
        PARAM_church_id,
        VAR_generated_code,
        PARAM_target_email,
        PARAM_created_by_user_id,
        now() + INTERVAL '7 days'
    );

    RETURN VAR_generated_code;
END;
$$ LANGUAGE plpgsql;

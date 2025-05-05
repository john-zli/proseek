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

CREATE OR REPLACE FUNCTION core.create_user_and_redeem_code(
    PARAM_email             varchar(100),
    PARAM_first_name        varchar(50),
    PARAM_last_name         varchar(50),
    PARAM_gender            varchar(10),
    PARAM_password_hash     text,
    PARAM_invitation_code   varchar(20)
) RETURNS uuid AS $$
DECLARE
  VAR_invitation_code_id  uuid;
  VAR_church_id           uuid;
  VAR_user_id             uuid;
BEGIN
    -- 1. Find and validate the invitation code
    SELECT code_id, church_id
    INTO VAR_invitation_code_id, VAR_church_id
    FROM core.invitation_codes
    WHERE code = PARAM_invitation_code
        AND redeemed_by_user_id IS NULL
        AND (expiration_timestamp IS NULL OR expiration_timestamp > now());

    IF VAR_invitation_code_id IS NULL THEN
        -- Consider raising specific errors for redeemed/expired if needed
        RAISE EXCEPTION 'INVALID_INVITATION_CODE' USING ERRCODE = 'P0001';
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
    RETURNING user_id INTO VAR_user_id;

    -- 4. Redeem the invitation code
    UPDATE core.user_invitations
    SET redeemed_by_user_id = VAR_user_id,
        redeemed_at = now()
    WHERE code_id = VAR_invitation_code_id;

    RETURN VAR_user_id;
END;
$$ LANGUAGE plpgsql;

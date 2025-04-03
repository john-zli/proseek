-- Note: This will only run on dev. Prod will have their own user already created.
DO $$
BEGIN
    -- Create user if it doesn't exist
    IF NOT EXISTS (
        SELECT FROM pg_catalog.pg_roles WHERE rolname = 'proseek_admin'
    ) THEN
        CREATE USER proseek_admin WITH PASSWORD 'password';
    END IF;

    -- Create database if it doesn't exist
    IF NOT EXISTS (
        SELECT FROM pg_database WHERE datname = 'proseek'
    ) THEN
        CREATE DATABASE proseek;
    END IF;

    -- Grant privileges
    GRANT ALL PRIVILEGES ON DATABASE proseek TO proseek_admin;
END
$$;

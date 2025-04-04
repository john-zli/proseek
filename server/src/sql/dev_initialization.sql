-- Note: This will only run on dev. Prod will have their own user already created.
-- Create user if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
      SELECT FROM pg_catalog.pg_roles WHERE rolname = 'proseek_admin'
  ) THEN
      CREATE USER proseek_admin WITH PASSWORD 'password';
  END IF;
END $$;

-- Grant privileges
GRANT ALL PRIVILEGES ON DATABASE proseek TO proseek_admin;

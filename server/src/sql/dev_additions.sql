-- Development-only bootstrapping data
-- This file should only be run in development environments

-- Insert PBC Palo Alto church
INSERT INTO core.churches (
    name,
    address,
    city,
    state,
    zip,
    country,
    county,
    email
) VALUES (
    'PBC Palo Alto',
    '3505 Middlefield Rd',
    'Palo Alto',
    'CA',
    '94306',
    'USA',
    'Santa Clara',
    'johnjohnlili12345@gmail.com'
) ON CONFLICT (name, address, city, state, zip, country)
DO UPDATE SET email = EXCLUDED.email;

-- Insert John Li user
-- Note: Password hash is a dummy value for development only
INSERT INTO core.users (
    first_name,
    last_name,
    email,
    gender,
    password_hash
) VALUES (
    'John',
    'Li',
    'johnzli@hey.com',
    'Male',
    'dev_dummy_hash_123'  -- This is a dummy hash for development only
) ON CONFLICT (email) DO NOTHING; 

INSERT INTO core.church_members (
    user_id,
    church_id,
    role
) VALUES (
    (SELECT user_id FROM core.users WHERE email = 'johnzli@hey.com'),
    (SELECT church_id FROM core.churches WHERE name = 'PBC Palo Alto' AND address = '3505 Middlefield Rd'),
    'Admin'
) ON CONFLICT (user_id, church_id) DO NOTHING;

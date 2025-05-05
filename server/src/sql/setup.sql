CREATE SCHEMA IF NOT EXISTS core;

GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA core TO proseek_admin;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA core TO proseek_admin;

\i 'src/sql/users.sql'
\i 'src/sql/churches.sql'
\i 'src/sql/prayer_requests.sql'

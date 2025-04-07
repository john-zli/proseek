# Allowing script to run anywhere
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$SCRIPT_DIR/.."

set -a
source "$ROOT_DIR/config/.env.$NODE_ENV" > /dev/null 2>&1
set +a

# Directory containing SQL files
SQL_DIR="$ROOT_DIR/src/sql"

# Check if DATABASE_CONNECTION_STRING is set
if [ -z "$DATABASE_CONNECTION_STRING" ]; then
  echo "Error: DATABASE_CONNECTION_STRING is not set in the .env file."
  exit 1
fi

# For some reason, .env files sometimes preserve the \r character. Strip that.
DATABASE_CONNECTION_STRING="$(echo "$DATABASE_CONNECTION_STRING" | tr -d '\r')"

# Loop through all .sql files in the SQL directory
for sql_file in "$SQL_DIR"/*.sql; do
  # Skip dev_initialization.sql.
  if [ -f "$sql_file" ] && [[ "$(basename "$sql_file")" != "dev_initialization.sql" ]]; then
    echo "Applying migration: $(basename "$sql_file")"

    psql "$DATABASE_CONNECTION_STRING" -f "$sql_file" 2>&1
    if [ $? -ne 0 ]; then
      echo "Migration failed for: $sql_file"
      exit 1
    fi
  fi
done

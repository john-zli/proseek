# Allowing script to run anywhere
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$SCRIPT_DIR/.."

# Only source environment variables if not in test environment
if [ "$NODE_ENV" != "test" ]; then
  set -a
  echo "Sourcing environment variables for $NODE_ENV"
  source "$ROOT_DIR/config/.env.$NODE_ENV" > /dev/null 2>&1
  set +a
fi

# Directory containing SQL files
SQL_DIR="$ROOT_DIR/src/sql"
SETUP_FILE="$SQL_DIR/setup.sql"
DEV_ADDITIONS_FILE="$SQL_DIR/dev_additions.sql"

# Check if DATABASE_CONNECTION_STRING is set
if [ -z "$DATABASE_CONNECTION_STRING" ]; then
  echo "Error: DATABASE_CONNECTION_STRING is not set in the .env file."
  exit 1
fi

# Check if setup file exists
if [ ! -f "$SETUP_FILE" ]; then
  echo "Error: Setup file not found at $SETUP_FILE"
  exit 1
fi

echo "Applying database setup from: $(basename "$SETUP_FILE")"

echo NODE_ENV: $NODE_ENV
# Execute the setup.sql file which includes other necessary files
psql "$DATABASE_CONNECTION_STRING" -f "$SETUP_FILE" 2>&1
if [ $? -ne 0 ]; then
  echo "Database setup failed."
  exit 1
fi

# In development environment, also apply dev additions
if [ "$NODE_ENV" = "development" ]; then
  if [ ! -f "$DEV_ADDITIONS_FILE" ]; then
    echo "Warning: Dev additions file not found at $DEV_ADDITIONS_FILE"
  else
    echo "Applying development additions from: $(basename "$DEV_ADDITIONS_FILE")"
    psql "$DATABASE_CONNECTION_STRING" -f "$DEV_ADDITIONS_FILE" 2>&1
    if [ $? -ne 0 ]; then
      echo "Warning: Development additions failed, but continuing."
    fi
  fi
fi

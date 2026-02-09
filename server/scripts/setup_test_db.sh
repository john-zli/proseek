#!/bin/bash

# Allowing script to run anywhere
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$SCRIPT_DIR/.."

# Set environment to test
export NODE_ENV=test

# Source the test environment variables
set -a
source "$ROOT_DIR/config/.env.test" > /dev/null 2>&1
set +a

# Check if DATABASE_CONNECTION_STRING is set
if [ -z "$DATABASE_CONNECTION_STRING" ]; then
  echo "Error: DATABASE_CONNECTION_STRING is not set in the .env.test file."
  exit 1
fi

# Run migrations
echo "Running migrations for test database..."
sh "$SCRIPT_DIR/migrations.sh"

# Verify database setup
echo "Verifying database setup..."
psql "$DATABASE_CONNECTION_STRING" -c "\dt" > /dev/null 2>&1
if [ $? -ne 0 ]; then
  echo "Error: Failed to verify database setup."
  exit 1
fi

echo "Test database setup complete!" 
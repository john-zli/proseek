# Allowing script to run anywhere
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$SCRIPT_DIR/.."

# Loading environment variables
set -a
source "$ROOT_DIR/config/.env.development" > /dev/null 2>&1
set +a

# Install PostgreSQL using Homebrew
echo "Installing PostgreSQL..."
brew update
brew install postgresql@14

# Start PostgreSQL service
echo "Starting PostgreSQL service..."
brew services start postgresql

# Verify installation
echo "PostgreSQL version:"
psql --version

echo "PostgreSQL installation complete."

# Install node stuff.
sh "$ROOT_DIR/scripts/packages.sh"

# Handle postgres scripts later
echo "Bootstrapping database..."

# Create the database if it doesn't exist.
psql -U $(whoami) -d postgres -tc "SELECT 1 FROM pg_database WHERE datname = 'proseek'" | grep -q 1 || createdb -U $(whoami) -d postgres proseek > /dev/null 2>&1

# Add new proseek_admin user if not created.
psql -U $(whoami) -d proseek -f "$ROOT_DIR/src/sql/dev_initializaton.sql" > /dev/null 2>&1
echo "PostgreSQL database initialized."

NODE_ENV=development sh "$ROOT_DIR/scripts/migrations.sh"
echo "Database bootstrapped successfully."

# Loading environment variables
set -a
source ./config/.env.development
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
sh ./scripts/packages.sh

# Handle postgres scripts later
echo "Running initialize.sql script for development environment..."
psql -U postgres -f ./sql/initialize.sql
echo "PostgreSQL database initialized."

# Switch to proseek user and run SQL files
psql $DATABASE_CONNECTION_STRING

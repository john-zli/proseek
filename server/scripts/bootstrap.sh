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

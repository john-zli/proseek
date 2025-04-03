# Install nvm
if [ -s "$NVM_DIR/nvm.sh" ]; then
  echo "nvm is already installed."
  # Load nvm into the current shell session
  . "$NVM_DIR/nvm.sh"
else 
  echo "nvm is not installed. Installing nvm..."
  curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.5/install.sh
  # Load nvm into the current shell session
  if [ -s "$NVM_DIR/nvm.sh" ]; then
    . "$NVM_DIR/nvm.sh"
    echo "✅ nvm installed: $(nvm --version)"
  else
    echo "❌ nvm installation failed. Please check the installation script."
    exit 1
  fi
fi

# Install node
if nvm ls | grep "v18.17.1" > /dev/null; then
  echo "Node.js v18.17.1 is already installed."
  nvm use v18.17.1
else
  echo "Installing Node.js v18.17.1..."
  nvm install v18.17.1
  nvm use v18.17.1
  echo "✅ Node.js installed: $(node --version)"
fi

# Install node packages
if [ -f "package.json" ]; then
  echo "Installing node packages from package.json..."
  npm install
  echo "✅ Node packages installed."
else
  echo "❌ package.json not found. Skipping npm install."
fi

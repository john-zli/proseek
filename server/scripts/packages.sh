# Install Bun
if command -v bun &> /dev/null; then
  echo "Bun is already installed."
  echo "Bun version: $(bun --version)"
else 
  echo "Bun is not installed. Installing Bun..."
  curl -fsSL https://bun.sh/install | bash
  
  # Source Bun's environment variables
  if [ -f "$HOME/.bun/bin/bun" ]; then
    export BUN_INSTALL="$HOME/.bun"
    export PATH="$BUN_INSTALL/bin:$PATH"
  else
    echo "❌ Bun installation failed. Please check the installation script."
    exit 1
  fi
fi

# Install PM2
if command -v pm2 &> /dev/null; then
  echo "PM2 is already installed."
  echo "PM2 version: $(pm2 --version)"
else 
  echo "PM2 is not installed. Installing PM2..."
  bun install -g pm2
  
  # Verify installation
  if command -v pm2 &> /dev/null; then
    echo "✅ PM2 installed successfully."
    echo "PM2 version: $(pm2 --version)"
  else
    echo "❌ PM2 installation failed. Please check the installation script."
    exit 1
  fi
fi

# Install packages using Bun
if [ -f "package.json" ]; then
  echo "Installing packages from package.json using Bun..."
  bun install > /dev/null 2>&1
  echo "✅ Packages installed using Bun."
  echo
else
  echo "❌ package.json not found. Skipping package installation."
fi

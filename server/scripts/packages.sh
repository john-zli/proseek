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

# Install packages using Bun
if [ -f "package.json" ]; then
  echo "Installing packages from package.json using Bun..."
  bun install > /dev/null 2>&1
  echo "✅ Packages installed using Bun."
  echo
else
  echo "❌ package.json not found. Skipping package installation."
fi

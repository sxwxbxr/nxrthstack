#!/bin/bash
# Install .NET SDK for Vercel builds

set -e

echo "Installing .NET 9.0 SDK..."

# Download and run the official .NET install script
curl -sSL https://dot.net/v1/dotnet-install.sh -o dotnet-install.sh
chmod +x dotnet-install.sh
./dotnet-install.sh --channel 9.0 --install-dir "$HOME/.dotnet"

# Add to PATH for this session
export DOTNET_ROOT="$HOME/.dotnet"
export PATH="$DOTNET_ROOT:$PATH"

# Verify installation
echo "Installed .NET version:"
dotnet --version

# Clean up
rm dotnet-install.sh

echo ".NET SDK installed successfully!"

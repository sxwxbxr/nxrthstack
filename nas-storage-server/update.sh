#!/bin/bash

#############################################################
#  NxrthStack NAS Storage Server - Update Script
#  Pulls latest code while preserving configuration
#############################################################

set -e

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

INSTALL_DIR="$HOME/nas-storage-server"
TEMP_DIR="$HOME/.nas-update-temp"

echo -e "${GREEN}NxrthStack NAS Storage Server - Updater${NC}"
echo "========================================"

# Step 1: Backup current .env
echo -e "${YELLOW}Step 1: Backing up configuration...${NC}"
if [ -f "$INSTALL_DIR/.env" ]; then
    cp "$INSTALL_DIR/.env" "$HOME/.nas-env-backup"
    echo "  .env backed up"
else
    echo "  No .env found, will use defaults"
fi

# Step 2: Download latest code
echo -e "${YELLOW}Step 2: Downloading latest code...${NC}"
rm -rf "$TEMP_DIR"
git clone --depth 1 https://github.com/sxwxbxr/nxrthstack.git "$TEMP_DIR" 2>/dev/null || {
    echo "  Git clone failed, trying without auth..."
    git clone --depth 1 https://github.com/sxwxbxr/nxrthstack.git "$TEMP_DIR"
}
echo "  Downloaded"

# Step 3: Replace server files
echo -e "${YELLOW}Step 3: Updating server files...${NC}"
rm -rf "$INSTALL_DIR/server.js" "$INSTALL_DIR/package.json" "$INSTALL_DIR/package-lock.json"
cp "$TEMP_DIR/nas-storage-server/server.js" "$INSTALL_DIR/"
cp "$TEMP_DIR/nas-storage-server/package.json" "$INSTALL_DIR/"
[ -f "$TEMP_DIR/nas-storage-server/update.sh" ] && cp "$TEMP_DIR/nas-storage-server/update.sh" "$INSTALL_DIR/"
echo "  Files updated"

# Step 4: Restore .env
echo -e "${YELLOW}Step 4: Restoring configuration...${NC}"
if [ -f "$HOME/.nas-env-backup" ]; then
    cp "$HOME/.nas-env-backup" "$INSTALL_DIR/.env"
    rm "$HOME/.nas-env-backup"
    echo "  .env restored"
else
    echo "  Using existing .env"
fi

# Step 5: Install dependencies
echo -e "${YELLOW}Step 5: Installing dependencies...${NC}"
cd "$INSTALL_DIR"
npm install --production --silent
echo "  Dependencies installed"

# Step 6: Cleanup
echo -e "${YELLOW}Step 6: Cleaning up...${NC}"
rm -rf "$TEMP_DIR"
echo "  Cleanup complete"

# Step 7: Restart service
echo -e "${YELLOW}Step 7: Restarting service...${NC}"
sudo systemctl restart nas-storage
sleep 2

# Step 8: Verify
echo -e "${YELLOW}Step 8: Verifying...${NC}"
if curl -s http://localhost:3001/health | grep -q "ok"; then
    echo -e "${GREEN}  ✓ Server is running!${NC}"
else
    echo "  Warning: Health check failed, checking logs..."
    sudo journalctl -u nas-storage --no-pager -n 10
fi

echo ""
echo -e "${GREEN}Update complete!${NC}"
echo ""

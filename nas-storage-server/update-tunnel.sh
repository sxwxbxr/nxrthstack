#!/bin/bash

#############################################################
#  NxrthStack NAS Storage Server - Tunnel Migration Script
#  Migrates cloudflared to dashboard-managed tunnel (token)
#  Tunnel:  74d5e8c6-e78a-43a1-95b0-ea126afb7801
#  Host:    nxrthstore.sweber.dev
#############################################################

set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

INSTALL_DIR="/opt/nas-storage-server"
TUNNEL_ID="74d5e8c6-e78a-43a1-95b0-ea126afb7801"
CONNECTOR_ID="aac45b32-6a44-466b-ae9b-1314dc3c1e2f"
NEW_HOSTNAME="nxrthstore.sweber.dev"
ALLOWED_ORIGINS="http://localhost:3000,https://nxrthstack.sweber.dev"

echo -e "${BLUE}"
echo "╔═══════════════════════════════════════════════════════════════╗"
echo "║   NxrthStack NAS Storage - Cloudflare Tunnel Migration       ║"
echo "╚═══════════════════════════════════════════════════════════════╝"
echo -e "${NC}"

echo -e "${YELLOW}Migration details:${NC}"
echo "  Tunnel ID:    $TUNNEL_ID"
echo "  Connector ID: $CONNECTOR_ID"
echo "  New hostname: $NEW_HOSTNAME"
echo ""

# Check root
if [ "$EUID" -ne 0 ]; then
    echo -e "${RED}Please run as root: sudo ./update-tunnel.sh${NC}"
    exit 1
fi

ACTUAL_USER=${SUDO_USER:-$USER}

# Prompt for tunnel token
echo -e "${YELLOW}Enter the Cloudflare Tunnel token from the Zero Trust dashboard:${NC}"
echo -e "${BLUE}  (Zero Trust → Networks → Tunnels → $TUNNEL_ID → Configure → Install connector)${NC}"
echo ""
read -sp "Token: " TUNNEL_TOKEN
echo ""

if [ -z "$TUNNEL_TOKEN" ]; then
    echo -e "${RED}Error: Tunnel token is required${NC}"
    exit 1
fi

# ──────────────────────────────────────────────
# Step 1: Stop current services
# ──────────────────────────────────────────────
echo ""
echo -e "${GREEN}Step 1/5: Stopping current services...${NC}"
systemctl stop cloudflared-nas 2>/dev/null || true
systemctl stop nas-storage 2>/dev/null || true
echo "  Services stopped"

# ──────────────────────────────────────────────
# Step 2: Update cloudflared service to use token
# ──────────────────────────────────────────────
echo -e "${GREEN}Step 2/5: Updating cloudflared service to token-based auth...${NC}"

cat > /etc/systemd/system/cloudflared-nas.service << EOF
[Unit]
Description=Cloudflare Tunnel for NAS Storage (nxrthstore)
After=network-online.target
Wants=network-online.target

[Service]
Type=simple
User=$ACTUAL_USER
ExecStart=/usr/local/bin/cloudflared tunnel --no-autoupdate run --token $TUNNEL_TOKEN
Restart=always
RestartSec=10
TimeoutStartSec=0

[Install]
WantedBy=multi-user.target
EOF

echo "  cloudflared-nas.service updated (token-based)"

# ──────────────────────────────────────────────
# Step 3: Update .env with new hostname & origins
# ──────────────────────────────────────────────
echo -e "${GREEN}Step 3/5: Updating .env configuration...${NC}"

if [ ! -f "$INSTALL_DIR/.env" ]; then
    echo -e "${RED}  Error: $INSTALL_DIR/.env not found${NC}"
    exit 1
fi

# Backup current .env
cp "$INSTALL_DIR/.env" "$INSTALL_DIR/.env.bak.$(date +%Y%m%d%H%M%S)"
echo "  .env backed up"

# Update PUBLIC_URL
if grep -q "^PUBLIC_URL=" "$INSTALL_DIR/.env"; then
    sed -i "s|^PUBLIC_URL=.*|PUBLIC_URL=https://$NEW_HOSTNAME|" "$INSTALL_DIR/.env"
else
    echo "PUBLIC_URL=https://$NEW_HOSTNAME" >> "$INSTALL_DIR/.env"
fi
echo "  PUBLIC_URL → https://$NEW_HOSTNAME"

# Update ALLOWED_ORIGINS
if grep -q "^ALLOWED_ORIGINS=" "$INSTALL_DIR/.env"; then
    sed -i "s|^ALLOWED_ORIGINS=.*|ALLOWED_ORIGINS=$ALLOWED_ORIGINS|" "$INSTALL_DIR/.env"
else
    echo "ALLOWED_ORIGINS=$ALLOWED_ORIGINS" >> "$INSTALL_DIR/.env"
fi
echo "  ALLOWED_ORIGINS → $ALLOWED_ORIGINS"

# ──────────────────────────────────────────────
# Step 4: Remove old credentials file & config
# ──────────────────────────────────────────────
echo -e "${GREEN}Step 4/5: Cleaning up old tunnel config...${NC}"
ACTUAL_HOME=$(getent passwd "$ACTUAL_USER" | cut -d: -f6)

if [ -f "$ACTUAL_HOME/.cloudflared/config.yml" ]; then
    mv "$ACTUAL_HOME/.cloudflared/config.yml" "$ACTUAL_HOME/.cloudflared/config.yml.old"
    echo "  Old config.yml renamed to config.yml.old"
fi

# Remove old credentials JSON files (tunnel is now token-managed)
OLD_CREDS=$(ls "$ACTUAL_HOME/.cloudflared/"*.json 2>/dev/null || true)
if [ -n "$OLD_CREDS" ]; then
    for f in $OLD_CREDS; do
        mv "$f" "${f}.old"
        echo "  Archived: $(basename "$f")"
    done
fi
echo "  Old tunnel artifacts cleaned up"

# ──────────────────────────────────────────────
# Step 5: Reload and restart
# ──────────────────────────────────────────────
echo -e "${GREEN}Step 5/5: Restarting services...${NC}"
systemctl daemon-reload
systemctl enable cloudflared-nas nas-storage
systemctl start nas-storage
sleep 2
systemctl start cloudflared-nas
sleep 3

# Verify
echo ""
echo -e "${YELLOW}Verifying...${NC}"

NAS_OK=false
CF_OK=false

if systemctl is-active --quiet nas-storage; then
    echo -e "  ${GREEN}✓ nas-storage is running${NC}"
    NAS_OK=true
else
    echo -e "  ${RED}✗ nas-storage failed to start${NC}"
    journalctl -u nas-storage --no-pager -n 5
fi

if systemctl is-active --quiet cloudflared-nas; then
    echo -e "  ${GREEN}✓ cloudflared-nas is running${NC}"
    CF_OK=true
else
    echo -e "  ${RED}✗ cloudflared-nas failed to start${NC}"
    journalctl -u cloudflared-nas --no-pager -n 5
fi

if curl -s http://localhost:3001/health | grep -q "ok"; then
    echo -e "  ${GREEN}✓ Health check passed (localhost:3001)${NC}"
else
    echo -e "  ${RED}✗ Health check failed${NC}"
fi

echo ""
echo -e "${GREEN}═══════════════════════════════════════════════════════════════${NC}"
if $NAS_OK && $CF_OK; then
    echo -e "${GREEN}  Migration complete!${NC}"
else
    echo -e "${YELLOW}  Migration finished with warnings — check logs above${NC}"
fi
echo -e "${GREEN}═══════════════════════════════════════════════════════════════${NC}"
echo ""
echo "  Public URL:  https://$NEW_HOSTNAME"
echo "  Tunnel ID:   $TUNNEL_ID"
echo "  Connector:   $CONNECTOR_ID"
echo ""
echo "  Test externally:  curl https://$NEW_HOSTNAME/health"
echo "  View logs:        sudo journalctl -u cloudflared-nas -f"
echo "                    sudo journalctl -u nas-storage -f"
echo ""
echo "  Update Vercel env var:"
echo "    NAS_STORAGE_URL=https://$NEW_HOSTNAME"
echo ""

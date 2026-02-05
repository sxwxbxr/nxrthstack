#!/bin/bash

#############################################################
#  NxrthStack NAS Storage Server - Tailscale Setup
#  Enables large file uploads (>100MB) bypassing Cloudflare
#############################################################

set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

SERVER_PORT=3001

echo -e "${BLUE}"
echo "╔═══════════════════════════════════════════════════════════════╗"
echo "║   NxrthStack NAS Storage - Tailscale Setup                   ║"
echo "║   Bypass Cloudflare's 100MB limit for large uploads          ║"
echo "╚═══════════════════════════════════════════════════════════════╝"
echo -e "${NC}"

# Check root
if [ "$EUID" -ne 0 ]; then
    echo -e "${RED}Please run as root: sudo ./setup-tailscale.sh${NC}"
    exit 1
fi

# ──────────────────────────────────────────────
# Step 1: Install Tailscale
# ──────────────────────────────────────────────
echo -e "${GREEN}Step 1/4: Installing Tailscale...${NC}"
if command -v tailscale &> /dev/null; then
    TS_VERSION=$(tailscale version 2>&1 | head -n1)
    echo "  Tailscale already installed: $TS_VERSION"
else
    curl -fsSL https://tailscale.com/install.sh | sh
    echo "  Installed: $(tailscale version 2>&1 | head -n1)"
fi

# ──────────────────────────────────────────────
# Step 2: Authenticate
# ──────────────────────────────────────────────
echo ""
echo -e "${GREEN}Step 2/4: Authenticating with Tailscale...${NC}"

TS_STATUS=$(tailscale status --json 2>/dev/null | grep -o '"BackendState":"[^"]*"' | cut -d'"' -f4 || echo "NeedsLogin")

if [ "$TS_STATUS" = "Running" ]; then
    echo "  Already authenticated and connected"
else
    echo -e "${YELLOW}  A browser URL will appear below — open it to authenticate.${NC}"
    echo -e "${YELLOW}  If using VNC, it will open automatically. Otherwise, copy the URL.${NC}"
    echo ""
    tailscale up
    echo ""
    echo "  Authenticated"
fi

# ──────────────────────────────────────────────
# Step 3: Enable HTTPS serve (auto-TLS)
# ──────────────────────────────────────────────
echo ""
echo -e "${GREEN}Step 3/4: Enabling HTTPS serve for port $SERVER_PORT...${NC}"

# Enable HTTPS certificates in Tailscale
tailscale set --auto-update

# Serve the storage server over HTTPS on the Tailscale hostname
# This provides auto-TLS so browsers don't block mixed content
tailscale serve --bg $SERVER_PORT
echo "  HTTPS serve enabled (auto-TLS via Tailscale)"

# ──────────────────────────────────────────────
# Step 4: Display results
# ──────────────────────────────────────────────
echo ""
echo -e "${GREEN}Step 4/4: Retrieving connection info...${NC}"

TS_IP=$(tailscale ip -4 2>/dev/null || echo "unknown")
TS_HOSTNAME=$(tailscale status --self --json 2>/dev/null | grep -o '"DNSName":"[^"]*"' | cut -d'"' -f4 | sed 's/\.$//' || echo "unknown")
TS_SERVE_URL="https://${TS_HOSTNAME}"

echo ""
echo -e "${GREEN}═══════════════════════════════════════════════════════════════${NC}"
echo -e "${GREEN}  Tailscale Setup Complete!${NC}"
echo -e "${GREEN}═══════════════════════════════════════════════════════════════${NC}"
echo ""
echo "  Tailscale IP:    $TS_IP"
echo "  Hostname:        $TS_HOSTNAME"
echo "  HTTPS URL:       $TS_SERVE_URL"
echo ""
echo -e "${YELLOW}  Add this to your Vercel environment variables:${NC}"
echo -e "${BLUE}    NAS_TAILSCALE_URL=${TS_SERVE_URL}${NC}"
echo ""
echo "  Test from a Tailscale-connected device:"
echo "    curl ${TS_SERVE_URL}/health"
echo ""
echo -e "${YELLOW}  Prerequisites for uploads >100MB:${NC}"
echo "    1. Tailscale installed on your admin machine"
echo "    2. NAS_TAILSCALE_URL set in Vercel env vars"
echo "    3. Redeploy on Vercel to pick up the new env var"
echo ""
echo "  The presign endpoint will automatically route large"
echo "  files (>95MB) through Tailscale instead of Cloudflare."
echo ""

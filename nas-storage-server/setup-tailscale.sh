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
echo -e "${GREEN}Step 1/5: Installing Tailscale...${NC}"
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
echo -e "${GREEN}Step 2/5: Authenticating with Tailscale...${NC}"

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
# Step 3: Generate TLS certificates
# ──────────────────────────────────────────────
echo ""
echo -e "${GREEN}Step 3/5: Generating Tailscale TLS certificates...${NC}"

tailscale set --auto-update

# Stop tailscale serve if running (we use direct HTTPS instead)
tailscale serve off 2>/dev/null || true

TS_IP=$(tailscale ip -4 2>/dev/null || echo "unknown")
TS_HOSTNAME=$(tailscale status --json 2>/dev/null | python3 -c "import sys,json; print(json.load(sys.stdin)['Self']['DNSName'].rstrip('.'))" 2>/dev/null || echo "")
if [ -z "$TS_HOSTNAME" ]; then
    TS_HOSTNAME=$(tailscale cert 2>&1 | grep -oP '[\w.-]+\.ts\.net' | head -n1 || echo "unknown")
fi

CERT_DIR="/opt/nas-storage-server"
CERT_FILE="$CERT_DIR/tls.crt"
KEY_FILE="$CERT_DIR/tls.key"

tailscale cert --cert-file "$CERT_FILE" --key-file "$KEY_FILE" "$TS_HOSTNAME"
chown "$ACTUAL_USER:$ACTUAL_USER" "$CERT_FILE" "$KEY_FILE"
chmod 600 "$KEY_FILE"
chmod 644 "$CERT_FILE"
echo "  TLS cert generated for $TS_HOSTNAME"

# ──────────────────────────────────────────────
# Step 4: Update .env with TLS config
# ──────────────────────────────────────────────
echo ""
echo -e "${GREEN}Step 4/5: Updating .env with TLS config...${NC}"

ENV_FILE="$CERT_DIR/.env"
if [ -f "$ENV_FILE" ]; then
    # Add or update TLS config
    for VAR in "HTTPS_PORT=3443" "TLS_CERT_PATH=$CERT_FILE" "TLS_KEY_PATH=$KEY_FILE"; do
        KEY="${VAR%%=*}"
        if grep -q "^$KEY=" "$ENV_FILE"; then
            sed -i "s|^$KEY=.*|$VAR|" "$ENV_FILE"
        else
            echo "$VAR" >> "$ENV_FILE"
        fi
    done
    echo "  .env updated with TLS config"
else
    echo -e "${RED}  Warning: $ENV_FILE not found. Add manually:${NC}"
    echo "    HTTPS_PORT=3443"
    echo "    TLS_CERT_PATH=$CERT_FILE"
    echo "    TLS_KEY_PATH=$KEY_FILE"
fi

# ──────────────────────────────────────────────
# Step 5: Set up cert auto-renewal (every 60 days)
# ──────────────────────────────────────────────
echo ""
echo -e "${GREEN}Step 5/5: Setting up cert auto-renewal...${NC}"

CRON_CMD="tailscale cert --cert-file $CERT_FILE --key-file $KEY_FILE $TS_HOSTNAME && systemctl restart nas-storage"
CRON_LINE="0 3 1 */2 * $CRON_CMD"

(crontab -l 2>/dev/null | grep -v "tailscale cert.*tls"; echo "$CRON_LINE") | crontab -
echo "  Cron job added (renews every 2 months)"

TS_UPLOAD_URL="https://${TS_HOSTNAME}:3443"

echo ""
echo -e "${GREEN}═══════════════════════════════════════════════════════════════${NC}"
echo -e "${GREEN}  Tailscale Setup Complete!${NC}"
echo -e "${GREEN}═══════════════════════════════════════════════════════════════${NC}"
echo ""
echo "  Tailscale IP:    $TS_IP"
echo "  Hostname:        $TS_HOSTNAME"
echo "  Upload URL:      $TS_UPLOAD_URL"
echo "  TLS Cert:        $CERT_FILE"
echo "  TLS Key:         $KEY_FILE"
echo ""
echo -e "${YELLOW}  Add this to your Vercel environment variables:${NC}"
echo -e "${BLUE}    NAS_TAILSCALE_URL=${TS_UPLOAD_URL}${NC}"
echo ""
echo "  Test from a Tailscale-connected device:"
echo "    curl ${TS_UPLOAD_URL}/health"
echo ""
echo -e "${YELLOW}  Prerequisites for uploads >100MB:${NC}"
echo "    1. Tailscale installed on your admin machine"
echo "    2. NAS_TAILSCALE_URL set in Vercel env vars"
echo "    3. Redeploy on Vercel to pick up the new env var"
echo "    4. Restart NAS: sudo systemctl restart nas-storage"
echo ""
echo "  The presign endpoint will automatically route large"
echo "  files (>95MB) through Tailscale instead of Cloudflare."
echo ""

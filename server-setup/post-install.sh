#!/bin/bash
# ============================================================================
# NxrthServer Post-Install Script
# Run this ONCE after setup-alpine + reboot on the installed system.
#
# Usage:
#   1. Mount USB:  mkdir -p /mnt/usb && mount /dev/sdb1 /mnt/usb
#   2. Run:        bash /mnt/usb/post-install.sh
#   3. Follow the prompts for secrets/passwords
# ============================================================================

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

step=0
total_steps=14

progress() {
    step=$((step + 1))
    echo ""
    echo -e "${CYAN}[${step}/${total_steps}]${NC} ${GREEN}$1${NC}"
    echo "────────────────────────────────────────────────"
}

warn() {
    echo -e "${YELLOW}  ⚠ $1${NC}"
}

info() {
    echo -e "  $1"
}

# ============================================================================
# PRE-FLIGHT
# ============================================================================
if [ "$(id -u)" -ne 0 ]; then
    echo -e "${RED}ERROR: Run this as root.${NC}"
    exit 1
fi

echo ""
echo "============================================"
echo "  NxrthServer Post-Install Setup"
echo "============================================"
echo ""
echo "This script will configure:"
echo "  - System packages & repositories"
echo "  - Non-root user (sweber)"
echo "  - Static IP (optional)"
echo "  - Node.js, PM2, Java 21"
echo "  - Cloudflared (Cloudflare Tunnel)"
echo "  - Tailscale VPN"
echo "  - Minecraft Server (Paper MC)"
echo "  - Minecraft Server Agent"
echo "  - Discord Bot (nxrthstack-bot)"
echo "  - NAS Storage Server"
echo "  - Firewall (iptables)"
echo "  - All OpenRC services for auto-boot"
echo ""
read -p "Press Enter to start (Ctrl+C to abort)..."

# ============================================================================
# STEP 1: Enable Community Repository
# ============================================================================
progress "Enabling community repository"

ALPINE_VERSION=$(cat /etc/alpine-release | cut -d. -f1,2)
info "Detected Alpine v${ALPINE_VERSION}"

cat > /etc/apk/repositories << EOF
https://dl-cdn.alpinelinux.org/alpine/v${ALPINE_VERSION}/main
https://dl-cdn.alpinelinux.org/alpine/v${ALPINE_VERSION}/community
EOF

apk update && apk upgrade
info "Repositories configured and system updated."

# ============================================================================
# STEP 2: Install All Packages
# ============================================================================
progress "Installing system packages"

apk add bash sudo shadow curl wget git nodejs npm openjdk21-jre screen openrc ca-certificates build-base python3 iptables ip6tables logrotate htop bind-tools tar gzip

info "All packages installed."

# ============================================================================
# STEP 3: Create Non-Root User
# ============================================================================
progress "Creating user 'sweber'"

if id "sweber" &>/dev/null; then
    warn "User 'sweber' already exists, skipping."
else
    adduser -s /bin/bash -D sweber
    echo ""
    echo "Set password for user 'sweber':"
    passwd sweber

    addgroup sweber wheel

    # Enable wheel group for sudo (passwordless for setup, can change later)
    echo "%wheel ALL=(ALL:ALL) ALL" > /etc/sudoers.d/wheel
    chmod 440 /etc/sudoers.d/wheel

    info "User 'sweber' created and added to sudoers."
fi

# ============================================================================
# STEP 4: Static IP (Optional)
# ============================================================================
progress "Network configuration"

echo ""
echo "Current network config:"
ip addr show | grep -E "inet " | grep -v 127.0.0.1
echo ""
read -p "Set a static IP? (y/N): " SET_STATIC

if [ "$SET_STATIC" = "y" ] || [ "$SET_STATIC" = "Y" ]; then
    # Detect primary interface
    IFACE=$(ip route | grep default | awk '{print $5}' | head -1)
    info "Detected interface: ${IFACE}"

    read -p "Static IP address (e.g. 192.168.1.100): " STATIC_IP
    read -p "Gateway/Router IP (e.g. 192.168.1.1): " GATEWAY_IP
    read -p "DNS server (default: 1.1.1.1): " DNS_IP
    DNS_IP=${DNS_IP:-1.1.1.1}

    cat > /etc/network/interfaces << EOF
auto lo
iface lo inet loopback

auto ${IFACE}
iface ${IFACE} inet static
    address ${STATIC_IP}
    netmask 255.255.255.0
    gateway ${GATEWAY_IP}
    dns-nameservers ${DNS_IP} 1.0.0.1
EOF

    rc-service networking restart || true
    info "Static IP set to ${STATIC_IP}"
else
    info "Keeping DHCP configuration."
fi

# ============================================================================
# STEP 5: Install Global NPM Packages
# ============================================================================
progress "Installing PM2 and tsx globally"

npm install -g pm2 tsx
info "PM2 and tsx installed."

# ============================================================================
# STEP 6: Install cloudflared
# ============================================================================
progress "Installing cloudflared"

wget -O /usr/local/bin/cloudflared https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-amd64
chmod +x /usr/local/bin/cloudflared
cloudflared --version
info "cloudflared installed."

# ============================================================================
# STEP 7: Install and Start Tailscale
# ============================================================================
progress "Setting up Tailscale"

apk add tailscale
rc-update add tailscale default
rc-service tailscale start

echo ""
echo -e "${YELLOW}Tailscale needs authentication.${NC}"
echo "Run the following command and open the URL in your browser:"
echo ""
echo "  tailscale up --ssh"
echo ""
read -p "Press Enter AFTER you have authenticated Tailscale..."

tailscale status
info "Tailscale configured."

# ============================================================================
# STEP 8: Minecraft Server
# ============================================================================
progress "Setting up Minecraft Server"

mkdir -p /opt/minecraft
chown sweber:sweber /opt/minecraft

echo ""
read -p "Minecraft version to install (default: 1.21.4): " MC_VERSION
MC_VERSION=${MC_VERSION:-1.21.4}

read -p "Max RAM in GB for Minecraft (default: 8): " MC_RAM
MC_RAM=${MC_RAM:-8}

read -p "RCON password (used by dashboard agent): " RCON_PASSWORD
if [ -z "$RCON_PASSWORD" ]; then
    RCON_PASSWORD=$(openssl rand -base64 16 | tr -dc 'a-zA-Z0-9' | head -c 20)
    info "Auto-generated RCON password: ${RCON_PASSWORD}"
fi

# Download latest Paper MC build for the version
info "Fetching latest Paper MC build for ${MC_VERSION}..."
PAPER_BUILD=$(wget -qO- "https://api.papermc.io/v2/projects/paper/versions/${MC_VERSION}/builds" | python3 -c "
import sys, json
data = json.load(sys.stdin)
builds = data.get('builds', [])
if builds:
    print(builds[-1]['build'])
else:
    print('')
" 2>/dev/null)

if [ -z "$PAPER_BUILD" ]; then
    warn "Could not auto-detect Paper build. Using manual download."
    echo "Download Paper MC manually from https://papermc.io/downloads/paper"
    echo "Place the .jar file at /opt/minecraft/paper.jar"
else
    info "Downloading Paper MC ${MC_VERSION} build ${PAPER_BUILD}..."
    wget -O /opt/minecraft/paper.jar "https://api.papermc.io/v2/projects/paper/versions/${MC_VERSION}/builds/${PAPER_BUILD}/downloads/paper-${MC_VERSION}-${PAPER_BUILD}.jar"
fi

# EULA
echo "eula=true" > /opt/minecraft/eula.txt

# server.properties
cat > /opt/minecraft/server.properties << EOF
server-port=25565
motd=\u00a7b\u00a7lNxrthStack \u00a77Minecraft Server
max-players=20
difficulty=normal
gamemode=survival
view-distance=12
simulation-distance=8
online-mode=true
white-list=false
enable-command-block=true
spawn-protection=0
max-tick-time=60000
network-compression-threshold=256
enable-rcon=true
rcon.port=25575
rcon.password=${RCON_PASSWORD}
EOF

# start.sh
MC_RAM_MIN=$((MC_RAM / 2))
cat > /opt/minecraft/start.sh << EOF
#!/bin/bash
java -Xms${MC_RAM_MIN}G -Xmx${MC_RAM}G \\
  -XX:+UseG1GC \\
  -XX:+ParallelRefProcEnabled \\
  -XX:MaxGCPauseMillis=200 \\
  -XX:+UnlockExperimentalVMOptions \\
  -XX:+DisableExplicitGC \\
  -XX:G1NewSizePercent=30 \\
  -XX:G1MaxNewSizePercent=40 \\
  -XX:G1HeapRegionSize=8M \\
  -XX:G1ReservePercent=20 \\
  -XX:G1MixedGCCountTarget=4 \\
  -XX:InitiatingHeapOccupancyPercent=15 \\
  -XX:G1MixedGCLiveThresholdPercent=90 \\
  -XX:G1RSSHGCLiveThresholdPercent=50 \\
  -XX:SurvivorRatio=32 \\
  -XX:+PerfDisableSharedMem \\
  -XX:MaxTenuringThreshold=1 \\
  -jar paper.jar --nogui
EOF
chmod +x /opt/minecraft/start.sh

# Fix ownership
chown -R sweber:sweber /opt/minecraft

# OpenRC service
cat > /etc/init.d/minecraft << 'SVCEOF'
#!/sbin/openrc-run

name="Minecraft Server"
description="Paper Minecraft Server"
command="/bin/bash"
command_args="/opt/minecraft/start.sh"
command_user="sweber"
directory="/opt/minecraft"
pidfile="/run/minecraft.pid"
command_background="yes"
output_log="/opt/minecraft/logs/service.log"
error_log="/opt/minecraft/logs/service-error.log"

depend() {
    need net
    after firewall
}

start_pre() {
    checkpath -d -o sweber:sweber /opt/minecraft/logs
}
SVCEOF
chmod +x /etc/init.d/minecraft
rc-update add minecraft default

info "Minecraft Server installed at /opt/minecraft"
info "RCON password: ${RCON_PASSWORD} (save this!)"

# ============================================================================
# STEP 9: Collect Secrets for Services
# ============================================================================
progress "Collecting secrets for Discord Bot + Agent"

echo ""
echo "You'll need these values from your existing setup."
echo "Leave blank to skip (you can set them in .env files later)."
echo ""

read -p "Discord Bot Token: " DISCORD_BOT_TOKEN
read -p "Discord Client ID (default: 1468315439309262981): " DISCORD_CLIENT_ID
DISCORD_CLIENT_ID=${DISCORD_CLIENT_ID:-1468315439309262981}
read -p "Discord Client Secret: " DISCORD_CLIENT_SECRET
read -p "Discord Guild/Server ID: " DISCORD_GUILD_ID
read -p "Database URL (Neon PostgreSQL connection string): " DATABASE_URL
read -p "CurseForge API Key (from console.curseforge.com): " CURSEFORGE_API_KEY
read -p "NAS API Key (or press Enter to generate one): " NAS_API_KEY
if [ -z "$NAS_API_KEY" ]; then
    NAS_API_KEY=$(openssl rand -base64 32)
    info "Auto-generated NAS API key: ${NAS_API_KEY}"
fi

MC_AGENT_SECRET=$(openssl rand -base64 32)
info "Auto-generated MC Agent secret: ${MC_AGENT_SECRET}"

# ============================================================================
# STEP 10: Clone Repo and Set Up Services
# ============================================================================
progress "Cloning NxrthStack repository"

mkdir -p /opt/nxrthstack/logs
chown -R sweber:sweber /opt/nxrthstack

echo ""
read -p "Git repo URL (e.g. https://github.com/sxwxbxr/nxrthstack.git): " GIT_REPO
GIT_REPO=${GIT_REPO:-https://github.com/sxwxbxr/nxrthstack.git}

su - sweber -c "git clone ${GIT_REPO} /opt/nxrthstack/repo"

# --- Discord Bot ---
info "Setting up Discord Bot..."
cd /opt/nxrthstack/repo/nxrthstack-bot
su - sweber -c "cd /opt/nxrthstack/repo/nxrthstack-bot && npm install"

cat > /opt/nxrthstack/repo/nxrthstack-bot/.env << EOF
DISCORD_BOT_TOKEN=${DISCORD_BOT_TOKEN}
DISCORD_CLIENT_ID=${DISCORD_CLIENT_ID}
DISCORD_CLIENT_SECRET=${DISCORD_CLIENT_SECRET}
DISCORD_GUILD_ID=${DISCORD_GUILD_ID}
DATABASE_URL=${DATABASE_URL}
NXRTH_API_URL=https://nxrthstack.sweber.dev
API_PORT=3001
MC_AGENT_URL=http://localhost:3003
MC_AGENT_SECRET=${MC_AGENT_SECRET}
EOF
chmod 600 /opt/nxrthstack/repo/nxrthstack-bot/.env

# PM2 ecosystem for bot
cat > /opt/nxrthstack/repo/nxrthstack-bot/ecosystem.config.cjs << 'EOF'
module.exports = {
  apps: [{
    name: 'nxrthstack-bot',
    script: 'src/index.ts',
    interpreter: 'tsx',
    cwd: '/opt/nxrthstack/repo/nxrthstack-bot',
    env: { NODE_ENV: 'production' },
    max_restarts: 10,
    min_uptime: '10s',
    restart_delay: 5000,
    error_file: '/opt/nxrthstack/logs/bot-error.log',
    out_file: '/opt/nxrthstack/logs/bot-out.log',
    log_date_format: 'YYYY-MM-DD HH:mm:ss',
    watch: false,
  }]
}
EOF

# --- NAS Storage Server ---
info "Setting up NAS Storage Server..."
cd /opt/nxrthstack/repo/nas-storage-server
su - sweber -c "cd /opt/nxrthstack/repo/nas-storage-server && npm install"

mkdir -p /data/clips
chown sweber:sweber /data/clips

cat > /opt/nxrthstack/repo/nas-storage-server/.env << EOF
PORT=3002
NAS_API_KEY=${NAS_API_KEY}
STORAGE_PATH=/data/clips
PUBLIC_URL=https://nxrthstore.sweber.dev
MAX_FILE_SIZE=5368709120
ALLOWED_ORIGINS=http://localhost:3000,https://nxrthstack.sweber.dev
HTTPS_PORT=3443
EOF
chmod 600 /opt/nxrthstack/repo/nas-storage-server/.env

# --- Minecraft Agent (placeholder - created when dashboard is built) ---
info "Creating Minecraft Agent directory..."
mkdir -p /opt/minecraft-agent
cat > /opt/minecraft-agent/.env << EOF
PORT=3003
MC_AGENT_SECRET=${MC_AGENT_SECRET}
RCON_HOST=127.0.0.1
RCON_PORT=25575
RCON_PASSWORD=${RCON_PASSWORD}
MC_SERVER_DIR=/opt/minecraft
BACKUP_DIR=/opt/minecraft/backups
CURSEFORGE_API_KEY=${CURSEFORGE_API_KEY}
MAX_BACKUP_SIZE_GB=50
EOF
chmod 600 /opt/minecraft-agent/.env
chown -R sweber:sweber /opt/minecraft-agent

# Fix all ownership
chown -R sweber:sweber /opt/nxrthstack

# ============================================================================
# STEP 11: Start PM2 Services
# ============================================================================
progress "Starting PM2 services"

su - sweber -c "cd /opt/nxrthstack/repo/nxrthstack-bot && pm2 start ecosystem.config.cjs"
su - sweber -c "pm2 start /opt/nxrthstack/repo/nas-storage-server/server.js --name nas-storage"
su - sweber -c "pm2 save"

# PM2 startup on boot
PM2_STARTUP=$(su - sweber -c "pm2 startup openrc -u sweber --hp /home/sweber" 2>&1 | grep "sudo" | tail -1)
if [ -n "$PM2_STARTUP" ]; then
    eval "$PM2_STARTUP"
fi

info "PM2 services started and saved."

# ============================================================================
# STEP 12: Cloudflare Tunnel
# ============================================================================
progress "Configuring Cloudflare Tunnel"

echo ""
echo -e "${YELLOW}Cloudflare Tunnel needs authentication.${NC}"
echo "Run the following and select your zone (sweber.dev):"
echo ""
echo "  cloudflared tunnel login"
echo ""
read -p "Press Enter AFTER you have authenticated..."

echo ""
read -p "Create tunnel now? (Y/n): " CREATE_TUNNEL
CREATE_TUNNEL=${CREATE_TUNNEL:-Y}

if [ "$CREATE_TUNNEL" = "Y" ] || [ "$CREATE_TUNNEL" = "y" ]; then
    TUNNEL_OUTPUT=$(cloudflared tunnel create nxrthserver 2>&1)
    echo "$TUNNEL_OUTPUT"

    # Extract tunnel ID
    TUNNEL_ID=$(echo "$TUNNEL_OUTPUT" | grep -oP '[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}' | head -1)

    if [ -n "$TUNNEL_ID" ]; then
        info "Tunnel ID: ${TUNNEL_ID}"

        # Find credentials file
        CRED_FILE=$(ls /root/.cloudflared/${TUNNEL_ID}.json 2>/dev/null || ls /home/sweber/.cloudflared/${TUNNEL_ID}.json 2>/dev/null || echo "")

        mkdir -p /home/sweber/.cloudflared

        cat > /home/sweber/.cloudflared/config.yml << EOF
tunnel: ${TUNNEL_ID}
credentials-file: ${CRED_FILE}

ingress:
  # Discord Bot Webhook API
  - hostname: bot.sweber.dev
    service: http://localhost:3001

  # NAS Storage Server
  - hostname: nxrthstore.sweber.dev
    service: http://localhost:3002
    originRequest:
      httpHostHeader: nxrthstore.sweber.dev

  # Minecraft Server Agent API
  - hostname: mc-api.sweber.dev
    service: http://localhost:3003

  # Catch-all
  - service: http_status:404
EOF
        chown -R sweber:sweber /home/sweber/.cloudflared

        # Create DNS routes
        cloudflared tunnel route dns nxrthserver bot.sweber.dev || true
        cloudflared tunnel route dns nxrthserver nxrthstore.sweber.dev || true
        cloudflared tunnel route dns nxrthserver mc-api.sweber.dev || true

        info "Tunnel config written and DNS routes created."
    else
        warn "Could not extract tunnel ID. Configure manually later."
    fi
else
    info "Skipping tunnel creation. Configure manually later."
fi

# Cloudflared OpenRC service
cat > /etc/init.d/cloudflared << 'SVCEOF'
#!/sbin/openrc-run

name="Cloudflare Tunnel"
description="cloudflared tunnel daemon"
command="/usr/local/bin/cloudflared"
command_args="tunnel --config /home/sweber/.cloudflared/config.yml run"
command_user="sweber"
pidfile="/run/cloudflared.pid"
command_background="yes"
output_log="/var/log/cloudflared.log"
error_log="/var/log/cloudflared-error.log"

depend() {
    need net
}
SVCEOF
chmod +x /etc/init.d/cloudflared
rc-update add cloudflared default

# ============================================================================
# STEP 13: Firewall
# ============================================================================
progress "Configuring firewall"

# Flush existing rules
iptables -F

# Allow loopback
iptables -A INPUT -i lo -j ACCEPT

# Allow established connections
iptables -A INPUT -m state --state ESTABLISHED,RELATED -j ACCEPT

# Allow SSH
iptables -A INPUT -p tcp --dport 22 -j ACCEPT

# Allow Tailscale
iptables -A INPUT -i tailscale0 -j ACCEPT

# Allow Minecraft (for direct/LAN connections)
iptables -A INPUT -p tcp --dport 25565 -j ACCEPT

# Drop everything else
iptables -A INPUT -j DROP

# Save and enable
rc-update add iptables default
/etc/init.d/iptables save

info "Firewall configured."

# ============================================================================
# STEP 14: Log Rotation
# ============================================================================
progress "Setting up log rotation"

cat > /etc/logrotate.d/nxrthstack << 'EOF'
/opt/nxrthstack/logs/*.log {
    daily
    rotate 7
    compress
    missingok
    notifempty
}

/opt/minecraft/logs/*.log {
    daily
    rotate 7
    compress
    missingok
    notifempty
}

/var/log/cloudflared*.log {
    daily
    rotate 7
    compress
    missingok
    notifempty
}
EOF

info "Log rotation configured."

# ============================================================================
# DONE
# ============================================================================
echo ""
echo "============================================"
echo -e "  ${GREEN}NxrthServer Setup Complete!${NC}"
echo "============================================"
echo ""
echo "Services configured to auto-start on boot:"
echo "  ✓ SSH (sshd)"
echo "  ✓ Tailscale VPN"
echo "  ✓ Minecraft Server (OpenRC)"
echo "  ✓ Discord Bot (PM2)"
echo "  ✓ NAS Storage Server (PM2)"
echo "  ✓ Cloudflare Tunnel (OpenRC)"
echo "  ✓ Firewall (iptables)"
echo ""
echo "────────────────────────────────────────────"
echo "  SAVE THESE SECRETS:"
echo "────────────────────────────────────────────"
echo "  RCON Password:     ${RCON_PASSWORD}"
echo "  MC Agent Secret:   ${MC_AGENT_SECRET}"
echo "  NAS API Key:       ${NAS_API_KEY}"
echo "────────────────────────────────────────────"
echo ""
echo "Quick commands:"
echo "  pm2 status               — Check bot + NAS"
echo "  rc-service minecraft status  — Check Minecraft"
echo "  tailscale status         — Check Tailscale"
echo "  cloudflared tunnel info  — Check tunnel"
echo ""
echo "Add to Vercel env vars:"
echo "  DISCORD_BOT_API_URL=https://bot.sweber.dev"
echo "  MC_AGENT_URL=https://mc-api.sweber.dev"
echo "  MC_AGENT_SECRET=${MC_AGENT_SECRET}"
echo "  NAS_STORAGE_URL=https://nxrthstore.sweber.dev"
echo "  NAS_API_KEY=${NAS_API_KEY}"
echo ""
echo -e "${YELLOW}Reboot now to verify everything starts automatically:${NC}"
echo "  reboot"

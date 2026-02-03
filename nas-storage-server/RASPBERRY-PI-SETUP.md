# Raspberry Pi NAS Storage Server - Complete Setup Guide

This guide walks you through setting up the NxrthStack storage server on a Raspberry Pi with attached NAS storage, exposed via Cloudflare Tunnel.

## Prerequisites

- Raspberry Pi (3B+, 4, or 5) with Raspberry Pi OS
- NAS/external storage mounted (e.g., `/mnt/nas` or `/media/usb`)
- Cloudflare account with a domain
- SSH access to the Pi

## Architecture Overview

```
┌─────────────────┐      ┌──────────────────┐      ┌─────────────────┐
│  NxrthStack     │      │  Cloudflare      │      │  Raspberry Pi   │
│  (Vercel)       │─────▶│  Tunnel          │─────▶│  Storage Server │
│                 │      │  clips.sweber.dev│      │  :3001          │
└─────────────────┘      └──────────────────┘      └────────┬────────┘
                                                            │
                                                   ┌────────▼────────┐
                                                   │  NAS Storage    │
                                                   │  /mnt/nas/clips │
                                                   └─────────────────┘
```

---

## Option A: Automated Installation

### 1. Download and run the installer

```bash
# SSH into your Raspberry Pi
ssh pi@raspberrypi.local

# Download the installer
curl -O https://raw.githubusercontent.com/sxwxbxr/nxrthstack/main/nas-storage-server/install.sh

# Or copy from your local machine
scp nas-storage-server/install.sh pi@raspberrypi.local:~/

# Make executable and run
chmod +x install.sh
sudo ./install.sh
```

### 2. Follow the on-screen instructions for Cloudflare setup

The script will guide you through the remaining manual steps.

---

## Option B: Manual Installation

### Step 1: Update the System

```bash
sudo apt update && sudo apt upgrade -y
```

### Step 2: Install Node.js 20.x

```bash
# Add NodeSource repository
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -

# Install Node.js
sudo apt install -y nodejs

# Verify installation
node --version  # Should show v20.x.x
npm --version
```

### Step 3: Install cloudflared

```bash
# Download cloudflared for ARM64 (Pi 4/5) or ARM (Pi 3)
# For Pi 4/5 (64-bit):
sudo curl -L https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-arm64 -o /usr/local/bin/cloudflared

# For Pi 3 or 32-bit OS:
# sudo curl -L https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-arm -o /usr/local/bin/cloudflared

sudo chmod +x /usr/local/bin/cloudflared

# Verify
cloudflared --version
```

### Step 4: Create Storage Directory

```bash
# Create directory for clips (adjust path to your NAS mount)
sudo mkdir -p /mnt/nas/clips
sudo chown $USER:$USER /mnt/nas/clips

# If your NAS is mounted elsewhere, use that path instead
# Common mount points:
#   /media/pi/NASNAME/clips
#   /mnt/usb/clips
#   /home/pi/nas/clips
```

### Step 5: Install the Storage Server

```bash
# Create installation directory
sudo mkdir -p /opt/nas-storage-server
sudo chown $USER:$USER /opt/nas-storage-server
cd /opt/nas-storage-server

# Create server.js (copy from repository or use the install script)
# Create package.json
cat > package.json << 'EOF'
{
  "name": "nas-storage-server",
  "version": "1.0.0",
  "main": "server.js",
  "scripts": { "start": "node server.js" },
  "dependencies": {
    "cors": "^2.8.5",
    "express": "^4.18.2",
    "multer": "^1.4.5-lts.1"
  }
}
EOF

# Install dependencies
npm install --production
```

### Step 6: Create Environment File

```bash
cat > /opt/nas-storage-server/.env << 'EOF'
PORT=3001
NAS_API_KEY=NTFPaBdAz2SvF7uCSnWAVeafnGzO7bd+1lpMyvUshic=
STORAGE_PATH=/mnt/nas/clips
PUBLIC_URL=https://clips.sweber.dev
MAX_FILE_SIZE=524288000
ALLOWED_ORIGINS=http://localhost:3000,https://nxrthstack.vercel.app
EOF
```

### Step 7: Create Systemd Service for Storage Server

```bash
sudo nano /etc/systemd/system/nas-storage.service
```

Paste:

```ini
[Unit]
Description=NxrthStack NAS Storage Server
After=network.target

[Service]
Type=simple
User=pi
WorkingDirectory=/opt/nas-storage-server
EnvironmentFile=/opt/nas-storage-server/.env
ExecStart=/usr/bin/node server.js
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
```

```bash
# Enable and start
sudo systemctl daemon-reload
sudo systemctl enable nas-storage
sudo systemctl start nas-storage

# Check status
sudo systemctl status nas-storage
```

### Step 8: Configure Cloudflare Tunnel

#### 8.1 Login to Cloudflare

```bash
cloudflared tunnel login
```

This opens a browser. Log in and authorize the domain.

#### 8.2 Create the Tunnel

```bash
cloudflared tunnel create nas-storage
```

Note the **Tunnel ID** displayed (e.g., `a1b2c3d4-e5f6-...`)

#### 8.3 Create Tunnel Config

```bash
mkdir -p ~/.cloudflared
nano ~/.cloudflared/config.yml
```

Paste (replace `TUNNEL_ID` with your actual ID):

```yaml
tunnel: TUNNEL_ID
credentials-file: /home/pi/.cloudflared/TUNNEL_ID.json

ingress:
  - hostname: clips.sweber.dev
    service: http://localhost:3001
  - service: http_status:404
```

#### 8.4 Route DNS

```bash
cloudflared tunnel route dns nas-storage clips.sweber.dev
```

#### 8.5 Create Systemd Service for Cloudflared

```bash
sudo nano /etc/systemd/system/cloudflared-nas.service
```

Paste:

```ini
[Unit]
Description=Cloudflare Tunnel for NAS Storage
After=network.target

[Service]
Type=simple
User=pi
ExecStart=/usr/local/bin/cloudflared tunnel run nas-storage
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
```

```bash
sudo systemctl daemon-reload
sudo systemctl enable cloudflared-nas
sudo systemctl start cloudflared-nas

# Check status
sudo systemctl status cloudflared-nas
```

---

## Step 9: Verify Everything Works

### Test health endpoint

```bash
# Local test
curl http://localhost:3001/health

# Remote test (after DNS propagates, may take a few minutes)
curl https://clips.sweber.dev/health
```

Expected response:
```json
{"status":"ok","timestamp":"2024-...","storage":"/mnt/nas/clips"}
```

### Test file upload

```bash
# Create a test file
echo "test" > /tmp/test.txt

# Upload via API
curl -X POST \
  -H "X-API-Key: NTFPaBdAz2SvF7uCSnWAVeafnGzO7bd+1lpMyvUshic=" \
  -F "file=@/tmp/test.txt" \
  "https://clips.sweber.dev/upload"
```

### Test file access

```bash
# Use the URL from the upload response
curl https://clips.sweber.dev/files/FILENAME.txt
```

---

## Step 10: Configure NxrthStack

Add these environment variables to Vercel:

```
NAS_STORAGE_URL=https://clips.sweber.dev
NAS_API_KEY=NTFPaBdAz2SvF7uCSnWAVeafnGzO7bd+1lpMyvUshic=
```

---

## Troubleshooting

### Storage server not starting

```bash
# Check logs
sudo journalctl -u nas-storage -f

# Common issues:
# - Wrong Node.js version
# - Missing dependencies (run npm install again)
# - Permission issues on storage path
```

### Cloudflared not connecting

```bash
# Check logs
sudo journalctl -u cloudflared-nas -f

# Common issues:
# - Invalid tunnel credentials
# - Config file path wrong
# - DNS not propagated yet (wait 5 minutes)
```

### Upload fails with 401

- Check the API key matches in both `.env` and your request
- Ensure the `X-API-Key` header is being sent

### Files not accessible

- Check CORS settings in `.env`
- Verify the PUBLIC_URL matches your Cloudflare hostname
- Check file permissions on storage directory

### NAS not mounted

```bash
# Check if NAS is mounted
df -h | grep mnt

# If using USB drive, check
lsblk

# Mount manually if needed
sudo mount /dev/sda1 /mnt/nas
```

### Auto-mount NAS on boot

Add to `/etc/fstab`:

```bash
# For USB drive
/dev/sda1 /mnt/nas ext4 defaults,nofail 0 2

# For network share (CIFS/SMB)
//192.168.1.100/share /mnt/nas cifs credentials=/home/pi/.smbcredentials,uid=1000,gid=1000 0 0
```

---

## Useful Commands

```bash
# Restart storage server
sudo systemctl restart nas-storage

# Restart cloudflared
sudo systemctl restart cloudflared-nas

# View storage server logs
sudo journalctl -u nas-storage -f

# View cloudflared logs
sudo journalctl -u cloudflared-nas -f

# Check disk space
df -h /mnt/nas

# List uploaded files
curl -H "X-API-Key: YOUR_KEY" https://clips.sweber.dev/files

# Get storage stats
curl -H "X-API-Key: YOUR_KEY" https://clips.sweber.dev/stats
```

---

## Security Notes

1. **API Key**: Keep it secret, only in Vercel env vars and Pi's `.env`
2. **Firewall**: The Pi doesn't need any ports open - Cloudflare Tunnel handles everything outbound
3. **Updates**: Regularly update the Pi: `sudo apt update && sudo apt upgrade`
4. **Backups**: Consider backing up the clips directory periodically

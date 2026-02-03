#!/bin/bash

#############################################################
#  NxrthStack NAS Storage Server - Automated Installer
#  For Raspberry Pi with attached storage
#############################################################

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration - Edit these before running
INSTALL_DIR="/opt/nas-storage-server"
STORAGE_PATH="/mnt/nas/clips"           # Where clips will be stored
CLOUDFLARE_HOSTNAME="clips.sweber.dev"  # Your subdomain
SERVER_PORT=3001
API_KEY="NTFPaBdAz2SvF7uCSnWAVeafnGzO7bd+1lpMyvUshic="

# Detect architecture
ARCH=$(uname -m)
case $ARCH in
    aarch64|arm64) CF_ARCH="arm64" ;;
    armv7l|armhf)  CF_ARCH="arm" ;;
    x86_64)        CF_ARCH="amd64" ;;
    *)             CF_ARCH="arm64" ;;  # Default for Pi
esac

echo -e "${BLUE}"
echo "╔═══════════════════════════════════════════════════════════════╗"
echo "║     NxrthStack NAS Storage Server - Raspberry Pi Installer    ║"
echo "╚═══════════════════════════════════════════════════════════════╝"
echo -e "${NC}"

echo -e "${YELLOW}Configuration:${NC}"
echo "  Install directory: $INSTALL_DIR"
echo "  Storage path:      $STORAGE_PATH"
echo "  Cloudflare domain: $CLOUDFLARE_HOSTNAME"
echo "  Server port:       $SERVER_PORT"
echo "  Architecture:      $ARCH ($CF_ARCH)"
echo ""

# Check if running as root
if [ "$EUID" -ne 0 ]; then
    echo -e "${RED}Please run as root (sudo ./install.sh)${NC}"
    exit 1
fi

# Get the actual user (not root)
ACTUAL_USER=${SUDO_USER:-$USER}
ACTUAL_HOME=$(getent passwd "$ACTUAL_USER" | cut -d: -f6)

echo -e "${GREEN}Step 1/7: Updating system packages...${NC}"
apt-get update -qq

echo -e "${GREEN}Step 2/7: Installing Node.js...${NC}"
if command -v node &> /dev/null; then
    NODE_VERSION=$(node -v)
    echo "  Node.js already installed: $NODE_VERSION"
else
    echo "  Installing Node.js 20.x..."
    curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
    apt-get install -y nodejs
    echo "  Installed: $(node -v)"
fi

echo -e "${GREEN}Step 3/7: Installing cloudflared...${NC}"
if command -v cloudflared &> /dev/null; then
    CF_VERSION=$(cloudflared --version 2>&1 | head -n1)
    echo "  cloudflared already installed: $CF_VERSION"
else
    echo "  Downloading cloudflared for $CF_ARCH..."
    CF_URL="https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-${CF_ARCH}"
    curl -L "$CF_URL" -o /usr/local/bin/cloudflared
    chmod +x /usr/local/bin/cloudflared
    echo "  Installed: $(cloudflared --version 2>&1 | head -n1)"
fi

echo -e "${GREEN}Step 4/7: Creating storage directory...${NC}"
mkdir -p "$STORAGE_PATH"
chown "$ACTUAL_USER:$ACTUAL_USER" "$STORAGE_PATH"
chmod 755 "$STORAGE_PATH"
echo "  Created: $STORAGE_PATH"

echo -e "${GREEN}Step 5/7: Installing storage server...${NC}"
mkdir -p "$INSTALL_DIR"

# Copy server files
cat > "$INSTALL_DIR/server.js" << 'SERVERJS'
const express = require("express");
const multer = require("multer");
const cors = require("cors");
const path = require("path");
const fs = require("fs");
const crypto = require("crypto");

const PORT = process.env.PORT || 3001;
const API_KEY = process.env.NAS_API_KEY || "change-me-to-a-secure-key";
const STORAGE_PATH = process.env.STORAGE_PATH || "./uploads";
const PUBLIC_URL = process.env.PUBLIC_URL || `http://localhost:${PORT}`;
const MAX_FILE_SIZE = parseInt(process.env.MAX_FILE_SIZE || "104857600");
const ALLOWED_ORIGINS = (process.env.ALLOWED_ORIGINS || "*").split(",");

if (!fs.existsSync(STORAGE_PATH)) {
  fs.mkdirSync(STORAGE_PATH, { recursive: true });
}

const app = express();

app.use(cors({
  origin: (origin, callback) => {
    if (!origin) return callback(null, true);
    if (ALLOWED_ORIGINS.includes(origin) || ALLOWED_ORIGINS.includes("*")) {
      return callback(null, true);
    }
    return callback(new Error("Not allowed by CORS"));
  },
  methods: ["GET", "POST", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization", "X-API-Key"],
  exposedHeaders: ["Content-Length", "Content-Type"],
}));

const authenticate = (req, res, next) => {
  const apiKey = req.headers["x-api-key"] || req.headers["authorization"]?.replace("Bearer ", "");
  if (!apiKey || apiKey !== API_KEY) {
    return res.status(401).json({ error: "Unauthorized - Invalid API key" });
  }
  next();
};

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const subfolder = req.query.folder || "";
    const destPath = path.join(STORAGE_PATH, subfolder);
    if (!fs.existsSync(destPath)) {
      fs.mkdirSync(destPath, { recursive: true });
    }
    cb(null, destPath);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    const uniqueId = crypto.randomUUID();
    const timestamp = Date.now();
    cb(null, `${timestamp}-${uniqueId}${ext}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: MAX_FILE_SIZE },
  fileFilter: (req, file, cb) => {
    const allowedMimes = [
      "video/mp4", "video/webm", "video/quicktime", "video/x-msvideo", "video/x-matroska",
      "image/jpeg", "image/png", "image/gif", "image/webp",
    ];
    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error(`File type ${file.mimetype} not allowed`));
    }
  },
});

app.get("/health", (req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString(), storage: STORAGE_PATH });
});

app.post("/upload", authenticate, upload.single("file"), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: "No file provided" });
  }
  const subfolder = req.query.folder || "";
  const relativePath = subfolder ? `${subfolder}/${req.file.filename}` : req.file.filename;
  const fileUrl = `${PUBLIC_URL}/files/${relativePath}`;
  res.json({
    success: true,
    url: fileUrl,
    filename: req.file.filename,
    originalName: req.file.originalname,
    size: req.file.size,
    mimetype: req.file.mimetype,
  });
});

app.post("/upload/multiple", authenticate, upload.array("files", 10), (req, res) => {
  if (!req.files || req.files.length === 0) {
    return res.status(400).json({ error: "No files provided" });
  }
  const subfolder = req.query.folder || "";
  const files = req.files.map((file) => {
    const relativePath = subfolder ? `${subfolder}/${file.filename}` : file.filename;
    return {
      url: `${PUBLIC_URL}/files/${relativePath}`,
      filename: file.filename,
      originalName: file.originalname,
      size: file.size,
      mimetype: file.mimetype,
    };
  });
  res.json({ success: true, files });
});

app.use("/files", express.static(STORAGE_PATH, {
  maxAge: "7d",
  etag: true,
  lastModified: true,
  setHeaders: (res, filePath) => {
    const ext = path.extname(filePath).toLowerCase();
    const mimeTypes = {
      ".mp4": "video/mp4", ".webm": "video/webm", ".mov": "video/quicktime",
      ".avi": "video/x-msvideo", ".mkv": "video/x-matroska",
      ".jpg": "image/jpeg", ".jpeg": "image/jpeg", ".png": "image/png",
      ".gif": "image/gif", ".webp": "image/webp",
    };
    if (mimeTypes[ext]) res.setHeader("Content-Type", mimeTypes[ext]);
    res.setHeader("Accept-Ranges", "bytes");
  },
}));

app.delete("/files/:filename", authenticate, (req, res) => {
  const filename = req.params.filename;
  const subfolder = req.query.folder || "";
  const filePath = path.join(STORAGE_PATH, subfolder, filename);
  const resolvedPath = path.resolve(filePath);
  const resolvedStorage = path.resolve(STORAGE_PATH);
  if (!resolvedPath.startsWith(resolvedStorage)) {
    return res.status(403).json({ error: "Access denied" });
  }
  if (!fs.existsSync(filePath)) {
    return res.status(404).json({ error: "File not found" });
  }
  try {
    fs.unlinkSync(filePath);
    res.json({ success: true, message: "File deleted" });
  } catch (error) {
    res.status(500).json({ error: "Failed to delete file" });
  }
});

app.get("/files", authenticate, (req, res) => {
  const subfolder = req.query.folder || "";
  const dirPath = path.join(STORAGE_PATH, subfolder);
  if (!fs.existsSync(dirPath)) return res.json({ files: [] });
  try {
    const files = fs.readdirSync(dirPath)
      .filter((f) => !fs.statSync(path.join(dirPath, f)).isDirectory())
      .map((filename) => {
        const filePath = path.join(dirPath, filename);
        const stats = fs.statSync(filePath);
        const relativePath = subfolder ? `${subfolder}/${filename}` : filename;
        return {
          filename, url: `${PUBLIC_URL}/files/${relativePath}`,
          size: stats.size, created: stats.birthtime, modified: stats.mtime,
        };
      });
    res.json({ files });
  } catch (error) {
    res.status(500).json({ error: "Failed to list files" });
  }
});

app.get("/stats", authenticate, (req, res) => {
  const getDirectorySize = (dirPath) => {
    let totalSize = 0, fileCount = 0;
    const walk = (dir) => {
      if (!fs.existsSync(dir)) return;
      const files = fs.readdirSync(dir);
      for (const file of files) {
        const filePath = path.join(dir, file);
        const stats = fs.statSync(filePath);
        if (stats.isDirectory()) walk(filePath);
        else { totalSize += stats.size; fileCount++; }
      }
    };
    walk(dirPath);
    return { totalSize, fileCount };
  };
  const { totalSize, fileCount } = getDirectorySize(STORAGE_PATH);
  res.json({
    totalFiles: fileCount, totalSize,
    totalSizeMB: (totalSize / (1024 * 1024)).toFixed(2),
    totalSizeGB: (totalSize / (1024 * 1024 * 1024)).toFixed(2),
    storagePath: STORAGE_PATH,
  });
});

app.use((error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    if (error.code === "LIMIT_FILE_SIZE") {
      return res.status(413).json({ error: `File too large. Max: ${MAX_FILE_SIZE / (1024 * 1024)}MB` });
    }
    return res.status(400).json({ error: error.message });
  }
  if (error.message?.includes("not allowed")) {
    return res.status(415).json({ error: error.message });
  }
  res.status(500).json({ error: "Internal server error" });
});

app.use((req, res) => res.status(404).json({ error: "Not found" }));

app.listen(PORT, "0.0.0.0", () => {
  console.log(`NAS Storage Server running on port ${PORT}`);
  console.log(`Storage path: ${STORAGE_PATH}`);
  console.log(`Public URL: ${PUBLIC_URL}`);
});
SERVERJS

cat > "$INSTALL_DIR/package.json" << 'PACKAGEJSON'
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
PACKAGEJSON

# Create .env file
cat > "$INSTALL_DIR/.env" << ENVFILE
PORT=$SERVER_PORT
NAS_API_KEY=$API_KEY
STORAGE_PATH=$STORAGE_PATH
PUBLIC_URL=https://$CLOUDFLARE_HOSTNAME
MAX_FILE_SIZE=524288000
ALLOWED_ORIGINS=http://localhost:3000,https://nxrthstack.vercel.app
ENVFILE

# Install dependencies
cd "$INSTALL_DIR"
npm install --production --silent

chown -R "$ACTUAL_USER:$ACTUAL_USER" "$INSTALL_DIR"
echo "  Server installed to: $INSTALL_DIR"

echo -e "${GREEN}Step 6/7: Creating systemd services...${NC}"

# Storage server service
cat > /etc/systemd/system/nas-storage.service << SERVICEUNIT
[Unit]
Description=NxrthStack NAS Storage Server
After=network.target

[Service]
Type=simple
User=$ACTUAL_USER
WorkingDirectory=$INSTALL_DIR
EnvironmentFile=$INSTALL_DIR/.env
ExecStart=/usr/bin/node server.js
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
SERVICEUNIT

# Cloudflared service
cat > /etc/systemd/system/cloudflared-nas.service << CFSERVICEUNIT
[Unit]
Description=Cloudflare Tunnel for NAS Storage
After=network.target

[Service]
Type=simple
User=$ACTUAL_USER
ExecStart=/usr/local/bin/cloudflared tunnel run nas-storage
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
CFSERVICEUNIT

systemctl daemon-reload
echo "  Services created"

echo -e "${GREEN}Step 7/7: Configuring Cloudflare Tunnel...${NC}"
echo ""
echo -e "${YELLOW}═══════════════════════════════════════════════════════════════${NC}"
echo -e "${YELLOW}  MANUAL STEP REQUIRED: Cloudflare Tunnel Authentication${NC}"
echo -e "${YELLOW}═══════════════════════════════════════════════════════════════${NC}"
echo ""
echo "Run these commands as your regular user (not root):"
echo ""
echo -e "${BLUE}  1. Login to Cloudflare:${NC}"
echo "     cloudflared tunnel login"
echo ""
echo -e "${BLUE}  2. Create the tunnel:${NC}"
echo "     cloudflared tunnel create nas-storage"
echo ""
echo -e "${BLUE}  3. Create config file:${NC}"
echo "     mkdir -p ~/.cloudflared"
echo "     nano ~/.cloudflared/config.yml"
echo ""
echo "     Paste this content (replace TUNNEL_ID with your tunnel ID):"
echo -e "${GREEN}"
cat << CFCONFIG
     tunnel: TUNNEL_ID
     credentials-file: $ACTUAL_HOME/.cloudflared/TUNNEL_ID.json

     ingress:
       - hostname: $CLOUDFLARE_HOSTNAME
         service: http://localhost:$SERVER_PORT
       - service: http_status:404
CFCONFIG
echo -e "${NC}"
echo ""
echo -e "${BLUE}  4. Add DNS route:${NC}"
echo "     cloudflared tunnel route dns nas-storage $CLOUDFLARE_HOSTNAME"
echo ""
echo -e "${BLUE}  5. Start the services:${NC}"
echo "     sudo systemctl enable nas-storage cloudflared-nas"
echo "     sudo systemctl start nas-storage cloudflared-nas"
echo ""
echo -e "${BLUE}  6. Check status:${NC}"
echo "     sudo systemctl status nas-storage"
echo "     sudo systemctl status cloudflared-nas"
echo ""
echo -e "${GREEN}═══════════════════════════════════════════════════════════════${NC}"
echo -e "${GREEN}  Installation Complete!${NC}"
echo -e "${GREEN}═══════════════════════════════════════════════════════════════${NC}"
echo ""
echo "Configuration summary:"
echo "  API Key:       $API_KEY"
echo "  Storage Path:  $STORAGE_PATH"
echo "  Public URL:    https://$CLOUDFLARE_HOSTNAME"
echo "  Server Port:   $SERVER_PORT"
echo ""
echo "After completing the Cloudflare steps above, test with:"
echo "  curl https://$CLOUDFLARE_HOSTNAME/health"
echo ""
echo "Add these to your Vercel environment variables:"
echo "  NAS_STORAGE_URL=https://$CLOUDFLARE_HOSTNAME"
echo "  NAS_API_KEY=$API_KEY"
echo ""

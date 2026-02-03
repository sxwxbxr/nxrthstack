# NAS Storage Server

Simple file storage server for NxrthStack Clip Gallery. Replaces Vercel Blob with local NAS storage via Cloudflare Tunnels.

## Quick Start

### 1. Install on your NAS

```bash
# Copy this folder to your NAS
scp -r nas-storage-server/ user@nas:/path/to/

# Or clone the repo
git clone https://github.com/sxwxbxr/nxrthstack.git
cd nxrthstack/nas-storage-server
```

### 2. Install dependencies

```bash
npm install
```

### 3. Configure environment

```bash
cp .env.example .env
nano .env
```

Edit the `.env` file:

```env
PORT=3001
NAS_API_KEY=your-secure-key-here  # Generate: openssl rand -base64 32
STORAGE_PATH=/volume1/clips       # Your NAS storage path
PUBLIC_URL=https://clips.yourdomain.com
ALLOWED_ORIGINS=https://nxrthstack.vercel.app
```

### 4. Start the server

```bash
# Production
npm start

# Development (auto-restart on changes)
npm run dev
```

### 5. Set up Cloudflare Tunnel

Install cloudflared on your NAS and create a tunnel:

```bash
# Install cloudflared
# Synology: download from GitHub releases
# Linux: apt install cloudflared / brew install cloudflared

# Login to Cloudflare
cloudflared tunnel login

# Create tunnel
cloudflared tunnel create nas-storage

# Configure tunnel (create ~/.cloudflared/config.yml)
tunnel: <your-tunnel-id>
credentials-file: /path/to/.cloudflared/<tunnel-id>.json

ingress:
  - hostname: clips.yourdomain.com
    service: http://localhost:3001
  - service: http_status:404

# Route DNS
cloudflared tunnel route dns nas-storage clips.yourdomain.com

# Run tunnel
cloudflared tunnel run nas-storage
```

### 6. Run as a service (optional)

#### Systemd (Linux)

```bash
sudo nano /etc/systemd/system/nas-storage.service
```

```ini
[Unit]
Description=NAS Storage Server
After=network.target

[Service]
Type=simple
User=your-user
WorkingDirectory=/path/to/nas-storage-server
ExecStart=/usr/bin/node server.js
Restart=on-failure
EnvironmentFile=/path/to/nas-storage-server/.env

[Install]
WantedBy=multi-user.target
```

```bash
sudo systemctl enable nas-storage
sudo systemctl start nas-storage
```

#### Synology Task Scheduler

1. Control Panel → Task Scheduler → Create → Triggered Task → User-defined script
2. Event: Boot-up
3. Script:
```bash
cd /volume1/docker/nas-storage-server
/usr/local/bin/node server.js >> /var/log/nas-storage.log 2>&1
```

## API Reference

### Authentication

All write endpoints require the `X-API-Key` header:

```bash
curl -H "X-API-Key: your-api-key" ...
```

### Endpoints

#### Health Check
```bash
GET /health
```
No auth required. Returns server status.

#### Upload File
```bash
POST /upload
Content-Type: multipart/form-data

# Optional query param: ?folder=clips
```

Example:
```bash
curl -X POST \
  -H "X-API-Key: your-api-key" \
  -F "file=@video.mp4" \
  "https://clips.yourdomain.com/upload?folder=clips"
```

Response:
```json
{
  "success": true,
  "url": "https://clips.yourdomain.com/files/clips/1234567890-uuid.mp4",
  "filename": "1234567890-uuid.mp4",
  "originalName": "video.mp4",
  "size": 1048576,
  "mimetype": "video/mp4"
}
```

#### Download/Stream File
```bash
GET /files/:filename
GET /files/subfolder/:filename
```
No auth required. Supports range requests for video streaming.

#### Delete File
```bash
DELETE /files/:filename?folder=subfolder
```
Requires auth.

#### List Files
```bash
GET /files?folder=clips
```
Requires auth.

#### Storage Stats
```bash
GET /stats
```
Requires auth. Returns total files, size, etc.

## Supported File Types

**Videos:**
- MP4, WebM, MOV, AVI, MKV

**Images:**
- JPEG, PNG, GIF, WebP

## Security Notes

1. **Always use a strong API key** - Generate with `openssl rand -base64 32`
2. **Use HTTPS** - Cloudflare Tunnel handles this automatically
3. **Restrict CORS origins** - Only allow your domains
4. **Firewall** - Only expose port 3001 to localhost, let Cloudflare Tunnel handle external access

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `PORT` | 3001 | Server port |
| `NAS_API_KEY` | change-me | API key for authentication |
| `STORAGE_PATH` | ./uploads | Where files are stored |
| `PUBLIC_URL` | http://localhost:3001 | Public URL for file access |
| `MAX_FILE_SIZE` | 104857600 | Max upload size (100MB) |
| `ALLOWED_ORIGINS` | localhost:3000,nxrthstack.vercel.app | CORS origins |

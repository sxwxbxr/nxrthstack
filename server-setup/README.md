# NxrthServer Setup USB

## What's on this USB

```
/post-install.sh    ← The automated setup script (run after Alpine install)
/README.md          ← This file
```

## Setup Steps

### 1. Flash Alpine Linux to a SEPARATE USB
- Download Alpine Standard from https://alpinelinux.org/downloads/
- Flash with Rufus (GPT, UEFI)

### 2. Install Alpine (manual — requires keyboard input)
- Boot from Alpine USB
- Run `setup-alpine`
- When done, power off: `poweroff`

### 3. Swap USBs — plug in THIS setup USB alongside the boot drive
- Boot into the installed Alpine system
- Login as root

### 4. Mount this USB and run the script
```sh
mkdir -p /mnt/usb
mount /dev/sdb1 /mnt/usb
bash /mnt/usb/post-install.sh
```

If `/dev/sdb1` doesn't work, find the USB with:
```sh
fdisk -l
```
Look for the USB drive (usually the smaller one) and use its partition.

### 5. Follow the prompts
The script will ask for:
- Static IP (optional)
- Minecraft version + RAM allocation
- RCON password
- Discord bot token + secrets
- Database URL
- CurseForge API key
- Cloudflare + Tailscale authentication (opens URLs)

### 6. Reboot and verify
```sh
reboot
```
Then SSH in and check everything is running.

## Have secrets ready before running

| Secret | Where to get it |
|--------|----------------|
| Discord Bot Token | https://discord.com/developers/applications |
| Discord Client Secret | Same as above |
| Discord Guild ID | Discord → Server → Right click → Copy Server ID |
| Database URL | Neon dashboard → Connection string |
| CurseForge API Key | https://console.curseforge.com |

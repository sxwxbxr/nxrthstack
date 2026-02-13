#Requires -RunAsAdministrator
#Requires -Version 5.1
<#
.SYNOPSIS
    NxrthServer Setup Script for Windows 11
.DESCRIPTION
    One-script setup for all NxrthStack server services on Windows.
    Installs prerequisites, copies services to C:\NxrthServer,
    configures PM2 auto-start, Cloudflare Tunnel, and optionally Minecraft.

    After running, the cloned repository can be safely deleted.

.USAGE
    1. Clone the repo:   git clone https://github.com/sxwxbxr/nxrthstack.git
    2. Run as admin:     PowerShell -ExecutionPolicy Bypass -File setup.ps1
    3. Follow prompts
    4. Delete the repo when done
#>

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

# ============================================================================
# CONSTANTS
# ============================================================================
$INSTALL_DIR    = "C:\NxrthServer"
$BOT_DIR        = "$INSTALL_DIR\nxrthstack-bot"
$NAS_DIR        = "$INSTALL_DIR\nas-storage-server"
$AGENT_DIR      = "$INSTALL_DIR\minecraft-agent"
$SCHEMA_DIR     = "$INSTALL_DIR\nxrthstack\lib\db"
$WEBAPP_DIR     = "$INSTALL_DIR\nxrthstack"
$MC_DIR         = "$INSTALL_DIR\minecraft"
$MC_BACKUP_DIR  = "$INSTALL_DIR\minecraft-backups"
$STORAGE_DIR    = "$INSTALL_DIR\storage\clips"
$LOGS_DIR       = "$INSTALL_DIR\logs"
$REPO_DIR       = $PSScriptRoot | Split-Path -Parent  # Repo root (parent of server-setup/)

$TOTAL_STEPS = 15
$CURRENT_STEP = 0

# ============================================================================
# HELPER FUNCTIONS
# ============================================================================
function Write-Step {
    param([string]$Message)
    $script:CURRENT_STEP++
    Write-Host ""
    Write-Host "[$script:CURRENT_STEP/$TOTAL_STEPS] $Message" -ForegroundColor Cyan
    Write-Host ("=" * 60) -ForegroundColor DarkGray
}

function Write-Info {
    param([string]$Message)
    Write-Host "  $Message" -ForegroundColor Gray
}

function Write-Success {
    param([string]$Message)
    Write-Host "  $Message" -ForegroundColor Green
}

function Write-Warn {
    param([string]$Message)
    Write-Host "  WARNING: $Message" -ForegroundColor Yellow
}

function New-RandomSecret {
    param([int]$Length = 32)
    $bytes = New-Object byte[] $Length
    [System.Security.Cryptography.RandomNumberGenerator]::Create().GetBytes($bytes)
    return [Convert]::ToBase64String($bytes)
}

function Refresh-Path {
    $machinePath = [System.Environment]::GetEnvironmentVariable("PATH", "Machine")
    $userPath = [System.Environment]::GetEnvironmentVariable("PATH", "User")
    $env:PATH = "$machinePath;$userPath"
}

function Install-WingetPackage {
    param([string]$PackageId, [string]$Name)
    $result = winget list --id $PackageId 2>&1
    if ($LASTEXITCODE -eq 0 -and ($result | Out-String) -match [regex]::Escape($PackageId)) {
        Write-Info "$Name is already installed."
    } else {
        Write-Info "Installing $Name..."
        winget install --id $PackageId --accept-source-agreements --accept-package-agreements --silent
        if ($LASTEXITCODE -ne 0) {
            Write-Warn "winget install for $Name returned exit code $LASTEXITCODE. It may still have installed."
        }
    }
}

function Write-EnvFile {
    param([string]$Path, [string]$Content)
    $utf8NoBom = New-Object System.Text.UTF8Encoding $false
    [System.IO.File]::WriteAllText($Path, $Content, $utf8NoBom)
}

# ============================================================================
# PRE-FLIGHT
# ============================================================================
Write-Host ""
Write-Host "============================================" -ForegroundColor Cyan
Write-Host "  NxrthServer Setup for Windows 11" -ForegroundColor Cyan
Write-Host "============================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "This script will install and configure:"
Write-Host "  - Node.js, Java 21, PM2, tsx"
Write-Host "  - Discord Bot (port 3001)"
Write-Host "  - NAS Storage Server (port 3002)"
Write-Host "  - Minecraft Server Agent (port 3003)"
Write-Host "  - Cloudflare Tunnel (Windows service)"
Write-Host "  - Tailscale VPN"
Write-Host "  - Minecraft Paper Server (optional, port 25565)"
Write-Host "  - Windows Firewall rules"
Write-Host ""
Write-Host "Install location: $INSTALL_DIR" -ForegroundColor Yellow
Write-Host "Source repo:      $REPO_DIR" -ForegroundColor Yellow
Write-Host ""

# Verify repo exists
if (-not (Test-Path "$REPO_DIR\nxrthstack-bot")) {
    Write-Host "ERROR: Cannot find nxrthstack-bot in $REPO_DIR" -ForegroundColor Red
    Write-Host "Make sure you're running this from the server-setup/ folder inside the repo." -ForegroundColor Red
    exit 1
}

$confirm = Read-Host "Press Enter to start (Ctrl+C to abort)"

# ============================================================================
# STEP 1: Install Prerequisites via winget
# ============================================================================
Write-Step "Installing prerequisites via winget"

Install-WingetPackage "OpenJS.NodeJS.LTS" "Node.js LTS"
Install-WingetPackage "EclipseAdoptium.Temurin.21.JRE" "Java 21 (Temurin JRE)"
Install-WingetPackage "Cloudflare.cloudflared" "Cloudflare Tunnel (cloudflared)"
Install-WingetPackage "Tailscale.Tailscale" "Tailscale VPN"

Write-Success "Prerequisites installed."

# ============================================================================
# STEP 2: Install Global npm Packages
# ============================================================================
Write-Step "Installing global npm packages (PM2, tsx)"

Refresh-Path

# Verify node is available
try {
    $nodeVersion = & node --version 2>&1
    Write-Info "Node.js $nodeVersion detected."
} catch {
    Write-Host "ERROR: Node.js not found in PATH after install." -ForegroundColor Red
    Write-Host "Close this terminal, open a NEW PowerShell (Admin), and re-run the script." -ForegroundColor Yellow
    exit 1
}

& npm install -g pm2 pm2-windows-startup tsx 2>&1 | Out-Null
Refresh-Path

Write-Success "PM2, pm2-windows-startup, and tsx installed globally."

# ============================================================================
# STEP 3: Create Directory Structure
# ============================================================================
Write-Step "Creating directory structure at $INSTALL_DIR"

$dirs = @(
    $INSTALL_DIR, $BOT_DIR, $NAS_DIR, $AGENT_DIR,
    $SCHEMA_DIR, $WEBAPP_DIR, $MC_DIR, $MC_BACKUP_DIR,
    $STORAGE_DIR, $LOGS_DIR
)

foreach ($d in $dirs) {
    if (-not (Test-Path $d)) {
        New-Item -ItemType Directory -Path $d -Force | Out-Null
        Write-Info "Created $d"
    }
}

Write-Success "Directory structure ready."

# ============================================================================
# STEP 4: Copy Services from Repo to C:\NxrthServer
# ============================================================================
Write-Step "Copying services to $INSTALL_DIR"

# Helper: copy directory excluding certain folders
function Copy-ServiceDir {
    param(
        [string]$Source,
        [string]$Destination,
        [string[]]$ExcludeDirs = @("node_modules", ".env")
    )
    # Use robocopy for reliable directory copy with exclusions
    $excludeArgs = @()
    foreach ($ex in $ExcludeDirs) {
        $excludeArgs += "/XD"
        $excludeArgs += $ex
    }
    # Also exclude .env files
    $roboArgs = @($Source, $Destination, "/E", "/NFL", "/NDL", "/NJH", "/NJS", "/NC", "/NS", "/NP") + $excludeArgs + @("/XF", ".env")
    & robocopy @roboArgs | Out-Null
    # robocopy exit codes 0-7 are success
    if ($LASTEXITCODE -gt 7) {
        throw "robocopy failed with exit code $LASTEXITCODE"
    }
}

Write-Info "Copying Discord Bot..."
Copy-ServiceDir "$REPO_DIR\nxrthstack-bot" $BOT_DIR @("node_modules", "dist", "logs")

Write-Info "Copying NAS Storage Server..."
Copy-ServiceDir "$REPO_DIR\nas-storage-server" $NAS_DIR @("node_modules", "uploads")

Write-Info "Copying Minecraft Agent..."
Copy-ServiceDir "$REPO_DIR\minecraft-agent" $AGENT_DIR @("node_modules", "dist")

# CRITICAL: Copy shared schema for bot's cross-project import
# nxrthstack-bot/src/db.ts imports from ../../nxrthstack/lib/db/schema.js
Write-Info "Copying shared database schema..."
Copy-Item -Path "$REPO_DIR\nxrthstack\lib\db\schema.ts" -Destination "$SCHEMA_DIR\schema.ts" -Force

# Copy webapp package.json so drizzle-orm types resolve during tsx execution
Copy-Item -Path "$REPO_DIR\nxrthstack\package.json" -Destination "$WEBAPP_DIR\package.json" -Force

# Install drizzle-orm in the webapp dir so the schema import resolves
Write-Info "Installing shared schema dependencies..."
Push-Location $WEBAPP_DIR
& npm init -y 2>&1 | Out-Null
& npm install drizzle-orm @neondatabase/serverless pg 2>&1 | Out-Null
Pop-Location

Write-Success "All services copied to $INSTALL_DIR"

# ============================================================================
# STEP 5: Collect Secrets
# ============================================================================
Write-Step "Collecting secrets and configuration"

Write-Host ""
Write-Host "  Have these ready before continuing:" -ForegroundColor Yellow
Write-Host "  - Discord Bot Token (from Developer Portal)"
Write-Host "  - Discord Client Secret"
Write-Host "  - Discord Guild/Server ID"
Write-Host "  - Neon PostgreSQL connection string"
Write-Host "  - CurseForge API Key (optional)"
Write-Host "  - Cloudflare Tunnel Token (from Zero Trust dashboard)"
Write-Host ""

$DISCORD_BOT_TOKEN    = Read-Host "Discord Bot Token"
$DISCORD_CLIENT_ID    = Read-Host "Discord Client ID (default: 1468315439309262981)"
if ([string]::IsNullOrWhiteSpace($DISCORD_CLIENT_ID)) { $DISCORD_CLIENT_ID = "1468315439309262981" }
$DISCORD_CLIENT_SECRET = Read-Host "Discord Client Secret"
$DISCORD_GUILD_ID     = Read-Host "Discord Guild/Server ID"
$DATABASE_URL         = Read-Host "Database URL (Neon PostgreSQL connection string)"
$CURSEFORGE_API_KEY   = Read-Host "CurseForge API Key (optional, press Enter to skip)"
$CF_TUNNEL_TOKEN      = Read-Host "Cloudflare Tunnel Token (from Zero Trust dashboard)"

# Auto-generate secrets
$NAS_API_KEY      = New-RandomSecret
$MC_AGENT_SECRET  = New-RandomSecret
$RCON_PASSWORD    = (New-RandomSecret -Length 16) -replace '[+/=]', ''  # Alphanumeric only for RCON

Write-Host ""
Write-Host "  Generated secrets:" -ForegroundColor Green
Write-Host "  NAS API Key:       $NAS_API_KEY"
Write-Host "  MC Agent Secret:   $MC_AGENT_SECRET"
Write-Host "  RCON Password:     $RCON_PASSWORD"

# ============================================================================
# STEP 6: Write .env Files
# ============================================================================
Write-Step "Writing .env configuration files"

# Bot .env
$botEnv = @"
DISCORD_BOT_TOKEN=$DISCORD_BOT_TOKEN
DISCORD_CLIENT_ID=$DISCORD_CLIENT_ID
DISCORD_CLIENT_SECRET=$DISCORD_CLIENT_SECRET
DISCORD_GUILD_ID=$DISCORD_GUILD_ID
DATABASE_URL=$DATABASE_URL
NXRTH_API_URL=https://nxrthstack.sweber.dev
API_PORT=3001
MC_AGENT_URL=http://localhost:3003
MC_AGENT_SECRET=$MC_AGENT_SECRET
"@
Write-EnvFile "$BOT_DIR\.env" $botEnv
Write-Info "Created $BOT_DIR\.env"

# NAS .env
$nasEnv = @"
PORT=3002
NAS_API_KEY=$NAS_API_KEY
STORAGE_PATH=$($STORAGE_DIR -replace '\\', '/')
PUBLIC_URL=https://nxrthstore.sweber.dev
MAX_FILE_SIZE=5368709120
ALLOWED_ORIGINS=http://localhost:3000,https://nxrthstack.sweber.dev
"@
Write-EnvFile "$NAS_DIR\.env" $nasEnv
Write-Info "Created $NAS_DIR\.env"

# MC Agent .env
$agentEnv = @"
PORT=3003
MC_SERVER_DIR=$($MC_DIR -replace '\\', '/')
MC_RCON_HOST=127.0.0.1
MC_RCON_PORT=25575
MC_RCON_PASSWORD=$RCON_PASSWORD
MC_AGENT_SECRET=$MC_AGENT_SECRET
ALLOWED_ORIGINS=https://nxrthstack.sweber.dev
BACKUP_DIR=$($MC_BACKUP_DIR -replace '\\', '/')
MAX_BACKUP_SIZE_GB=50
CURSEFORGE_API_KEY=$CURSEFORGE_API_KEY
"@
Write-EnvFile "$AGENT_DIR\.env" $agentEnv
Write-Info "Created $AGENT_DIR\.env"

Write-Success "All .env files written."

# ============================================================================
# STEP 7: Install npm Dependencies
# ============================================================================
Write-Step "Installing npm dependencies for each service"

Write-Info "Installing Discord Bot dependencies..."
Push-Location $BOT_DIR
& npm install 2>&1 | ForEach-Object { if ($_ -match "added") { Write-Info $_ } }
Pop-Location

Write-Info "Installing NAS Storage dependencies..."
Push-Location $NAS_DIR
& npm install --omit=dev 2>&1 | ForEach-Object { if ($_ -match "added") { Write-Info $_ } }
Pop-Location

Write-Info "Installing Minecraft Agent dependencies..."
Push-Location $AGENT_DIR
& npm install 2>&1 | ForEach-Object { if ($_ -match "added") { Write-Info $_ } }
Pop-Location

Write-Success "All dependencies installed."

# ============================================================================
# STEP 8: Build TypeScript Projects
# ============================================================================
Write-Step "Building TypeScript projects"

# Bot: Skip build — uses tsx interpreter at runtime (avoids cross-project rootDir issue)
Write-Info "Discord Bot: using tsx (no build needed)."

# MC Agent: Build with tsc
Write-Info "Building Minecraft Agent..."
Push-Location $AGENT_DIR
& npm run build 2>&1 | Out-Null
Pop-Location

if (Test-Path "$AGENT_DIR\dist\index.js") {
    Write-Success "Minecraft Agent built successfully."
} else {
    Write-Warn "Agent build may have failed. Check $AGENT_DIR\dist\"
}

# NAS: Plain JavaScript, no build needed
Write-Info "NAS Storage: plain JavaScript (no build needed)."

Write-Success "Build step complete."

# ============================================================================
# STEP 9: Deploy Discord Slash Commands
# ============================================================================
Write-Step "Deploying Discord slash commands"

if (-not [string]::IsNullOrWhiteSpace($DISCORD_BOT_TOKEN)) {
    Push-Location $BOT_DIR
    try {
        & npx tsx src/deploy-commands.ts 2>&1
        Write-Success "Slash commands deployed to Discord."
    } catch {
        Write-Warn "Failed to deploy commands: $($_.Exception.Message)"
        Write-Info "You can deploy later with: cd $BOT_DIR && npx tsx src/deploy-commands.ts"
    }
    Pop-Location
} else {
    Write-Warn "No bot token provided. Skipping command deployment."
}

# ============================================================================
# STEP 10: Create PM2 Ecosystem Config and Start Services
# ============================================================================
Write-Step "Configuring and starting PM2 services"

$ecosystemPath = "$INSTALL_DIR\ecosystem.config.cjs"

# Write ecosystem config with Windows paths (use forward slashes for PM2 compatibility)
$botCwd = $BOT_DIR -replace '\\', '/'
$nasCwd = $NAS_DIR -replace '\\', '/'
$agentCwd = $AGENT_DIR -replace '\\', '/'
$logDir = $LOGS_DIR -replace '\\', '/'

$ecosystemContent = @"
module.exports = {
  apps: [
    {
      name: 'nxrthstack-bot',
      script: 'src/index.ts',
      interpreter: 'tsx',
      cwd: '$botCwd',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '200M',
      env: { NODE_ENV: 'production' },
      error_file: '$logDir/bot-error.log',
      out_file: '$logDir/bot-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss',
      restart_delay: 5000,
      max_restarts: 10,
      min_uptime: '10s',
    },
    {
      name: 'nas-storage',
      script: 'server.js',
      cwd: '$nasCwd',
      instances: 1,
      autorestart: true,
      watch: false,
      env: { NODE_ENV: 'production' },
      error_file: '$logDir/nas-error.log',
      out_file: '$logDir/nas-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss',
      restart_delay: 5000,
      max_restarts: 10,
    },
    {
      name: 'minecraft-agent',
      script: 'dist/index.js',
      cwd: '$agentCwd',
      instances: 1,
      autorestart: true,
      watch: false,
      env: { NODE_ENV: 'production' },
      error_file: '$logDir/agent-error.log',
      out_file: '$logDir/agent-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss',
      restart_delay: 5000,
      max_restarts: 10,
    },
  ],
};
"@

Write-EnvFile $ecosystemPath $ecosystemContent
Write-Info "Ecosystem config written to $ecosystemPath"

# Stop any existing PM2 processes
& pm2 kill 2>&1 | Out-Null

# Start all services
Write-Info "Starting PM2 services..."
& pm2 start $ecosystemPath
& pm2 save

Write-Success "PM2 services started."

# ============================================================================
# STEP 11: PM2 Auto-Start on Windows Boot
# ============================================================================
Write-Step "Setting up PM2 auto-start on boot"

# Method 1: pm2-windows-startup
try {
    Write-Info "Trying pm2-windows-startup..."
    & pm2-startup install 2>&1 | Out-Null
    Write-Success "pm2-windows-startup installed."
} catch {
    Write-Warn "pm2-windows-startup failed. Setting up Scheduled Task fallback."
}

# Method 2 (fallback): Windows Scheduled Task
$taskName = "PM2-Resurrect-NxrthServer"
$existingTask = Get-ScheduledTask -TaskName $taskName -ErrorAction SilentlyContinue

if (-not $existingTask) {
    Write-Info "Creating Scheduled Task '$taskName'..."

    # Find pm2 executable path
    $pm2Path = (Get-Command pm2 -ErrorAction SilentlyContinue).Source
    if (-not $pm2Path) {
        $pm2Path = "$env:APPDATA\npm\pm2.cmd"
    }

    $action = New-ScheduledTaskAction -Execute "cmd.exe" -Argument "/c `"$pm2Path`" resurrect"
    $trigger = New-ScheduledTaskTrigger -AtStartup
    $settings = New-ScheduledTaskSettingsSet -AllowStartIfOnBatteries -DontStopIfGoingOnBatteries -StartWhenAvailable
    $principal = New-ScheduledTaskPrincipal -UserId $env:USERNAME -RunLevel Highest -LogonType S4U

    Register-ScheduledTask -TaskName $taskName -Action $action -Trigger $trigger `
        -Settings $settings -Principal $principal `
        -Description "Resurrect PM2 processes (NxrthServer) on boot" | Out-Null

    Write-Success "Scheduled Task '$taskName' created."
} else {
    Write-Info "Scheduled Task '$taskName' already exists."
}

# ============================================================================
# STEP 12: Cloudflare Tunnel (Windows Service)
# ============================================================================
Write-Step "Setting up Cloudflare Tunnel as Windows service"

if (-not [string]::IsNullOrWhiteSpace($CF_TUNNEL_TOKEN)) {
    # Check if service already exists
    $cfService = Get-Service -Name "cloudflared" -ErrorAction SilentlyContinue
    if ($cfService) {
        Write-Info "cloudflared service already exists. Reinstalling..."
        try {
            & cloudflared service uninstall 2>&1 | Out-Null
            Start-Sleep -Seconds 3
        } catch { }
    }

    Write-Info "Installing cloudflared as Windows service with tunnel token..."
    & cloudflared service install $CF_TUNNEL_TOKEN 2>&1

    # Give it a moment to register
    Start-Sleep -Seconds 2

    # Start the service
    try {
        Start-Service -Name "cloudflared" -ErrorAction SilentlyContinue
        Write-Success "cloudflared Windows service installed and started."
    } catch {
        Write-Info "Attempting to start 'Cloudflared agent' service..."
        try {
            Start-Service -Name "Cloudflared agent"
            Write-Success "cloudflared Windows service started."
        } catch {
            Write-Warn "Could not auto-start cloudflared service. It will start on next reboot."
            Write-Info "Or start manually: net start cloudflared"
        }
    }

    Write-Host ""
    Write-Host "  IMPORTANT: Configure tunnel routes in Cloudflare Zero Trust dashboard:" -ForegroundColor Yellow
    Write-Host "    bot.sweber.dev        -> http://localhost:3001"
    Write-Host "    nxrthstore.sweber.dev -> http://localhost:3002"
    Write-Host "    mc-api.sweber.dev     -> http://localhost:3003"
    Write-Host ""
} else {
    Write-Warn "No tunnel token provided. Skipping cloudflared service."
    Write-Info "Set up later: cloudflared service install <token>"
}

# ============================================================================
# STEP 13: Minecraft Paper Server (Optional)
# ============================================================================
Write-Step "Minecraft Paper Server (optional)"

$setupMC = Read-Host "Set up Minecraft Paper Server? (Y/n)"
if ($setupMC -ne 'n' -and $setupMC -ne 'N') {

    $MC_VERSION = Read-Host "Minecraft version (default: 1.21.4)"
    if ([string]::IsNullOrWhiteSpace($MC_VERSION)) { $MC_VERSION = "1.21.4" }

    $MC_RAM = Read-Host "Max RAM in GB for Minecraft (default: 8)"
    if ([string]::IsNullOrWhiteSpace($MC_RAM)) { $MC_RAM = "8" }
    $MC_RAM_MIN = [math]::Floor([int]$MC_RAM / 2)

    # Verify Java is available
    Refresh-Path
    try {
        $javaVersion = & java -version 2>&1 | Select-Object -First 1
        Write-Info "Java detected: $javaVersion"
    } catch {
        Write-Warn "Java not found in PATH. You may need to restart the terminal after setup."
    }

    # Download latest Paper MC build
    Write-Info "Fetching latest Paper MC build for $MC_VERSION..."
    try {
        $buildsData = Invoke-RestMethod -Uri "https://api.papermc.io/v2/projects/paper/versions/$MC_VERSION/builds"
        $latestBuild = $buildsData.builds[-1].build
        $jarName = "paper-$MC_VERSION-$latestBuild.jar"
        $jarUrl = "https://api.papermc.io/v2/projects/paper/versions/$MC_VERSION/builds/$latestBuild/downloads/$jarName"

        Write-Info "Downloading Paper MC $MC_VERSION build $latestBuild..."
        Invoke-WebRequest -Uri $jarUrl -OutFile "$MC_DIR\paper.jar" -UseBasicParsing
        Write-Success "Paper MC downloaded."
    } catch {
        Write-Warn "Failed to download Paper MC: $($_.Exception.Message)"
        Write-Info "Download manually from https://papermc.io/downloads/paper"
        Write-Info "Place the .jar file at $MC_DIR\paper.jar"
    }

    # Create eula.txt
    Write-EnvFile "$MC_DIR\eula.txt" "eula=true"
    Write-Info "EULA accepted."

    # Create server.properties
    $serverProps = @"
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
rcon.password=$RCON_PASSWORD
"@
    Write-EnvFile "$MC_DIR\server.properties" $serverProps
    Write-Info "server.properties created."

    # Create start script
    $startBat = @"
@echo off
title NxrthStack Minecraft Server
java -Xms${MC_RAM_MIN}G -Xmx${MC_RAM}G ^
  -XX:+UseG1GC ^
  -XX:+ParallelRefProcEnabled ^
  -XX:MaxGCPauseMillis=200 ^
  -XX:+UnlockExperimentalVMOptions ^
  -XX:+DisableExplicitGC ^
  -XX:G1NewSizePercent=30 ^
  -XX:G1MaxNewSizePercent=40 ^
  -XX:G1HeapRegionSize=8M ^
  -XX:G1ReservePercent=20 ^
  -XX:G1MixedGCCountTarget=4 ^
  -XX:InitiatingHeapOccupancyPercent=15 ^
  -XX:G1MixedGCLiveThresholdPercent=90 ^
  -XX:G1RSSHGCLiveThresholdPercent=50 ^
  -XX:SurvivorRatio=32 ^
  -XX:+PerfDisableSharedMem ^
  -XX:MaxTenuringThreshold=1 ^
  -jar paper.jar --nogui
pause
"@
    Write-EnvFile "$MC_DIR\start-minecraft.bat" $startBat
    Write-Info "start-minecraft.bat created."

    # Create Scheduled Task for auto-start
    $mcTaskName = "NxrthServer-Minecraft"
    $existingMcTask = Get-ScheduledTask -TaskName $mcTaskName -ErrorAction SilentlyContinue

    if (-not $existingMcTask) {
        # Find java.exe
        Refresh-Path
        $javaExe = (Get-Command java -ErrorAction SilentlyContinue).Source
        if (-not $javaExe) { $javaExe = "java" }

        $jvmArgs = "-Xms${MC_RAM_MIN}G -Xmx${MC_RAM}G -XX:+UseG1GC -XX:+ParallelRefProcEnabled -XX:MaxGCPauseMillis=200 -XX:+UnlockExperimentalVMOptions -XX:+DisableExplicitGC -XX:G1NewSizePercent=30 -XX:G1MaxNewSizePercent=40 -XX:G1HeapRegionSize=8M -XX:G1ReservePercent=20 -XX:G1MixedGCCountTarget=4 -XX:InitiatingHeapOccupancyPercent=15 -XX:G1MixedGCLiveThresholdPercent=90 -XX:G1RSSHGCLiveThresholdPercent=50 -XX:SurvivorRatio=32 -XX:+PerfDisableSharedMem -XX:MaxTenuringThreshold=1 -jar paper.jar --nogui"

        $mcAction = New-ScheduledTaskAction -Execute $javaExe -Argument $jvmArgs -WorkingDirectory $MC_DIR
        $mcTrigger = New-ScheduledTaskTrigger -AtStartup
        $mcDelay = New-TimeSpan -Seconds 30
        $mcTrigger.Delay = "PT30S"
        $mcSettings = New-ScheduledTaskSettingsSet -AllowStartIfOnBatteries -DontStopIfGoingOnBatteries -StartWhenAvailable -ExecutionTimeLimit (New-TimeSpan -Days 365)
        $mcPrincipal = New-ScheduledTaskPrincipal -UserId $env:USERNAME -RunLevel Highest -LogonType S4U

        Register-ScheduledTask -TaskName $mcTaskName -Action $mcAction -Trigger $mcTrigger `
            -Settings $mcSettings -Principal $mcPrincipal `
            -Description "NxrthStack Paper Minecraft Server (auto-start on boot)" | Out-Null

        Write-Success "Scheduled Task '$mcTaskName' created (starts 30s after boot)."
    } else {
        Write-Info "Scheduled Task '$mcTaskName' already exists."
    }

    Write-Success "Minecraft Server set up at $MC_DIR"
} else {
    Write-Info "Skipping Minecraft Server setup."
}

# ============================================================================
# STEP 14: Windows Firewall Rules
# ============================================================================
Write-Step "Configuring Windows Firewall rules"

$firewallRules = @(
    @{ Name = "NxrthServer-Bot";       Port = 3001;  Desc = "Discord Bot webhook API" },
    @{ Name = "NxrthServer-NAS";       Port = 3002;  Desc = "NAS Storage Server" },
    @{ Name = "NxrthServer-MCAgent";   Port = 3003;  Desc = "Minecraft Server Agent" },
    @{ Name = "NxrthServer-Minecraft"; Port = 25565; Desc = "Minecraft Server" }
)

foreach ($rule in $firewallRules) {
    $existing = Get-NetFirewallRule -DisplayName $rule.Name -ErrorAction SilentlyContinue
    if ($existing) {
        Write-Info "Firewall rule '$($rule.Name)' already exists."
    } else {
        New-NetFirewallRule -DisplayName $rule.Name `
            -Direction Inbound -Action Allow `
            -Protocol TCP -LocalPort $rule.Port `
            -Profile Private, Domain `
            -Description "NxrthServer: $($rule.Desc)" | Out-Null
        Write-Info "Created: $($rule.Name) (port $($rule.Port))"
    }
}

Write-Success "Firewall rules configured."

# ============================================================================
# STEP 15: Setup Complete — Summary
# ============================================================================
Write-Step "Setup Complete!"

Write-Host ""
Write-Host "============================================" -ForegroundColor Green
Write-Host "  NxrthServer is ready!" -ForegroundColor Green
Write-Host "============================================" -ForegroundColor Green
Write-Host ""
Write-Host "  Services installed at: $INSTALL_DIR"
Write-Host ""
Write-Host "  Discord Bot        PM2 'nxrthstack-bot'     port 3001"
Write-Host "  NAS Storage        PM2 'nas-storage'         port 3002"
Write-Host "  MC Agent           PM2 'minecraft-agent'     port 3003"
Write-Host "  Cloudflare Tunnel  Windows Service"
Write-Host "  Minecraft Server   Scheduled Task            port 25565"
Write-Host ""
Write-Host "--------------------------------------------" -ForegroundColor DarkGray
Write-Host "  SAVE THESE SECRETS:" -ForegroundColor Yellow
Write-Host "--------------------------------------------" -ForegroundColor DarkGray
Write-Host "  RCON Password:     $RCON_PASSWORD" -ForegroundColor White
Write-Host "  MC Agent Secret:   $MC_AGENT_SECRET" -ForegroundColor White
Write-Host "  NAS API Key:       $NAS_API_KEY" -ForegroundColor White
Write-Host "--------------------------------------------" -ForegroundColor DarkGray
Write-Host ""
Write-Host "  Add to Vercel environment variables:" -ForegroundColor Yellow
Write-Host "  DISCORD_BOT_API_URL = https://bot.sweber.dev"
Write-Host "  MC_AGENT_URL        = https://mc-api.sweber.dev"
Write-Host "  MC_AGENT_SECRET     = $MC_AGENT_SECRET"
Write-Host "  NAS_STORAGE_URL     = https://nxrthstore.sweber.dev"
Write-Host "  NAS_API_KEY         = $NAS_API_KEY"
Write-Host ""
Write-Host "  Configure Cloudflare Tunnel routes (Zero Trust dashboard):" -ForegroundColor Yellow
Write-Host "    bot.sweber.dev        -> http://localhost:3001"
Write-Host "    nxrthstore.sweber.dev -> http://localhost:3002"
Write-Host "    mc-api.sweber.dev     -> http://localhost:3003"
Write-Host ""
Write-Host "  Quick commands:" -ForegroundColor Cyan
Write-Host "    pm2 status           - Check all Node.js services"
Write-Host "    pm2 logs             - View live logs"
Write-Host "    pm2 restart all      - Restart all services"
Write-Host "    pm2 monit            - Interactive monitoring"
Write-Host ""
Write-Host "  Tailscale:" -ForegroundColor Cyan
Write-Host "    Open Tailscale from the system tray and sign in."
Write-Host ""
Write-Host "============================================" -ForegroundColor Green
Write-Host "  The cloned repo can now be safely deleted." -ForegroundColor Yellow
Write-Host "  All services live at $INSTALL_DIR" -ForegroundColor Yellow
Write-Host "============================================" -ForegroundColor Green
Write-Host ""
Write-Host "  Reboot now to verify everything auto-starts:" -ForegroundColor Cyan
Write-Host "    Restart-Computer" -ForegroundColor White
Write-Host ""

# Save secrets to a local file for reference
$secretsFile = "$INSTALL_DIR\SECRETS.txt"
$secretsContent = @"
NxrthServer Secrets — Generated $(Get-Date -Format "yyyy-MM-dd HH:mm")
==============================================================
RCON Password:     $RCON_PASSWORD
MC Agent Secret:   $MC_AGENT_SECRET
NAS API Key:       $NAS_API_KEY

Vercel Environment Variables:
  DISCORD_BOT_API_URL = https://bot.sweber.dev
  MC_AGENT_URL        = https://mc-api.sweber.dev
  MC_AGENT_SECRET     = $MC_AGENT_SECRET
  NAS_STORAGE_URL     = https://nxrthstore.sweber.dev
  NAS_API_KEY         = $NAS_API_KEY

Cloudflare Tunnel Routes (configure in Zero Trust dashboard):
  bot.sweber.dev        -> http://localhost:3001
  nxrthstore.sweber.dev -> http://localhost:3002
  mc-api.sweber.dev     -> http://localhost:3003
"@
Write-EnvFile $secretsFile $secretsContent
Write-Host "  Secrets saved to: $secretsFile" -ForegroundColor Yellow
Write-Host ""

# ============================================================================
# FULL REFERENCE GUIDE
# ============================================================================
# ============================================================================
# FULL REFERENCE GUIDE FUNCTION (defined here, called below)
# ============================================================================
function Show-FullGuide {
Write-Host @"

================================================================================
  NXRTHSERVER COMPLETE REFERENCE GUIDE — WINDOWS 11
================================================================================

  This guide covers everything installed by setup.ps1 and how to manage it.
  Keep this as your server operations manual.

================================================================================
  1. ARCHITECTURE OVERVIEW
================================================================================

  +-------------------------------------------------------------+
  |              Business PC (Windows 11 Pro)                    |
  |                                                              |
  |  +----------------+  +----------------+  +----------------+ |
  |  | Discord Bot    |  | Minecraft      |  | NAS Storage    | |
  |  | :3001 (API)    |  | Server :25565  |  | Server :3002   | |
  |  | PM2 managed    |  | Scheduled Task |  | PM2 managed    | |
  |  +-------+--------+  +-------+--------+  +--------+-------+ |
  |          |                    |                     |         |
  |  +-------+--------------------+---------------------+------+ |
  |  |       Minecraft Agent :3003 (PM2 managed)               | |
  |  +-------+-------------------------------------------------+ |
  |          |                                                    |
  |  +-------+-------------------------------------------------+ |
  |  |  cloudflared (Windows Service — Cloudflare Tunnel)       | |
  |  |  bot.sweber.dev        -> localhost:3001                 | |
  |  |  nxrthstore.sweber.dev -> localhost:3002                 | |
  |  |  mc-api.sweber.dev     -> localhost:3003                 | |
  |  +---------------------------------------------------------+ |
  |                                                               |
  |  Tailscale VPN (system tray — for remote access + uploads)   |
  +-------------------------------------------------------------+
           |
           v
  +---------------------+   +------------------------+
  | Neon PostgreSQL     |   | Vercel (Website)       |
  | (shared database)   |   | nxrthstack.sweber.dev  |
  +---------------------+   +------------------------+

================================================================================
  2. SERVICE LOCATIONS & PORTS
================================================================================

  Service            | Location                           | Port  | Manager
  -------------------|---------------------------------------|-------|----------------
  Discord Bot        | C:\NxrthServer\nxrthstack-bot       | 3001  | PM2
  NAS Storage        | C:\NxrthServer\nas-storage-server   | 3002  | PM2
  Minecraft Agent    | C:\NxrthServer\minecraft-agent      | 3003  | PM2
  Minecraft Server   | C:\NxrthServer\minecraft            | 25565 | Scheduled Task
  Cloudflare Tunnel  | Windows Service (cloudflared)       | —     | Windows SCM
  Tailscale          | System tray app                     | —     | Windows Service
  Logs               | C:\NxrthServer\logs                 | —     | —
  Clip Storage       | C:\NxrthServer\storage\clips        | —     | —
  MC Backups         | C:\NxrthServer\minecraft-backups    | —     | —
  Secrets File       | C:\NxrthServer\SECRETS.txt          | —     | —

================================================================================
  3. PM2 — MANAGING NODE.JS SERVICES
================================================================================

  PM2 manages the Discord Bot, NAS Storage, and Minecraft Agent.

  EVERYDAY COMMANDS:
    pm2 status                  Show all processes and their state
    pm2 logs                    Stream live logs from all services
    pm2 logs nxrthstack-bot     Stream logs from bot only
    pm2 logs nas-storage        Stream logs from NAS only
    pm2 logs minecraft-agent    Stream logs from agent only
    pm2 monit                   Interactive dashboard (CPU, memory, logs)

  RESTART / STOP:
    pm2 restart all             Restart all services
    pm2 restart nxrthstack-bot  Restart bot only
    pm2 stop nxrthstack-bot     Stop bot (stays stopped until restart)
    pm2 start nxrthstack-bot    Start a stopped service

  AFTER CHANGES:
    pm2 restart nxrthstack-bot  After editing bot .env or code
    pm2 restart nas-storage     After editing NAS .env or code
    pm2 restart minecraft-agent After editing agent .env or code

  CONFIG LOCATION:
    C:\NxrthServer\ecosystem.config.cjs

  LOG LOCATIONS:
    C:\NxrthServer\logs\bot-out.log       Bot stdout
    C:\NxrthServer\logs\bot-error.log     Bot errors
    C:\NxrthServer\logs\nas-out.log       NAS stdout
    C:\NxrthServer\logs\nas-error.log     NAS errors
    C:\NxrthServer\logs\agent-out.log     Agent stdout
    C:\NxrthServer\logs\agent-error.log   Agent errors

  AUTO-START ON BOOT:
    PM2 auto-resurrects on boot via:
    1. pm2-windows-startup (npm package)
    2. Scheduled Task "PM2-Resurrect-NxrthServer" (fallback)

    To update what starts on boot after adding/removing services:
      pm2 save

================================================================================
  4. MINECRAFT SERVER
================================================================================

  LOCATION: C:\NxrthServer\minecraft

  FILES:
    paper.jar              Server JAR (Paper MC)
    server.properties      Server configuration
    eula.txt               EULA acceptance
    start-minecraft.bat    Manual start script (double-click)
    world/                 World data
    plugins/               Paper plugins
    mods/                  Forge/Fabric mods (if modded)
    logs/                  Server logs

  START MANUALLY:
    Double-click C:\NxrthServer\minecraft\start-minecraft.bat

  AUTO-START:
    Scheduled Task "NxrthServer-Minecraft" runs java with Paper at boot.
    Starts 30 seconds after boot to let other services initialize first.

  MANAGE SCHEDULED TASK:
    View:     Get-ScheduledTask -TaskName "NxrthServer-Minecraft"
    Start:    Start-ScheduledTask -TaskName "NxrthServer-Minecraft"
    Stop:     Stop-ScheduledTask -TaskName "NxrthServer-Minecraft"
    Disable:  Disable-ScheduledTask -TaskName "NxrthServer-Minecraft"
    Enable:   Enable-ScheduledTask -TaskName "NxrthServer-Minecraft"

  RCON (Remote Console):
    The Minecraft Agent connects to RCON at localhost:25575.
    You can also use any RCON client with the password from SECRETS.txt.

  CHANGE RAM:
    Edit C:\NxrthServer\minecraft\start-minecraft.bat
    Change -Xms and -Xmx values.
    Also update the Scheduled Task arguments.

  UPDATE PAPER:
    1. Stop the server
    2. Download new paper.jar from https://papermc.io/downloads/paper
    3. Replace C:\NxrthServer\minecraft\paper.jar
    4. Start the server

================================================================================
  5. CLOUDFLARE TUNNEL
================================================================================

  The tunnel connects your local services to the internet without port forwarding.
  It runs as a Windows service using a token from the Cloudflare Zero Trust dashboard.

  SERVICE NAME: cloudflared (or "Cloudflared agent")

  CHECK STATUS:
    Get-Service cloudflared
    — or —
    sc query cloudflared

  RESTART:
    Restart-Service cloudflared

  RECONFIGURE ROUTES:
    1. Go to https://one.dash.cloudflare.com
    2. Navigate to: Networks > Tunnels
    3. Click your tunnel (nxrthserver)
    4. Edit Public Hostname tab
    5. Add/edit routes:
       bot.sweber.dev        -> http://localhost:3001
       nxrthstore.sweber.dev -> http://localhost:3002
       mc-api.sweber.dev     -> http://localhost:3003

  REINSTALL WITH NEW TOKEN:
    cloudflared service uninstall
    cloudflared service install <new-token>

  TROUBLESHOOT:
    View logs in Event Viewer:
      Windows Logs > Application > Source: cloudflared

================================================================================
  6. TAILSCALE
================================================================================

  Tailscale provides VPN access for:
  - Remote management (access the PC from anywhere)
  - Large file uploads bypassing Cloudflare's 100MB limit
  - Letting Minecraft players connect without port forwarding

  SIGN IN:
    Click the Tailscale icon in the system tray and sign in.

  CHECK STATUS:
    tailscale status

  YOUR TAILSCALE IP:
    tailscale ip

  MINECRAFT VIA TAILSCALE:
    Players install Tailscale, join your tailnet, then connect to:
    <your-hostname>:25565

  DIRECT HTTPS FOR LARGE UPLOADS:
    1. tailscale cert <hostname>.ts.net
    2. Configure TLS_CERT_PATH and TLS_KEY_PATH in NAS .env
    3. Set NAS_TAILSCALE_URL in Vercel env vars

================================================================================
  7. DISCORD BOT
================================================================================

  LOCATION: C:\NxrthServer\nxrthstack-bot
  RUNTIME:  tsx (TypeScript execution, no build step)
  PM2 NAME: nxrthstack-bot

  ENV FILE: C:\NxrthServer\nxrthstack-bot\.env

  DEPLOY SLASH COMMANDS (after adding new commands):
    cd C:\NxrthServer\nxrthstack-bot
    npx tsx src/deploy-commands.ts

  UPDATE BOT CODE:
    1. Clone the repo to a temp location
    2. Copy nxrthstack-bot/ files to C:\NxrthServer\nxrthstack-bot\
       (exclude node_modules and .env)
    3. cd C:\NxrthServer\nxrthstack-bot && npm install
    4. pm2 restart nxrthstack-bot
    5. If new commands: npx tsx src/deploy-commands.ts
    6. Delete the temp clone

  HOW SYNC WORKS:
    Website -> POST webhook -> Bot API (bot.sweber.dev) -> Discord channels
    Website <-> Shared Neon PostgreSQL <-> Bot

    Events: achievement.unlocked, session.created, rivalry.challenge,
            rivalry.match, announcement.created

================================================================================
  8. NAS STORAGE SERVER
================================================================================

  LOCATION: C:\NxrthServer\nas-storage-server
  PM2 NAME: nas-storage
  STORAGE:  C:\NxrthServer\storage\clips

  ENV FILE: C:\NxrthServer\nas-storage-server\.env

  API ENDPOINTS:
    POST   /upload              Upload a file (multipart, auth required)
    POST   /upload/multiple     Upload multiple files (max 10)
    GET    /files               List all files
    GET    /files/:filename     Download/stream a file
    DELETE /files/:filename     Delete a file (auth required)
    GET    /stats               Storage usage statistics
    GET    /health              Health check

  AUTHENTICATION:
    Header: X-API-Key: <NAS_API_KEY>
    — or —
    Header: Authorization: Bearer <NAS_API_KEY>

  STORAGE LIMITS:
    Max file size: 5 GB (direct / Tailscale)
    Max file size: ~100 MB (via Cloudflare Tunnel)

================================================================================
  9. MINECRAFT AGENT (DASHBOARD BACKEND)
================================================================================

  LOCATION: C:\NxrthServer\minecraft-agent
  PM2 NAME: minecraft-agent
  RUNTIME:  Built JavaScript (dist/index.js)

  ENV FILE: C:\NxrthServer\minecraft-agent\.env

  This service is the backend for the MC Dashboard in GameHub.
  It proxies commands between the website and the Minecraft server via RCON.

  API ENDPOINTS:
    GET    /status              Server status (TPS, RAM, players, uptime)
    POST   /start               Start Minecraft server
    POST   /stop                Graceful stop (save-all then stop)
    POST   /restart             Graceful restart
    GET    /console/stream      SSE stream of live console output
    GET    /console/history     Last N lines of console
    POST   /console/command     Execute RCON command
    GET    /players             Online player list
    GET    /players/whitelist   Whitelist management
    GET    /backups             List backups
    POST   /backups/create      Create backup
    POST   /backups/restore     Restore from backup
    GET    /config/properties   Read server.properties
    PUT    /config/properties   Update server.properties

  AUTHENTICATION:
    Header: X-MC-Agent-Secret: <MC_AGENT_SECRET>

  REBUILD AFTER CODE CHANGES:
    cd C:\NxrthServer\minecraft-agent
    npm run build
    pm2 restart minecraft-agent

================================================================================
  10. ENVIRONMENT VARIABLES REFERENCE
================================================================================

  DISCORD BOT (.env):
    DISCORD_BOT_TOKEN        Bot token from Developer Portal
    DISCORD_CLIENT_ID        Application ID
    DISCORD_CLIENT_SECRET    Shared secret for webhook auth
    DISCORD_GUILD_ID         Your Discord server ID
    DATABASE_URL             Neon PostgreSQL connection string
    NXRTH_API_URL            https://nxrthstack.sweber.dev
    API_PORT                 3001
    MC_AGENT_URL             http://localhost:3003
    MC_AGENT_SECRET          Shared secret with MC agent

  NAS STORAGE (.env):
    PORT                     3002
    NAS_API_KEY              API key for authentication
    STORAGE_PATH             C:/NxrthServer/storage/clips
    PUBLIC_URL               https://nxrthstore.sweber.dev
    MAX_FILE_SIZE            5368709120 (5 GB)
    ALLOWED_ORIGINS          Comma-separated allowed CORS origins

  MINECRAFT AGENT (.env):
    PORT                     3003
    MC_SERVER_DIR            C:/NxrthServer/minecraft
    MC_RCON_HOST             127.0.0.1
    MC_RCON_PORT             25575
    MC_RCON_PASSWORD         RCON password (same as server.properties)
    MC_AGENT_SECRET          Shared secret with Vercel
    ALLOWED_ORIGINS          https://nxrthstack.sweber.dev
    BACKUP_DIR               C:/NxrthServer/minecraft-backups
    MAX_BACKUP_SIZE_GB       50
    CURSEFORGE_API_KEY       For modpack browsing (optional)

  VERCEL (Website):
    DISCORD_BOT_API_URL      https://bot.sweber.dev
    MC_AGENT_URL             https://mc-api.sweber.dev
    MC_AGENT_SECRET          Same as agent's MC_AGENT_SECRET
    NAS_STORAGE_URL          https://nxrthstore.sweber.dev
    NAS_API_KEY              Same as NAS server's NAS_API_KEY

================================================================================
  11. WINDOWS FIREWALL RULES
================================================================================

  Rules created by setup (Private + Domain profiles):
    NxrthServer-Bot         TCP 3001   Discord Bot API
    NxrthServer-NAS         TCP 3002   NAS Storage
    NxrthServer-MCAgent     TCP 3003   MC Agent
    NxrthServer-Minecraft   TCP 25565  Minecraft Server

  VIEW:    Get-NetFirewallRule -DisplayName "NxrthServer-*"
  DELETE:  Remove-NetFirewallRule -DisplayName "NxrthServer-Bot"

  Note: cloudflared makes OUTBOUND connections only. No inbound rules
  needed for the tunnel to work.

================================================================================
  12. UPDATING SERVICES
================================================================================

  All services live at C:\NxrthServer and are independent of the git repo.
  To update after code changes:

  QUICK UPDATE (single service):
    1. Clone repo to a temp folder (or pull on your dev machine)
    2. Copy the changed service folder to C:\NxrthServer\
    3. Run npm install if dependencies changed
    4. Run npm run build if TypeScript (agent only)
    5. pm2 restart <service-name>

  FULL UPDATE (re-run setup):
    1. Clone the repo
    2. Run setup.ps1 again (it's idempotent — skips existing installs)
    3. Delete the repo

  UPDATE BOT SCHEMA:
    If the database schema changed (nxrthstack/lib/db/schema.ts):
    1. Copy the new schema.ts to C:\NxrthServer\nxrthstack\lib\db\
    2. pm2 restart nxrthstack-bot

================================================================================
  13. TROUBLESHOOTING
================================================================================

  PROBLEM: PM2 services not starting after reboot
  FIX:     Run "pm2 resurrect" manually.
           Check Task Scheduler for "PM2-Resurrect-NxrthServer" task.
           Re-run: pm2 save (to save current process list)

  PROBLEM: Bot can't connect to database
  FIX:     Check DATABASE_URL in C:\NxrthServer\nxrthstack-bot\.env
           Test: nslookup <neon-hostname>
           Verify Neon dashboard shows the DB is active

  PROBLEM: Cloudflare tunnel showing 502 errors
  FIX:     The target service isn't running on the expected port.
           Check: pm2 status
           Check: Get-Service cloudflared
           Verify port mapping in Cloudflare Zero Trust dashboard

  PROBLEM: Minecraft won't start
  FIX:     Check: java -version (need Java 21+)
           Check RAM settings in start-minecraft.bat
           Check: C:\NxrthServer\minecraft\logs\latest.log

  PROBLEM: Website webhooks not reaching bot
  FIX:     Verify DISCORD_BOT_API_URL in Vercel = https://bot.sweber.dev
           Test: curl https://bot.sweber.dev (should not 404)
           Check: pm2 logs nxrthstack-bot

  PROBLEM: Large uploads failing via Cloudflare
  FIX:     Cloudflare free plan limits to ~100MB.
           Use Tailscale direct URL for large uploads.
           Set NAS_TAILSCALE_URL in Vercel env vars.

  PROBLEM: PM2 shows service "errored" with restart loop
  FIX:     Check: pm2 logs <service-name> --err --lines 50
           Common causes: missing .env, wrong paths, port in use

  PROBLEM: Minecraft Agent can't connect to RCON
  FIX:     Verify Minecraft server is running first.
           Check RCON password matches in both:
             C:\NxrthServer\minecraft\server.properties (rcon.password)
             C:\NxrthServer\minecraft-agent\.env (MC_RCON_PASSWORD)
           Verify enable-rcon=true in server.properties

================================================================================
  14. BACKUP & RECOVERY
================================================================================

  WHAT TO BACK UP:
    C:\NxrthServer\minecraft\world\          Minecraft world data
    C:\NxrthServer\storage\clips\            Uploaded clips/files
    C:\NxrthServer\*\.env                    All configuration files
    C:\NxrthServer\SECRETS.txt               Generated secrets

  WHAT NOT TO BACK UP:
    C:\NxrthServer\*\node_modules\           Reinstall with npm install
    C:\NxrthServer\*\dist\                   Rebuild with npm run build
    C:\NxrthServer\logs\                     Ephemeral, can be regenerated

  FULL SYSTEM RECOVERY:
    1. Fresh Windows install
    2. Clone repo, run setup.ps1
    3. Restore .env files from backup
    4. Restore world/ and clips/ directories
    5. pm2 restart all

================================================================================
  15. QUICK REFERENCE CARD
================================================================================

  CHECK EVERYTHING:
    pm2 status && Get-Service cloudflared && tailscale status

  RESTART EVERYTHING:
    pm2 restart all
    Restart-Service cloudflared
    Stop-ScheduledTask "NxrthServer-Minecraft"
    Start-ScheduledTask "NxrthServer-Minecraft"

  VIEW ALL LOGS:
    pm2 logs

  OPEN MINECRAFT CONSOLE:
    Double-click C:\NxrthServer\minecraft\start-minecraft.bat
    (or use the web dashboard at nxrthstack.sweber.dev)

  IMPORTANT PATHS:
    Secrets:     C:\NxrthServer\SECRETS.txt
    Bot env:     C:\NxrthServer\nxrthstack-bot\.env
    NAS env:     C:\NxrthServer\nas-storage-server\.env
    Agent env:   C:\NxrthServer\minecraft-agent\.env
    MC config:   C:\NxrthServer\minecraft\server.properties
    PM2 config:  C:\NxrthServer\ecosystem.config.cjs
    Logs:        C:\NxrthServer\logs\

================================================================================
  END OF GUIDE
================================================================================

"@ -ForegroundColor Gray
}

# Now prompt and call it
$showGuide = Read-Host "Print the full reference guide? (Y/n)"
if ($showGuide -ne 'n' -and $showGuide -ne 'N') {
    Show-FullGuide
}

# NxrthServer — Minecraft MCP Bot Setup Guide
> **Audience:** Claude Code running autonomously on Seya's home server (Windows 11, Business Mini-PC)
> **Goal:** Install, configure, and launch a Minecraft MCP bot that can join a local singleplayer world and play autonomously via Claude Desktop.

---

## Context & Constraints

- **Home server OS:** Windows 11 (Business Mini-PC)
- **Existing infrastructure:** Docker Desktop, WSL2, NSSM, Cloudflare Tunnel (`mcp.sweber.dev`)
- **Target Minecraft version:** Java Edition 1.21.4 (do NOT use 1.21.5 — incompatible with Mineflayer as of this writing)
- **Auth approach:** The bot connects to a singleplayer world opened to LAN — no Microsoft account needed, no `online-mode` changes required
- **MCP client:** Claude Desktop (already installed)

---

## Overview of What You're Building

```
[Claude Desktop] ──MCP protocol──> [minecraft-mcp-server (Node.js)]
                                            │
                                            │ Mineflayer API
                                            ▼
                              [Minecraft Java 1.21.4 — LAN world]
                                            │
                                     Seya is also in the world
                                     watching / spectating
```

The MCP server is a Node.js process that Claude Desktop launches automatically when needed. It connects a bot to whatever Minecraft world is currently open to LAN on `localhost:25565`.

---

## Step 1 — Verify Prerequisites

Run the following checks in PowerShell or CMD. Fix anything that fails before proceeding.

```powershell
# Node.js must be v18 or higher
node --version

# npm must be available
npm --version

# npx must be available
npx --version
```

If Node.js is missing, download and install it from https://nodejs.org (LTS version). Restart the terminal after installation.

---

## Step 2 — Locate the Claude Desktop Config File

Claude Desktop is configured via a JSON file. Find it at:

```
%APPDATA%\Claude\claude_desktop_config.json
```

In PowerShell:
```powershell
notepad "$env:APPDATA\Claude\claude_desktop_config.json"
```

If the file does not exist yet, create it. The directory should already exist if Claude Desktop is installed.

---

## Step 3 — Add the Minecraft MCP Server to Claude Desktop Config

Open `claude_desktop_config.json` and merge in the following. If the file already has other MCP servers defined under `mcpServers`, add the `"minecraft"` entry alongside them — do not overwrite existing entries.

```json
{
  "mcpServers": {
    "minecraft": {
      "command": "npx",
      "args": [
        "-y",
        "github:yuniko-software/minecraft-mcp-server",
        "--host",
        "localhost",
        "--port",
        "25565",
        "--username",
        "ClaudeBot"
      ]
    }
  }
}
```

**Key parameters:**
| Parameter | Value | Notes |
|-----------|-------|-------|
| `--host` | `localhost` | The Minecraft world is on the same machine |
| `--port` | `25565` | Default Minecraft LAN port — verify this matches what the game shows when opening to LAN |
| `--username` | `ClaudeBot` | The in-game name the bot will appear as |

> **Important:** The port shown when you open a world to LAN in Minecraft can vary (e.g. 56789). If it is not 25565, update the config accordingly before launching. For consistent results, use a mod or setting that forces LAN to port 25565.

---

## Step 4 — Fully Restart Claude Desktop

A partial restart is not enough — the MCP server process is launched fresh on startup.

```
1. Right-click the Claude icon in the system tray
2. Click "Quit" (not just close the window)
3. Confirm it is no longer in Task Manager
4. Relaunch Claude Desktop from the Start Menu
```

After restart, a small hammer icon (🔨) should appear in the chat input area. This confirms MCP tools are loaded and the minecraft server is ready to connect.

---

## Step 5 — Prepare a Minecraft World for the Bot

This setup uses a **singleplayer world opened to LAN** — no dedicated server, no auth changes needed.

1. Launch **Minecraft Java Edition 1.21.4**
2. Create a new singleplayer world (or open an existing vanilla one — avoid the NxrthServer modpack here, as Mineflayer is not compatible with modded blocks/entities)
3. Once in the world, press **ESC**
4. Click **"Open to LAN"**
5. Set **Allow Cheats: ON** (gives the bot more flexibility)
6. Click **"Start LAN World"**
7. Note the port number shown in chat (e.g. `Local game hosted on port 25565`)

If the port shown is not 25565, update the `--port` value in the Claude Desktop config from Step 3 and restart Claude Desktop again.

---

## Step 6 — Verify the Bot Connects

In Claude Desktop, open a new chat and include the word "Minecraft" or reference the game explicitly to trigger the MCP server. For example:

```
Hey Claude, can you join the Minecraft world and tell me what you see around you?
```

Claude Desktop will ask for permission to run the MCP tool on first use — approve it.

The bot (`ClaudeBot`) should appear in-game within a few seconds. You will see it join in the Minecraft chat log.

---

## Step 7 — Tell Claude to Play Autonomously

Once the bot is in the world, you can give it a high-level goal. Example prompts:

```
Play Minecraft and try to survive and progress as far as you can.
Start by gathering wood, then build shelter, mine iron, and work toward killing the Ender Dragon.
Use your judgment at each step.
```

Or shorter:
```
Play Minecraft autonomously. Try to beat the game.
```

Claude will use the available Mineflayer tools to move, mine, place blocks, craft, manage inventory, and interact with entities.

---

## Troubleshooting

### Bot does not appear in the world
- Confirm the Minecraft world is open to LAN and the port matches the config
- Check that Claude Desktop was fully restarted after editing the config (not just closed)
- Check if Windows Firewall is blocking localhost connections on the LAN port

### Hammer icon not showing in Claude Desktop
- The config JSON may have a syntax error — validate it at https://jsonlint.com
- Confirm Node.js and npx are installed and on the system PATH
- Check Claude Desktop logs: `%APPDATA%\Claude\logs\`

### Bot connects but does nothing
- Claude Desktop may have launched the MCP server twice (known bug) — fully restart Claude Desktop
- Make sure your prompt explicitly mentions "Minecraft" to trigger the tool

### `npm` errors or package not found
- Ensure Node.js v18+ is installed
- Try running the npx command manually to test it:
  ```powershell
  npx -y github:yuniko-software/minecraft-mcp-server --host localhost --port 25565 --username ClaudeBot
  ```
- If it fails due to network issues, check that `github.com` is accessible and not blocked

### Version compatibility warning
- Only use **Minecraft Java 1.21.4** — version 1.21.5+ is not yet supported by this Mineflayer-based server

---

## Notes on Modded Servers (NxrthServer / Beyond Cosmo)

The Mineflayer library that powers this MCP server is designed for **vanilla Minecraft**. Connecting it to a modded server like NxrthServer running the Beyond Cosmo modpack will likely cause issues:

- Modded blocks and items will be unrecognized
- Crafting recipes from mods won't work
- The bot may crash or behave unpredictably

**Recommendation:** Keep the AI bot in a separate vanilla world. If you want to eventually run it on NxrthServer, the server would need `online-mode=false` (security risk) and a bot-friendly mod layer — a separate project.

---

## File Summary

| File | Location | Purpose |
|------|----------|---------|
| `claude_desktop_config.json` | `%APPDATA%\Claude\` | Registers the Minecraft MCP server with Claude Desktop |
| MCP server package | Downloaded via `npx` at runtime | The actual bot process (no manual install needed) |

---

*Guide written for Seya Weber's home server setup. Last updated March 2026.*

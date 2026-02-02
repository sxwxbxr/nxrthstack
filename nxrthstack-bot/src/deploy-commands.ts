import "dotenv/config";
import { REST, Routes } from "discord.js";
import { readdirSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import type { Command } from "./client.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

async function getAllCommands(): Promise<Command[]> {
  const commands: Command[] = [];
  const commandsPath = join(__dirname, "commands");

  function loadFromDir(dir: string) {
    try {
      const entries = readdirSync(dir, { withFileTypes: true });

      for (const entry of entries) {
        const fullPath = join(dir, entry.name);
        if (entry.isDirectory()) {
          loadFromDir(fullPath);
        } else if (entry.name.endsWith(".ts") || entry.name.endsWith(".js")) {
          // Store path for later loading
          commands.push(fullPath as unknown as Command);
        }
      }
    } catch {
      // Directory doesn't exist
    }
  }

  loadFromDir(commandsPath);
  return commands;
}

async function deployCommands() {
  const clientId = process.env.DISCORD_CLIENT_ID;
  const guildId = process.env.DISCORD_GUILD_ID;
  const token = process.env.DISCORD_BOT_TOKEN;

  if (!clientId || !token) {
    throw new Error("DISCORD_CLIENT_ID and DISCORD_BOT_TOKEN are required");
  }

  const rest = new REST().setToken(token);

  // Load all command files
  const commandPaths = await getAllCommands();
  const commands = [];

  for (const path of commandPaths) {
    const filePath = `file://${String(path).replace(/\\/g, "/")}`;
    try {
      const command = await import(filePath);
      if ("data" in command) {
        commands.push(command.data.toJSON());
        console.log(`[Deploy] Loaded: ${command.data.name}`);
      }
    } catch (error) {
      console.error(`[Deploy] Failed to load ${path}:`, error);
    }
  }

  if (commands.length === 0) {
    console.log("[Deploy] No commands to deploy.");
    return;
  }

  try {
    console.log(`[Deploy] Deploying ${commands.length} command(s)...`);

    if (guildId) {
      // Deploy to specific guild (faster for development)
      await rest.put(Routes.applicationGuildCommands(clientId, guildId), {
        body: commands,
      });
      console.log(`[Deploy] Successfully deployed to guild ${guildId}`);
    } else {
      // Deploy globally (takes up to an hour to propagate)
      await rest.put(Routes.applicationCommands(clientId), {
        body: commands,
      });
      console.log("[Deploy] Successfully deployed globally");
    }
  } catch (error) {
    console.error("[Deploy] Failed to deploy commands:", error);
    throw error;
  }
}

deployCommands().catch((error) => {
  console.error(error);
  process.exit(1);
});

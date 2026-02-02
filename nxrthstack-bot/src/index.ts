import "dotenv/config";
import { readdirSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import { client, type Command } from "./client.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

async function loadCommands() {
  const commandsPath = join(__dirname, "commands");
  const commandFiles = getAllCommandFiles(commandsPath);

  for (const file of commandFiles) {
    try {
      const command = (await import(file)) as Command;
      if ("data" in command && "execute" in command) {
        client.commands.set(command.data.name, command);
        console.log(`[Commands] Loaded: ${command.data.name}`);
      } else {
        console.warn(`[Commands] ${file} is missing required "data" or "execute" property.`);
      }
    } catch (error) {
      console.error(`[Commands] Failed to load ${file}:`, error);
    }
  }
}

function getAllCommandFiles(dir: string): string[] {
  const files: string[] = [];

  try {
    const entries = readdirSync(dir, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = join(dir, entry.name);
      if (entry.isDirectory()) {
        files.push(...getAllCommandFiles(fullPath));
      } else if (entry.name.endsWith(".ts") || entry.name.endsWith(".js")) {
        // Convert to file URL for dynamic import
        files.push(`file://${fullPath.replace(/\\/g, "/")}`);
      }
    }
  } catch {
    // Directory doesn't exist yet, that's fine
  }

  return files;
}

async function loadEvents() {
  const eventsPath = join(__dirname, "events");

  try {
    const eventFiles = readdirSync(eventsPath).filter(
      (file) => file.endsWith(".ts") || file.endsWith(".js")
    );

    for (const file of eventFiles) {
      const filePath = `file://${join(eventsPath, file).replace(/\\/g, "/")}`;
      const event = await import(filePath);

      if (event.once) {
        client.once(event.name, (...args) => event.execute(...args));
      } else {
        client.on(event.name, (...args) => event.execute(...args));
      }

      console.log(`[Events] Loaded: ${event.name}`);
    }
  } catch (error) {
    console.error("[Events] Failed to load events:", error);
  }
}

async function main() {
  console.log("[Bot] Starting NxrthStack Bot...");

  // Validate environment
  if (!process.env.DISCORD_BOT_TOKEN) {
    throw new Error("DISCORD_BOT_TOKEN is required");
  }

  // Load commands and events
  await loadCommands();
  await loadEvents();

  // Login to Discord
  await client.login(process.env.DISCORD_BOT_TOKEN);
}

main().catch((error) => {
  console.error("[Bot] Fatal error:", error);
  process.exit(1);
});

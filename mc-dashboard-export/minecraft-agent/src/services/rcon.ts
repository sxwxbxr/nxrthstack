import { Rcon } from "rcon-client";

const RCON_HOST = process.env.MC_RCON_HOST || "127.0.0.1";
const RCON_PORT = parseInt(process.env.MC_RCON_PORT || "25575");
const RCON_PASSWORD = process.env.MC_RCON_PASSWORD || "";

let client: Rcon | null = null;
let connecting = false;
let reconnectTimer: ReturnType<typeof setTimeout> | null = null;
let reconnectDelay = 1000;

const MAX_RECONNECT_DELAY = 30_000;

async function connect(): Promise<Rcon> {
  if (client?.authenticated) return client;
  if (connecting) {
    // Wait for current connection attempt
    return new Promise((resolve, reject) => {
      const check = setInterval(() => {
        if (client?.authenticated) {
          clearInterval(check);
          resolve(client);
        } else if (!connecting) {
          clearInterval(check);
          reject(new Error("Connection failed"));
        }
      }, 100);
    });
  }

  connecting = true;

  try {
    client = await Rcon.connect({
      host: RCON_HOST,
      port: RCON_PORT,
      password: RCON_PASSWORD,
      timeout: 5000,
    });

    reconnectDelay = 1000; // Reset backoff on success

    client.on("error", (err) => {
      console.error("[RCON] Connection error:", err.message);
      client = null;
      scheduleReconnect();
    });

    client.on("end", () => {
      console.log("[RCON] Connection closed");
      client = null;
      scheduleReconnect();
    });

    console.log("[RCON] Connected to Minecraft server");
    return client;
  } catch (err) {
    console.error(
      "[RCON] Failed to connect:",
      err instanceof Error ? err.message : err
    );
    client = null;
    throw err;
  } finally {
    connecting = false;
  }
}

function scheduleReconnect(): void {
  if (reconnectTimer) return;

  reconnectTimer = setTimeout(async () => {
    reconnectTimer = null;
    try {
      await connect();
    } catch {
      reconnectDelay = Math.min(reconnectDelay * 2, MAX_RECONNECT_DELAY);
      scheduleReconnect();
    }
  }, reconnectDelay);
}

/**
 * Send an RCON command to the Minecraft server.
 * Auto-connects if needed.
 */
export async function sendCommand(command: string): Promise<string> {
  const rcon = await connect();
  return rcon.send(command);
}

/**
 * Check if RCON is currently connected.
 */
export function isConnected(): boolean {
  return client?.authenticated === true;
}

/**
 * Gracefully disconnect RCON.
 */
export async function disconnect(): Promise<void> {
  if (reconnectTimer) {
    clearTimeout(reconnectTimer);
    reconnectTimer = null;
  }
  if (client) {
    await client.end();
    client = null;
  }
}

/**
 * Get TPS from the server. Returns null if unavailable.
 */
export async function getTps(): Promise<number | null> {
  try {
    const response = await sendCommand("tps");
    // Paper/Spigot format: "§6TPS from last 1m, 5m, 15m: §a20.0, §a20.0, §a20.0"
    const match = response.match(/§[a-f0-9](\d+\.?\d*)/);
    return match ? parseFloat(match[1]) : null;
  } catch {
    return null;
  }
}

/**
 * Get online player list from RCON.
 */
export async function getPlayerList(): Promise<{
  online: number;
  max: number;
  players: string[];
}> {
  try {
    const response = await sendCommand("list");
    // Format: "There are X of a max of Y players online: player1, player2"
    const match = response.match(
      /There are (\d+) of a max of (\d+) players online:\s*(.*)/
    );
    if (match) {
      const online = parseInt(match[1]);
      const max = parseInt(match[2]);
      const players = match[3]
        ? match[3]
            .split(",")
            .map((p) => p.trim())
            .filter(Boolean)
        : [];
      return { online, max, players };
    }
    return { online: 0, max: 0, players: [] };
  } catch {
    return { online: 0, max: 0, players: [] };
  }
}

// Whitelisted commands for "operator" role
export const OPERATOR_COMMANDS = [
  "list",
  "whitelist",
  "say",
  "tell",
  "msg",
  "w",
  "time query",
  "weather",
  "seed",
  "difficulty",
  "gamerule",
  "tp",
  "teleport",
  "give",
  "effect",
  "gamemode",
  "xp",
  "experience",
  "scoreboard",
];

// Always blocked commands (use dashboard endpoints instead)
export const BLOCKED_COMMANDS = [
  "stop",
  "restart",
  "save-off",
  "op",
  "deop",
  "ban",
  "ban-ip",
  "pardon",
  "pardon-ip",
];

/**
 * Validate whether a user with a given role can execute a command.
 */
export function validateCommand(
  command: string,
  role: string
): { allowed: boolean; reason?: string } {
  const cmd = command.trim().replace(/^\//, "").toLowerCase();

  // Check blocked commands
  for (const blocked of BLOCKED_COMMANDS) {
    if (cmd === blocked || cmd.startsWith(blocked + " ")) {
      return {
        allowed: false,
        reason: `Command '${blocked}' is blocked. Use the dashboard controls instead.`,
      };
    }
  }

  // Operators can only use whitelisted commands
  if (role === "operator") {
    const isAllowed = OPERATOR_COMMANDS.some(
      (allowed) => cmd === allowed || cmd.startsWith(allowed + " ")
    );
    if (!isAllowed) {
      return {
        allowed: false,
        reason: "This command requires manager or admin role.",
      };
    }
  }

  // Managers and admins can use any non-blocked command
  return { allowed: true };
}

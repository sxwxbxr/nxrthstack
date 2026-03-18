import { spawn, type ChildProcess } from "child_process";
import { readFileSync, existsSync, appendFileSync } from "fs";
import { join } from "path";
import { sendCommand } from "./rcon.js";

const MC_SERVER_DIR = process.env.MC_SERVER_DIR || "/opt/minecraft";

let mcProcess: ChildProcess | null = null;
let startTime: number | null = null;
let stdoutBuffer: string[] = [];

const MAX_BUFFER_LINES = 1000;

// Listeners for console output (SSE connections)
type ConsoleListener = (line: string) => void;
const listeners = new Set<ConsoleListener>();

export function addConsoleListener(listener: ConsoleListener): void {
  listeners.add(listener);
}

export function removeConsoleListener(listener: ConsoleListener): void {
  listeners.delete(listener);
}

function notifyListeners(line: string): void {
  for (const listener of listeners) {
    try {
      listener(line);
    } catch {
      // Ignore listener errors
    }
  }
}

function appendToBuffer(line: string): void {
  stdoutBuffer.push(line);
  if (stdoutBuffer.length > MAX_BUFFER_LINES) {
    stdoutBuffer = stdoutBuffer.slice(-MAX_BUFFER_LINES);
  }
  notifyListeners(line);
}

/**
 * Get whether the MC server process is currently running.
 */
export function isRunning(): boolean {
  return mcProcess !== null && mcProcess.exitCode === null;
}

/**
 * Get server process info.
 */
export function getProcessInfo(): {
  running: boolean;
  pid: number | null;
  uptime: number;
} {
  return {
    running: isRunning(),
    pid: mcProcess?.pid ?? null,
    uptime: startTime ? Date.now() - startTime : 0,
  };
}

/**
 * Get recent console output lines.
 */
export function getConsoleHistory(lines: number = 200): string[] {
  return stdoutBuffer.slice(-lines);
}

/**
 * Start the Minecraft server.
 */
export async function startServer(): Promise<void> {
  if (isRunning()) {
    throw new Error("Server is already running");
  }

  // Determine the start command
  const startScript = join(MC_SERVER_DIR, "start.sh");
  let command: string;
  let args: string[];

  if (existsSync(startScript)) {
    command = "bash";
    args = [startScript];
  } else {
    // Fallback: find server JAR
    const serverJar = findServerJar();
    if (!serverJar) {
      throw new Error("No start.sh or server JAR found in server directory");
    }
    command = "java";
    args = ["-Xms4G", "-Xmx8G", "-jar", serverJar, "nogui"];
  }

  console.log(`[Process] Starting server: ${command} ${args.join(" ")}`);

  mcProcess = spawn(command, args, {
    cwd: MC_SERVER_DIR,
    stdio: ["pipe", "pipe", "pipe"],
  });

  startTime = Date.now();
  appendToBuffer(`[Agent] Server starting (PID: ${mcProcess.pid})`);

  mcProcess.stdout?.on("data", (data: Buffer) => {
    const lines = data.toString().split("\n").filter(Boolean);
    for (const line of lines) {
      appendToBuffer(line);
    }
  });

  mcProcess.stderr?.on("data", (data: Buffer) => {
    const lines = data.toString().split("\n").filter(Boolean);
    for (const line of lines) {
      appendToBuffer(`[STDERR] ${line}`);
    }
  });

  mcProcess.on("exit", (code, signal) => {
    const msg = `[Agent] Server exited (code: ${code}, signal: ${signal})`;
    console.log(msg);
    appendToBuffer(msg);
    mcProcess = null;
    startTime = null;
  });

  mcProcess.on("error", (err) => {
    const msg = `[Agent] Server process error: ${err.message}`;
    console.error(msg);
    appendToBuffer(msg);
    mcProcess = null;
    startTime = null;
  });
}

/**
 * Graceful stop: save-all → wait → stop command via RCON.
 */
export async function stopServer(): Promise<void> {
  if (!isRunning()) {
    throw new Error("Server is not running");
  }

  appendToBuffer("[Agent] Stopping server gracefully...");

  try {
    await sendCommand("save-all");
    await sleep(3000);
    await sendCommand("stop");
  } catch {
    // RCON might fail if server is in a bad state, try SIGTERM
    console.log("[Process] RCON stop failed, sending SIGTERM");
    mcProcess?.kill("SIGTERM");
  }

  // Wait up to 30s for clean shutdown
  await waitForExit(30_000);
}

/**
 * Restart: stop then start.
 */
export async function restartServer(): Promise<void> {
  if (isRunning()) {
    await stopServer();
    await sleep(2000);
  }
  await startServer();
}

/**
 * Force kill the server process.
 */
export function killServer(): void {
  if (!mcProcess) {
    throw new Error("Server is not running");
  }
  appendToBuffer("[Agent] Force killing server process");
  mcProcess.kill("SIGKILL");
  mcProcess = null;
  startTime = null;
}

function findServerJar(): string | null {
  const candidates = [
    "server.jar",
    "paper.jar",
    "fabric-server-launch.jar",
    "forge-server.jar",
  ];
  for (const jar of candidates) {
    if (existsSync(join(MC_SERVER_DIR, jar))) {
      return jar;
    }
  }
  return null;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function waitForExit(timeoutMs: number): Promise<void> {
  const start = Date.now();
  while (isRunning() && Date.now() - start < timeoutMs) {
    await sleep(500);
  }
  if (isRunning()) {
    console.log("[Process] Clean shutdown timed out, sending SIGKILL");
    mcProcess?.kill("SIGKILL");
    mcProcess = null;
    startTime = null;
  }
}

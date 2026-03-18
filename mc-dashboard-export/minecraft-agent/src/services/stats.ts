import { execSync } from "child_process";
import { existsSync, statSync, readdirSync } from "fs";
import { join } from "path";
import type { ServerStatus } from "../types/server.js";
import { getProcessInfo, isRunning } from "./process.js";
import { getTps, getPlayerList, isConnected as rconConnected } from "./rcon.js";

const MC_SERVER_DIR = process.env.MC_SERVER_DIR || "/opt/minecraft";

// Cache to prevent hammering
let cachedStatus: ServerStatus | null = null;
let cacheTime = 0;
const CACHE_TTL = 5_000; // 5 seconds

/**
 * Get comprehensive server status.
 * Cached for 5 seconds.
 */
export async function getServerStatus(): Promise<ServerStatus> {
  const now = Date.now();
  if (cachedStatus && now - cacheTime < CACHE_TTL) {
    return cachedStatus;
  }

  const processInfo = getProcessInfo();
  const running = processInfo.running;

  let tps: number | null = null;
  let players = { online: 0, max: 0, list: [] as ServerStatus["players"]["list"] };
  let version: string | null = null;
  let motd: string | null = null;

  if (running && rconConnected()) {
    try {
      [tps, players] = await Promise.all([
        getTps(),
        getPlayerList().then((p) => ({
          online: p.online,
          max: p.max,
          list: p.players.map((name) => ({
            name,
            uuid: null,
            joinedAt: null,
          })),
        })),
      ]);
    } catch {
      // RCON unavailable
    }

    // Read version from server properties or cached
    version = readServerVersion();
    motd = readMotd();
  }

  const memory = getMemoryInfo(processInfo.pid);
  const disk = getDiskUsage();

  const status: ServerStatus = {
    running,
    pid: processInfo.pid,
    uptime: processInfo.uptime,
    version,
    motd,
    players,
    tps,
    memory,
    cpu: null, // CPU tracking is complex, skip for now
    disk,
  };

  cachedStatus = status;
  cacheTime = now;

  return status;
}

function getMemoryInfo(pid: number | null): ServerStatus["memory"] {
  if (!pid) {
    return { used: 0, max: 0, free: 0 };
  }

  try {
    // Linux: read from /proc/PID/status
    const statusPath = `/proc/${pid}/status`;
    if (existsSync(statusPath)) {
      const { execSync } = require("child_process");
      const output = execSync(`cat ${statusPath}`, { encoding: "utf8" });
      const vmRss = output.match(/VmRSS:\s+(\d+)/);
      const vmPeak = output.match(/VmPeak:\s+(\d+)/);
      if (vmRss) {
        const usedKb = parseInt(vmRss[1]);
        const peakKb = vmPeak ? parseInt(vmPeak[1]) : usedKb;
        return {
          used: Math.round(usedKb / 1024),
          max: Math.round(peakKb / 1024),
          free: Math.round((peakKb - usedKb) / 1024),
        };
      }
    }
  } catch {
    // Ignore errors
  }

  return { used: 0, max: 0, free: 0 };
}

function getDiskUsage(): ServerStatus["disk"] {
  try {
    const dirSize = getDirectorySize(MC_SERVER_DIR);
    return {
      used: Math.round(dirSize / (1024 * 1024)),
      total: 0, // Will be set by backup storage info
    };
  } catch {
    return { used: 0, total: 0 };
  }
}

function getDirectorySize(dir: string): number {
  let size = 0;
  try {
    const entries = readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = join(dir, entry.name);
      if (entry.isFile()) {
        size += statSync(fullPath).size;
      } else if (entry.isDirectory() && entry.name !== "backups") {
        size += getDirectorySize(fullPath);
      }
    }
  } catch {
    // Ignore permission errors
  }
  return size;
}

function readServerVersion(): string | null {
  try {
    const propsPath = join(MC_SERVER_DIR, "version.json");
    if (existsSync(propsPath)) {
      const content = require("fs").readFileSync(propsPath, "utf8");
      const data = JSON.parse(content);
      return data.id || data.name || null;
    }
  } catch {
    // Ignore
  }
  return null;
}

function readMotd(): string | null {
  try {
    const propsPath = join(MC_SERVER_DIR, "server.properties");
    if (existsSync(propsPath)) {
      const content = require("fs").readFileSync(propsPath, "utf8");
      const match = content.match(/^motd=(.*)$/m);
      return match ? match[1].trim() : null;
    }
  } catch {
    // Ignore
  }
  return null;
}

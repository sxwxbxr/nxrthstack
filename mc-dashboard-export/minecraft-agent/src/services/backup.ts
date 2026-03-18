import path from "path";
import fs from "fs/promises";
import { createReadStream, createWriteStream } from "fs";
import { pipeline } from "stream/promises";
import { createGzip } from "zlib";
import * as tar from "tar";

const MC_DIR = process.env.MC_SERVER_DIR || "/opt/minecraft";
const BACKUP_DIR = process.env.BACKUP_DIR || "/opt/minecraft-backups";
const MAX_BACKUP_SIZE_GB = parseInt(process.env.MAX_BACKUP_SIZE_GB || "50");

interface BackupMeta {
  id: string;
  filename: string;
  label: string | null;
  type: "full" | "world-only";
  size: number;
  createdAt: string;
  status: "creating" | "ready" | "failed";
}

const activeBackups = new Map<string, BackupMeta>();

/**
 * Ensure backup directory exists.
 */
async function ensureBackupDir() {
  await fs.mkdir(BACKUP_DIR, { recursive: true });
}

/**
 * Generate a unique backup ID.
 */
function generateId(): string {
  return `backup-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

/**
 * List all backups.
 */
export async function listBackups(): Promise<BackupMeta[]> {
  await ensureBackupDir();

  const files = await fs.readdir(BACKUP_DIR);
  const backups: BackupMeta[] = [];

  for (const file of files) {
    if (!file.endsWith(".meta.json")) continue;

    try {
      const metaPath = path.join(BACKUP_DIR, file);
      const raw = await fs.readFile(metaPath, "utf-8");
      const meta: BackupMeta = JSON.parse(raw);
      backups.push(meta);
    } catch {
      // Skip corrupt meta files
    }
  }

  // Include active (creating) backups
  for (const [, meta] of activeBackups) {
    if (!backups.some((b) => b.id === meta.id)) {
      backups.push(meta);
    }
  }

  return backups.sort(
    (a, b) =>
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
}

/**
 * Get storage info.
 */
export async function getStorageInfo(): Promise<{
  used: number;
  total: number;
  count: number;
}> {
  await ensureBackupDir();

  const files = await fs.readdir(BACKUP_DIR);
  let used = 0;
  let count = 0;

  for (const file of files) {
    if (file.endsWith(".tar.gz")) {
      const stat = await fs.stat(path.join(BACKUP_DIR, file));
      used += stat.size;
      count++;
    }
  }

  return {
    used,
    total: MAX_BACKUP_SIZE_GB * 1024 * 1024 * 1024,
    count,
  };
}

/**
 * Create a backup (async, returns immediately).
 */
export function createBackup(
  label: string | null,
  type: "full" | "world-only"
): BackupMeta {
  const id = generateId();
  const filename = `${id}.tar.gz`;
  const meta: BackupMeta = {
    id,
    filename,
    label,
    type,
    size: 0,
    createdAt: new Date().toISOString(),
    status: "creating",
  };

  activeBackups.set(id, meta);

  // Run backup in background
  runBackup(meta).catch((err) => {
    console.error(`[Backup] Failed: ${id}`, err);
    meta.status = "failed";
    saveMeta(meta).catch(() => {});
    activeBackups.delete(id);
  });

  return meta;
}

async function runBackup(meta: BackupMeta) {
  await ensureBackupDir();

  const archivePath = path.join(BACKUP_DIR, meta.filename);
  const sourceDir = meta.type === "world-only" ? path.join(MC_DIR, "world") : MC_DIR;

  // Create tar.gz
  await tar.create(
    {
      gzip: true,
      file: archivePath,
      cwd: path.dirname(sourceDir),
    },
    [path.basename(sourceDir)]
  );

  const stat = await fs.stat(archivePath);
  meta.size = stat.size;
  meta.status = "ready";

  await saveMeta(meta);
  activeBackups.delete(meta.id);
}

async function saveMeta(meta: BackupMeta) {
  const metaPath = path.join(BACKUP_DIR, `${meta.id}.meta.json`);
  await fs.writeFile(metaPath, JSON.stringify(meta, null, 2));
}

/**
 * Delete a backup.
 */
export async function deleteBackup(id: string): Promise<void> {
  const archivePath = path.join(BACKUP_DIR, `${id}.tar.gz`);
  const metaPath = path.join(BACKUP_DIR, `${id}.meta.json`);

  try {
    await fs.unlink(archivePath);
  } catch {
    // File may not exist
  }
  try {
    await fs.unlink(metaPath);
  } catch {
    // Meta may not exist
  }
}

/**
 * Get a backup's archive path for downloading.
 */
export async function getBackupPath(id: string): Promise<string | null> {
  const archivePath = path.join(BACKUP_DIR, `${id}.tar.gz`);
  try {
    await fs.access(archivePath);
    return archivePath;
  } catch {
    return null;
  }
}

/**
 * Restore a backup. This extracts the backup to the MC server directory.
 * IMPORTANT: Server should be stopped before calling this.
 */
export async function restoreBackup(id: string): Promise<void> {
  const archivePath = path.join(BACKUP_DIR, `${id}.tar.gz`);

  try {
    await fs.access(archivePath);
  } catch {
    throw new Error("Backup file not found");
  }

  await tar.extract({
    file: archivePath,
    cwd: MC_DIR,
  });
}

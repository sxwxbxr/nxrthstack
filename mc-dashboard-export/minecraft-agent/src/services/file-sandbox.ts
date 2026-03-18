import path from "path";
import fs from "fs/promises";
import { constants as fsConstants } from "fs";

const MC_DIR = process.env.MC_SERVER_DIR || "/opt/minecraft";

// Files that should never be modified or deleted
const DENY_LIST = [
  "server.jar",
  "eula.txt",
];

// Directories that should never be browsed
const DENY_DIRS = [
  ".git",
  "node_modules",
];

// Maximum file size for reading (5MB)
const MAX_READ_SIZE = 5 * 1024 * 1024;

/**
 * Resolve and validate a path within the MC server directory.
 * Prevents path traversal attacks.
 */
export function resolvePath(relativePath: string): string {
  // Normalize and resolve relative to MC_DIR
  const resolved = path.resolve(MC_DIR, relativePath);

  // Ensure the resolved path is within the MC directory
  if (!resolved.startsWith(MC_DIR)) {
    throw new Error("Path traversal detected");
  }

  return resolved;
}

/**
 * Check if a file/directory is in the deny list.
 */
export function isDenied(relativePath: string): boolean {
  const basename = path.basename(relativePath);
  if (DENY_LIST.includes(basename)) return true;
  if (DENY_DIRS.includes(basename)) return true;

  // Check if any parent directory is denied
  const parts = relativePath.split(path.sep);
  return parts.some((part) => DENY_DIRS.includes(part));
}

/**
 * List files in a directory.
 */
export async function listDirectory(
  relativePath: string
): Promise<
  {
    name: string;
    path: string;
    type: "file" | "directory";
    size: number;
    modified: string;
    extension: string | null;
  }[]
> {
  const absPath = resolvePath(relativePath);
  const entries = await fs.readdir(absPath, { withFileTypes: true });

  const results = await Promise.all(
    entries
      .filter((entry) => !DENY_DIRS.includes(entry.name))
      .map(async (entry) => {
        const entryRelPath = path.join(relativePath, entry.name);
        const entryAbsPath = path.join(absPath, entry.name);

        let stat;
        try {
          stat = await fs.stat(entryAbsPath);
        } catch {
          return null;
        }

        const ext = entry.isFile()
          ? path.extname(entry.name).slice(1) || null
          : null;

        return {
          name: entry.name,
          path: entryRelPath.replace(/\\/g, "/"),
          type: (entry.isDirectory() ? "directory" : "file") as
            | "file"
            | "directory",
          size: stat.size,
          modified: stat.mtime.toISOString(),
          extension: ext,
        };
      })
  );

  return results
    .filter((r): r is NonNullable<typeof r> => r !== null)
    .sort((a, b) => {
      // Directories first, then alphabetical
      if (a.type !== b.type) return a.type === "directory" ? -1 : 1;
      return a.name.localeCompare(b.name);
    });
}

/**
 * Read a file's contents.
 */
export async function readFile(relativePath: string): Promise<string> {
  if (isDenied(relativePath)) {
    throw new Error("Access to this file is denied");
  }

  const absPath = resolvePath(relativePath);
  const stat = await fs.stat(absPath);

  if (stat.size > MAX_READ_SIZE) {
    throw new Error(`File too large (${(stat.size / 1024 / 1024).toFixed(1)}MB, max 5MB)`);
  }

  return fs.readFile(absPath, "utf-8");
}

/**
 * Write content to a file.
 */
export async function writeFile(
  relativePath: string,
  content: string
): Promise<void> {
  if (isDenied(relativePath)) {
    throw new Error("Modifying this file is not allowed");
  }

  const absPath = resolvePath(relativePath);

  // Ensure parent directory exists
  await fs.mkdir(path.dirname(absPath), { recursive: true });

  await fs.writeFile(absPath, content, "utf-8");
}

/**
 * Delete a file or directory.
 */
export async function deleteFile(relativePath: string): Promise<void> {
  if (isDenied(relativePath)) {
    throw new Error("Deleting this file is not allowed");
  }

  const absPath = resolvePath(relativePath);
  const stat = await fs.stat(absPath);

  if (stat.isDirectory()) {
    await fs.rm(absPath, { recursive: true });
  } else {
    await fs.unlink(absPath);
  }
}

/**
 * Check if a file exists.
 */
export async function fileExists(relativePath: string): Promise<boolean> {
  try {
    const absPath = resolvePath(relativePath);
    await fs.access(absPath, fsConstants.F_OK);
    return true;
  } catch {
    return false;
  }
}

export function getServerDir(): string {
  return MC_DIR;
}

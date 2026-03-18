import { z } from "zod";

// Access code redemption
export const redeemAccessCodeSchema = z.object({
  code: z
    .string()
    .min(1, "Access code is required")
    .max(20, "Access code too long")
    .transform((v) => v.trim().toUpperCase()),
});

// Console command
export const consoleCommandSchema = z.object({
  command: z
    .string()
    .min(1, "Command is required")
    .max(500, "Command too long"),
  serverId: z.string().uuid("Invalid server ID"),
});

// File path validation (prevent traversal)
export const filePathSchema = z
  .string()
  .min(1, "Path is required")
  .max(500, "Path too long")
  .refine((path) => !path.includes(".."), "Path traversal not allowed")
  .refine(
    (path) => !path.startsWith("/") || path === "/",
    "Absolute paths not allowed"
  );

// File write
export const fileWriteSchema = z.object({
  path: filePathSchema,
  content: z.string().max(10 * 1024 * 1024, "File too large (max 10MB)"),
  serverId: z.string().uuid("Invalid server ID"),
});

// Server properties update
export const serverPropertiesSchema = z.object({
  serverId: z.string().uuid("Invalid server ID"),
  properties: z.record(z.string(), z.string()),
});

// JVM arguments update
export const jvmArgsSchema = z.object({
  serverId: z.string().uuid("Invalid server ID"),
  xms: z.number().min(512).max(24576).optional(),
  xmx: z.number().min(512).max(24576).optional(),
  gcType: z.enum(["G1GC", "ZGC", "Shenandoah"]).optional(),
  useAikarFlags: z.boolean().optional(),
  rawArgs: z.string().max(2000).optional(),
});

// Player action
export const playerActionSchema = z.object({
  player: z
    .string()
    .min(1, "Player name required")
    .max(32, "Player name too long"),
  reason: z.string().max(200).optional(),
  serverId: z.string().uuid("Invalid server ID"),
});

// Backup creation
export const createBackupSchema = z.object({
  serverId: z.string().uuid("Invalid server ID"),
  label: z.string().max(100).optional(),
  type: z.enum(["full", "world-only"]).default("full"),
});

// Backup restore
export const restoreBackupSchema = z.object({
  serverId: z.string().uuid("Invalid server ID"),
  backupId: z.string().min(1, "Backup ID required"),
  createBackupFirst: z.boolean().default(true),
});

// Dashboard layout
export const dashboardLayoutSchema = z.object({
  serverId: z.string().uuid("Invalid server ID"),
  page: z.string().max(50),
  layouts: z.record(z.string(), z.array(z.object({
    i: z.string(),
    x: z.number(),
    y: z.number(),
    w: z.number(),
    h: z.number(),
    minW: z.number().optional(),
    minH: z.number().optional(),
    maxW: z.number().optional(),
    maxH: z.number().optional(),
  }))),
});

// Dashboard preferences
export const dashboardPreferencesSchema = z.object({
  theme: z.enum(["gamehub", "minecraft", "nether", "end", "custom"]).optional(),
  sidebarCollapsed: z.boolean().optional(),
  consoleFontSize: z.number().min(10).max(24).optional(),
  consoleTimestamps: z.boolean().optional(),
  consoleAutoScroll: z.boolean().optional(),
  customColors: z.record(z.string(), z.string()).optional(),
});

// Access code creation (admin)
export const createAccessCodeSchema = z.object({
  serverId: z.string().uuid("Invalid server ID"),
  label: z.string().max(100).optional(),
  defaultRole: z.enum(["viewer", "operator", "manager"]).default("viewer"),
  maxUses: z.number().int().min(1).max(1000).optional(),
  expiresAt: z.string().datetime().optional(),
});

// Access grant update (admin)
export const updateAccessGrantSchema = z.object({
  role: z.enum(["viewer", "operator", "manager", "admin"]),
});

// Server ID param (reusable)
export const serverIdSchema = z.object({
  serverId: z.string().uuid("Invalid server ID"),
});

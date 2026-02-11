export interface ServerStatus {
  running: boolean;
  pid: number | null;
  uptime: number; // ms
  version: string | null;
  motd: string | null;
  players: {
    online: number;
    max: number;
    list: PlayerInfo[];
  };
  tps: number | null;
  memory: {
    used: number; // MB
    max: number; // MB
    free: number; // MB
  };
  cpu: number | null; // percentage
  disk: {
    used: number; // MB
    total: number; // MB
  };
}

export interface PlayerInfo {
  name: string;
  uuid: string | null;
  joinedAt: string | null;
}

export interface ConsoleLogEntry {
  timestamp: string;
  level: "INFO" | "WARN" | "ERROR" | "FATAL" | "DEBUG";
  thread: string;
  message: string;
  category: "chat" | "join" | "leave" | "death" | "command" | "system";
  raw: string;
}

export interface FileEntry {
  name: string;
  path: string;
  type: "file" | "directory";
  size: number;
  modified: string;
  extension: string | null;
}

export interface BackupInfo {
  id: string;
  filename: string;
  label: string | null;
  type: "full" | "world-only";
  size: number; // bytes
  createdAt: string;
  status: "creating" | "ready" | "failed";
}

export interface BackupStorageInfo {
  used: number; // bytes
  total: number; // bytes (MAX_BACKUP_SIZE_GB)
  count: number;
}

export type EventCategory =
  | "server"
  | "player"
  | "file"
  | "backup"
  | "config"
  | "access";

export type ServerAction =
  | "server_start"
  | "server_stop"
  | "server_restart"
  | "server_kill"
  | "server_crash"
  | "player_kick"
  | "player_ban"
  | "player_unban"
  | "player_whitelist_add"
  | "player_whitelist_remove"
  | "player_op"
  | "player_deop"
  | "command_executed"
  | "file_write"
  | "file_delete"
  | "file_upload"
  | "backup_create"
  | "backup_restore"
  | "backup_delete"
  | "config_properties_update"
  | "config_jvm_update"
  | "access_granted"
  | "access_revoked"
  | "access_role_changed";

export interface AgentUser {
  sub: string; // userId
  role: string; // McRole
  serverId: string;
}

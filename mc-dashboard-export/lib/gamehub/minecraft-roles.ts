// Role hierarchy (higher index = more permissions)
// This file is safe for both client and server imports.

export const MC_ROLES = ["viewer", "operator", "manager", "admin"] as const;
export type McRole = (typeof MC_ROLES)[number];

export function roleIndex(role: string): number {
  return MC_ROLES.indexOf(role as McRole);
}

export function hasMinRole(userRole: string, minRole: McRole): boolean {
  return roleIndex(userRole) >= roleIndex(minRole);
}

"use client";

import { createContext, useContext, type ReactNode } from "react";
import type { McRole } from "@/lib/gamehub/minecraft-roles";

interface McContextValue {
  serverId: string;
  serverName: string;
  userRole: McRole;
}

const McContext = createContext<McContextValue | null>(null);

export function McProvider({
  children,
  serverId,
  serverName,
  userRole,
}: McContextValue & { children: ReactNode }) {
  return (
    <McContext.Provider value={{ serverId, serverName, userRole }}>
      {children}
    </McContext.Provider>
  );
}

export function useMcContext() {
  const ctx = useContext(McContext);
  if (!ctx) {
    throw new Error("useMcContext must be used within <McProvider>");
  }
  return ctx;
}

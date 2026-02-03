"use client";

import { NeonAuthUIProvider } from "@neondatabase/auth/react";
import { authClient } from "@/lib/auth/client";

export function NeonAuthProvider({ children }: { children: React.ReactNode }) {
  return (
    <NeonAuthUIProvider authClient={authClient} emailOTP>
      {children}
    </NeonAuthUIProvider>
  );
}

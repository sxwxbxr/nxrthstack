"use client";

import { useState } from "react";
import { McAccessCodes } from "@/components/admin/mc-access-codes";
import { McUserAccess } from "@/components/admin/mc-user-access";
import { FadeIn } from "@/components/ui/fade-in";
import { cn } from "@/lib/utils";

type Tab = "codes" | "users";

interface McAdminClientProps {
  servers: { id: string; name: string }[];
}

export function McAdminClient({ servers }: McAdminClientProps) {
  const [tab, setTab] = useState<Tab>("codes");

  return (
    <FadeIn delay={0.1}>
      {/* Tabs */}
      <div className="flex gap-1 border-b border-border mb-6">
        <button
          onClick={() => setTab("codes")}
          className={cn(
            "px-4 py-2 text-sm font-medium transition-colors border-b-2 -mb-px",
            tab === "codes"
              ? "border-primary text-foreground"
              : "border-transparent text-muted-foreground hover:text-foreground"
          )}
        >
          Access Codes
        </button>
        <button
          onClick={() => setTab("users")}
          className={cn(
            "px-4 py-2 text-sm font-medium transition-colors border-b-2 -mb-px",
            tab === "users"
              ? "border-primary text-foreground"
              : "border-transparent text-muted-foreground hover:text-foreground"
          )}
        >
          User Access
        </button>
      </div>

      {tab === "codes" ? (
        <McAccessCodes servers={servers} />
      ) : (
        <McUserAccess />
      )}
    </FadeIn>
  );
}

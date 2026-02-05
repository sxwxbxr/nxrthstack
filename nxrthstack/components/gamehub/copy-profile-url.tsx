"use client";

import { useState } from "react";
import { Icons } from "@/components/icons";

interface CopyProfileUrlProps {
  usernameSlug: string | null;
}

export function CopyProfileUrl({ usernameSlug }: CopyProfileUrlProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    if (!usernameSlug) return;
    const url = `${window.location.origin}/u/${usernameSlug}`;
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="rounded-xl border border-primary/30 bg-primary/5 p-4">
      <div className="flex items-center gap-3">
        <Icons.Link className="h-5 w-5 text-primary" />
        <div className="flex-1">
          <p className="text-sm text-muted-foreground">Your profile URL</p>
          <p className="font-mono text-foreground">
            {typeof window !== "undefined" ? window.location.origin : "https://nxrthstack.sweber.dev"}
            /u/{usernameSlug || "your-username"}
          </p>
        </div>
        <button
          onClick={handleCopy}
          className="p-2 rounded-lg hover:bg-primary/10 transition-colors"
          title="Copy URL"
        >
          {copied ? (
            <Icons.Check className="h-4 w-4 text-green-500" />
          ) : (
            <Icons.Copy className="h-4 w-4 text-primary" />
          )}
        </button>
      </div>
    </div>
  );
}

"use client";

import { Icons } from "@/components/icons";

interface CopyButtonProps {
  text: string;
}

export function CopyButton({ text }: CopyButtonProps) {
  return (
    <button
      onClick={() => {
        navigator.clipboard.writeText(text);
      }}
      className="rounded-lg p-2 text-muted-foreground hover:bg-background hover:text-foreground"
      title="Copy license key"
    >
      <Icons.Copy className="h-4 w-4" />
    </button>
  );
}

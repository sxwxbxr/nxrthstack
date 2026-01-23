"use client";

import { useState } from "react";
import { Icons } from "@/components/icons";

interface LicenseKeyDisplayProps {
  licenseKey: string;
}

export function LicenseKeyDisplay({ licenseKey }: LicenseKeyDisplayProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(licenseKey);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="mt-4 rounded-lg bg-muted p-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-medium text-muted-foreground">
            LICENSE KEY
          </p>
          <p className="mt-1 font-mono text-sm text-foreground">
            {licenseKey}
          </p>
        </div>
        <button
          onClick={handleCopy}
          className="rounded-lg p-2 text-muted-foreground hover:bg-background hover:text-foreground"
          title="Copy license key"
        >
          {copied ? (
            <Icons.Check className="h-4 w-4 text-green-500" />
          ) : (
            <Icons.Copy className="h-4 w-4" />
          )}
        </button>
      </div>
    </div>
  );
}

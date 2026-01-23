"use client";

import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Icons } from "@/components/icons";

export function CheckoutVerifier() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [status, setStatus] = useState<"idle" | "verifying" | "success" | "error">("idle");
  const [licenseKey, setLicenseKey] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const success = searchParams.get("success");
  const sessionId = searchParams.get("session_id");

  useEffect(() => {
    if (success === "true" && sessionId) {
      verifyCheckout();
    }
  }, [success, sessionId]);

  async function verifyCheckout() {
    setStatus("verifying");

    try {
      const res = await fetch("/api/checkout/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId }),
      });

      const data = await res.json();

      if (data.success) {
        setStatus("success");
        setLicenseKey(data.licenseKey);
        // Remove query params and refresh the page after a short delay
        setTimeout(() => {
          router.replace("/dashboard/purchases");
          router.refresh();
        }, 3000);
      } else {
        setStatus("error");
        setError(data.error || "Failed to verify purchase");
      }
    } catch (err) {
      setStatus("error");
      setError("Failed to verify purchase");
    }
  }

  if (status === "idle") return null;

  return (
    <div className="mb-6 rounded-xl border border-border bg-card p-6">
      {status === "verifying" && (
        <div className="flex items-center gap-3">
          <Icons.Loader2 className="h-5 w-5 animate-spin text-primary" />
          <div>
            <p className="font-medium text-foreground">Verifying your purchase...</p>
            <p className="text-sm text-muted-foreground">Please wait while we confirm your payment</p>
          </div>
        </div>
      )}

      {status === "success" && (
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-500/10">
            <Icons.Check className="h-5 w-5 text-green-500" />
          </div>
          <div className="flex-1">
            <p className="font-medium text-foreground">Purchase successful!</p>
            <p className="text-sm text-muted-foreground">Thank you for your purchase</p>
            {licenseKey && (
              <div className="mt-3 rounded-lg bg-muted p-3">
                <p className="text-xs font-medium text-muted-foreground">YOUR LICENSE KEY</p>
                <p className="mt-1 font-mono text-sm text-foreground">{licenseKey}</p>
              </div>
            )}
          </div>
        </div>
      )}

      {status === "error" && (
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-red-500/10">
            <Icons.AlertCircle className="h-5 w-5 text-red-500" />
          </div>
          <div>
            <p className="font-medium text-foreground">Verification failed</p>
            <p className="text-sm text-muted-foreground">{error}</p>
          </div>
        </div>
      )}
    </div>
  );
}

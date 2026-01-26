"use client";

import { useEffect } from "react";

interface GlobalErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function GlobalError({ error, reset }: GlobalErrorProps) {
  useEffect(() => {
    console.error("Global error:", error);
  }, [error]);

  return (
    <html lang="en">
      <body style={{ margin: 0, padding: 0, backgroundColor: "#0a0a0a", color: "#fafafa", fontFamily: "system-ui, sans-serif" }}>
        <div
          style={{
            minHeight: "100vh",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "1rem",
          }}
        >
          <div style={{ textAlign: "center", maxWidth: "32rem" }}>
            {/* Error icon */}
            <div
              style={{
                width: "5rem",
                height: "5rem",
                margin: "0 auto 2rem",
                borderRadius: "50%",
                background: "linear-gradient(135deg, rgba(239, 68, 68, 0.2), rgba(249, 115, 22, 0.2))",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                border: "1px solid rgba(239, 68, 68, 0.3)",
              }}
            >
              <svg
                width="40"
                height="40"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#ef4444"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
            </div>

            {/* Error code */}
            <h1
              style={{
                fontSize: "4rem",
                fontWeight: "bold",
                background: "linear-gradient(90deg, #ef4444, #f97316)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                margin: "0 0 1rem",
              }}
            >
              500
            </h1>

            {/* Title */}
            <h2 style={{ fontSize: "1.5rem", fontWeight: "bold", marginBottom: "0.75rem" }}>
              Critical Error
            </h2>

            {/* Description */}
            <p style={{ color: "#a1a1aa", marginBottom: "0.5rem" }}>
              A critical error occurred while loading the application.
              We apologize for the inconvenience.
            </p>

            {error.digest && (
              <p style={{ fontSize: "0.75rem", color: "#52525b", fontFamily: "monospace", marginBottom: "2rem" }}>
                Error ID: {error.digest}
              </p>
            )}

            {/* Buttons */}
            <div style={{ display: "flex", flexDirection: "column", gap: "1rem", alignItems: "center" }}>
              <button
                onClick={reset}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "0.5rem",
                  padding: "0.75rem 1.5rem",
                  borderRadius: "0.75rem",
                  border: "none",
                  background: "linear-gradient(135deg, #7c3aed, #a855f7)",
                  color: "white",
                  fontWeight: "500",
                  cursor: "pointer",
                  fontSize: "1rem",
                }}
              >
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M21 2v6h-6" />
                  <path d="M3 12a9 9 0 0 1 15-6.7L21 8" />
                  <path d="M3 22v-6h6" />
                  <path d="M21 12a9 9 0 0 1-15 6.7L3 16" />
                </svg>
                Try Again
              </button>
              <a
                href="/"
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "0.5rem",
                  padding: "0.75rem 1.5rem",
                  borderRadius: "0.75rem",
                  border: "1px solid #27272a",
                  background: "#18181b",
                  color: "#fafafa",
                  fontWeight: "500",
                  textDecoration: "none",
                  fontSize: "1rem",
                }}
              >
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                  <polyline points="9 22 9 12 15 12 15 22" />
                </svg>
                Back to Home
              </a>
            </div>

            {/* Footer note */}
            <p style={{ marginTop: "3rem", fontSize: "0.75rem", color: "#52525b" }}>
              If this problem persists, please contact support.
            </p>
          </div>
        </div>
      </body>
    </html>
  );
}

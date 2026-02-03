"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { motion } from "motion/react";
import { ShimmerButton } from "@/components/ui/shimmer-button";
import { Icons } from "@/components/icons";
import { authClient } from "@/lib/auth/client";

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") || "/dashboard";
  const error = searchParams.get("error");

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [formError, setFormError] = useState("");
  const [migrationStatus, setMigrationStatus] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setFormError("");
    setMigrationStatus("");

    const normalizedEmail = email.toLowerCase();

    try {
      // Step 1: Check if this is a legacy user that needs migration
      const migrateResponse = await fetch("/api/auth/migrate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: normalizedEmail, password }),
      });

      const migrateData = await migrateResponse.json();

      if (!migrateResponse.ok && migrateResponse.status === 401) {
        setFormError("Invalid email or password");
        return;
      }

      if (migrateData.status === "needs_migration") {
        // Legacy user - create Neon Auth account then link
        setMigrationStatus("Migrating your account...");

        // Create Neon Auth account with same credentials
        const signUpResult = await authClient.signUp.email({
          email: normalizedEmail,
          password,
          name: migrateData.name || "User",
        });

        if (signUpResult.error) {
          // Account might already exist in Neon Auth, try signing in
          const signInResult = await authClient.signIn.email({
            email: normalizedEmail,
            password,
          });

          if (signInResult.error) {
            setFormError("Migration failed. Please try again.");
            return;
          }

          // Link the accounts if sign in succeeded
          if (signInResult.data?.user?.id) {
            await fetch("/api/auth/migrate", {
              method: "PUT",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                localUserId: migrateData.userId,
                neonAuthUserId: signInResult.data.user.id,
              }),
            });
          }
        } else if (signUpResult.data?.user?.id) {
          // Link the accounts after successful signup
          await fetch("/api/auth/migrate", {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              localUserId: migrateData.userId,
              neonAuthUserId: signUpResult.data.user.id,
            }),
          });
        }

        // Migration complete, redirect
        router.push(callbackUrl);
        router.refresh();
        return;
      }

      // Step 2: User is either new or already migrated - use Neon Auth directly
      const signInResult = await authClient.signIn.email({
        email: normalizedEmail,
        password,
      });

      if (signInResult.error) {
        setFormError(signInResult.error.message || "Invalid email or password");
        return;
      }

      // Ensure local user record exists for new users
      if (signInResult.data?.user) {
        await fetch("/api/auth/setup-user", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            neonAuthUserId: signInResult.data.user.id,
            email: signInResult.data.user.email,
            name: signInResult.data.user.name || "User",
          }),
        });
      }

      router.push(callbackUrl);
      router.refresh();
    } catch {
      setFormError("An error occurred. Please try again.");
    } finally {
      setIsLoading(false);
      setMigrationStatus("");
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="w-full max-w-md"
    >
      <div className="rounded-2xl border border-border bg-card p-8 shadow-lg">
        <div className="mb-8 text-center">
          <Link href="/" className="inline-block">
            <h1 className="text-2xl font-bold text-foreground">
              Nxrth<span className="text-primary">Stack</span>
            </h1>
          </Link>
          <p className="mt-2 text-muted-foreground">
            Sign in to access your purchases
          </p>
        </div>

        {(error || formError) && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="mb-6 rounded-lg bg-destructive/10 p-4 text-sm text-destructive"
          >
            {formError || "Authentication failed. Please try again."}
          </motion.div>
        )}

        {migrationStatus && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="mb-6 rounded-lg bg-primary/10 p-4 text-sm text-primary flex items-center"
          >
            <Icons.Loader2 className="mr-2 h-4 w-4 animate-spin" />
            {migrationStatus}
          </motion.div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label
              htmlFor="email"
              className="block text-sm font-medium text-foreground"
            >
              Email
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="mt-2 w-full rounded-lg border border-input bg-background px-4 py-3 text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
              placeholder="you@example.com"
            />
          </div>

          <div>
            <label
              htmlFor="password"
              className="block text-sm font-medium text-foreground"
            >
              Password
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={8}
              className="mt-2 w-full rounded-lg border border-input bg-background px-4 py-3 text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
              placeholder="••••••••"
            />
          </div>

          <ShimmerButton
            type="submit"
            disabled={isLoading}
            className="w-full"
          >
            {isLoading ? (
              <>
                <Icons.Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Signing in...
              </>
            ) : (
              "Sign In"
            )}
          </ShimmerButton>
        </form>

        <p className="mt-6 text-center text-sm text-muted-foreground">
          Don&apos;t have an account?{" "}
          <Link
            href="/register"
            className="font-medium text-primary hover:underline"
          >
            Create one
          </Link>
        </p>
      </div>
    </motion.div>
  );
}

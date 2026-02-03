"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { motion } from "motion/react";
import { ShimmerButton } from "@/components/ui/shimmer-button";
import { Icons } from "@/components/icons";
import { authClient } from "@/lib/auth/client";

type AuthMode = "password" | "otp" | "forgot";
type OtpStep = "email" | "code" | "newPassword";

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") || "/dashboard";
  const error = searchParams.get("error");

  const [authMode, setAuthMode] = useState<AuthMode>("password");
  const [otpStep, setOtpStep] = useState<OtpStep>("email");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");
  const [otpCode, setOtpCode] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [formError, setFormError] = useState("");
  const [migrationStatus, setMigrationStatus] = useState("");
  const [infoMessage, setInfoMessage] = useState("");

  // Handle sending OTP code to email
  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setFormError("");
    setInfoMessage("");

    const normalizedEmail = email.toLowerCase();

    try {
      const result = await authClient.emailOtp.sendVerificationOtp({
        email: normalizedEmail,
        type: "sign-in",
      });

      if (result.error) {
        setFormError(result.error.message || "Failed to send verification code");
        return;
      }

      setInfoMessage("Verification code sent to your email");
      setOtpStep("code");
    } catch {
      setFormError("An error occurred. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  // Handle verifying OTP code
  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setFormError("");
    setInfoMessage("");

    const normalizedEmail = email.toLowerCase();

    try {
      const result = await authClient.signIn.emailOtp({
        email: normalizedEmail,
        otp: otpCode,
      });

      if (result.error) {
        setFormError(result.error.message || "Invalid verification code");
        return;
      }

      // Ensure local user record exists
      if (result.data?.user) {
        await fetch("/api/auth/setup-user", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            neonAuthUserId: result.data.user.id,
            email: result.data.user.email,
            name: result.data.user.name || "User",
          }),
        });
      }

      router.push(callbackUrl);
      router.refresh();
    } catch {
      setFormError("An error occurred. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  // Handle password-based login
  const handlePasswordSubmit = async (e: React.FormEvent) => {
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

  // Handle sending forgot password OTP
  const handleForgotPasswordSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setFormError("");
    setInfoMessage("");

    const normalizedEmail = email.toLowerCase();

    try {
      const result = await authClient.emailOtp.sendVerificationOtp({
        email: normalizedEmail,
        type: "forget-password",
      });

      if (result.error) {
        setFormError(result.error.message || "Failed to send reset code");
        return;
      }

      setInfoMessage("Password reset code sent to your email");
      setOtpStep("code");
    } catch {
      setFormError("An error occurred. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  // Handle forgot password OTP verification (move to new password step)
  const handleForgotPasswordVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");
    setInfoMessage("");
    setOtpStep("newPassword");
  };

  // Handle setting new password
  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setFormError("");
    setInfoMessage("");

    if (newPassword !== confirmNewPassword) {
      setFormError("Passwords do not match");
      setIsLoading(false);
      return;
    }

    if (newPassword.length < 8) {
      setFormError("Password must be at least 8 characters");
      setIsLoading(false);
      return;
    }

    const normalizedEmail = email.toLowerCase();

    try {
      const result = await authClient.emailOtp.resetPassword({
        email: normalizedEmail,
        otp: otpCode,
        password: newPassword,
      });

      if (result.error) {
        setFormError(result.error.message || "Failed to reset password");
        return;
      }

      setInfoMessage("Password reset successful! You can now sign in.");
      setAuthMode("password");
      setOtpStep("email");
      setOtpCode("");
      setNewPassword("");
      setConfirmNewPassword("");
    } catch {
      setFormError("An error occurred. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const switchAuthMode = (mode: AuthMode) => {
    setAuthMode(mode);
    setOtpStep("email");
    setFormError("");
    setInfoMessage("");
    setOtpCode("");
    setNewPassword("");
    setConfirmNewPassword("");
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

        {/* Auth mode tabs */}
        <div className="mb-6 flex rounded-lg border border-input p-1">
          <button
            type="button"
            onClick={() => switchAuthMode("password")}
            className={`flex-1 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
              authMode === "password"
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Password
          </button>
          <button
            type="button"
            onClick={() => switchAuthMode("otp")}
            className={`flex-1 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
              authMode === "otp"
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Email Code
          </button>
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

        {infoMessage && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="mb-6 rounded-lg bg-primary/10 p-4 text-sm text-primary"
          >
            {infoMessage}
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

        {/* Password-based login form */}
        {authMode === "password" && (
          <form onSubmit={handlePasswordSubmit} className="space-y-6">
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

            <button
              type="button"
              onClick={() => switchAuthMode("forgot")}
              className="w-full text-sm text-muted-foreground hover:text-foreground"
            >
              Forgot password?
            </button>
          </form>
        )}

        {/* Forgot password - email step */}
        {authMode === "forgot" && otpStep === "email" && (
          <form onSubmit={handleForgotPasswordSendOtp} className="space-y-6">
            <div>
              <label
                htmlFor="forgot-email"
                className="block text-sm font-medium text-foreground"
              >
                Email
              </label>
              <input
                id="forgot-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="mt-2 w-full rounded-lg border border-input bg-background px-4 py-3 text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                placeholder="you@example.com"
              />
              <p className="mt-2 text-xs text-muted-foreground">
                We&apos;ll send a password reset code to your email
              </p>
            </div>

            <ShimmerButton
              type="submit"
              disabled={isLoading}
              className="w-full"
            >
              {isLoading ? (
                <>
                  <Icons.Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Sending code...
                </>
              ) : (
                "Send Reset Code"
              )}
            </ShimmerButton>

            <button
              type="button"
              onClick={() => switchAuthMode("password")}
              className="w-full text-sm text-muted-foreground hover:text-foreground"
            >
              Back to sign in
            </button>
          </form>
        )}

        {/* Forgot password - OTP verification step */}
        {authMode === "forgot" && otpStep === "code" && (
          <form onSubmit={handleForgotPasswordVerifyOtp} className="space-y-6">
            <div>
              <label
                htmlFor="forgot-otp"
                className="block text-sm font-medium text-foreground"
              >
                Reset Code
              </label>
              <input
                id="forgot-otp"
                type="text"
                value={otpCode}
                onChange={(e) => setOtpCode(e.target.value)}
                required
                autoComplete="one-time-code"
                inputMode="numeric"
                pattern="[0-9]*"
                className="mt-2 w-full rounded-lg border border-input bg-background px-4 py-3 text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 text-center tracking-widest text-lg"
                placeholder="000000"
              />
              <p className="mt-2 text-xs text-muted-foreground">
                Enter the 6-digit code sent to {email}
              </p>
            </div>

            <ShimmerButton
              type="submit"
              disabled={isLoading || !otpCode}
              className="w-full"
            >
              Continue
            </ShimmerButton>

            <button
              type="button"
              onClick={() => {
                setOtpStep("email");
                setOtpCode("");
                setFormError("");
                setInfoMessage("");
              }}
              className="w-full text-sm text-muted-foreground hover:text-foreground"
            >
              Use a different email
            </button>
          </form>
        )}

        {/* Forgot password - new password step */}
        {authMode === "forgot" && otpStep === "newPassword" && (
          <form onSubmit={handleResetPassword} className="space-y-6">
            <div>
              <label
                htmlFor="new-password"
                className="block text-sm font-medium text-foreground"
              >
                New Password
              </label>
              <input
                id="new-password"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
                minLength={8}
                className="mt-2 w-full rounded-lg border border-input bg-background px-4 py-3 text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                placeholder="••••••••"
              />
              <p className="mt-1 text-xs text-muted-foreground">
                At least 8 characters
              </p>
            </div>

            <div>
              <label
                htmlFor="confirm-new-password"
                className="block text-sm font-medium text-foreground"
              >
                Confirm New Password
              </label>
              <input
                id="confirm-new-password"
                type="password"
                value={confirmNewPassword}
                onChange={(e) => setConfirmNewPassword(e.target.value)}
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
                  Resetting password...
                </>
              ) : (
                "Reset Password"
              )}
            </ShimmerButton>

            <button
              type="button"
              onClick={() => switchAuthMode("password")}
              className="w-full text-sm text-muted-foreground hover:text-foreground"
            >
              Back to sign in
            </button>
          </form>
        )}

        {/* Email OTP login form */}
        {authMode === "otp" && otpStep === "email" && (
          <form onSubmit={handleSendOtp} className="space-y-6">
            <div>
              <label
                htmlFor="otp-email"
                className="block text-sm font-medium text-foreground"
              >
                Email
              </label>
              <input
                id="otp-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="mt-2 w-full rounded-lg border border-input bg-background px-4 py-3 text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                placeholder="you@example.com"
              />
              <p className="mt-2 text-xs text-muted-foreground">
                We&apos;ll send a verification code to your email
              </p>
            </div>

            <ShimmerButton
              type="submit"
              disabled={isLoading}
              className="w-full"
            >
              {isLoading ? (
                <>
                  <Icons.Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Sending code...
                </>
              ) : (
                "Send Verification Code"
              )}
            </ShimmerButton>
          </form>
        )}

        {/* OTP verification step */}
        {authMode === "otp" && otpStep === "code" && (
          <form onSubmit={handleVerifyOtp} className="space-y-6">
            <div>
              <label
                htmlFor="otp-code"
                className="block text-sm font-medium text-foreground"
              >
                Verification Code
              </label>
              <input
                id="otp-code"
                type="text"
                value={otpCode}
                onChange={(e) => setOtpCode(e.target.value)}
                required
                autoComplete="one-time-code"
                inputMode="numeric"
                pattern="[0-9]*"
                className="mt-2 w-full rounded-lg border border-input bg-background px-4 py-3 text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 text-center tracking-widest text-lg"
                placeholder="000000"
              />
              <p className="mt-2 text-xs text-muted-foreground">
                Enter the 6-digit code sent to {email}
              </p>
            </div>

            <ShimmerButton
              type="submit"
              disabled={isLoading}
              className="w-full"
            >
              {isLoading ? (
                <>
                  <Icons.Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Verifying...
                </>
              ) : (
                "Verify & Sign In"
              )}
            </ShimmerButton>

            <button
              type="button"
              onClick={() => {
                setOtpStep("email");
                setOtpCode("");
                setFormError("");
                setInfoMessage("");
              }}
              className="w-full text-sm text-muted-foreground hover:text-foreground"
            >
              Use a different email
            </button>
          </form>
        )}

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

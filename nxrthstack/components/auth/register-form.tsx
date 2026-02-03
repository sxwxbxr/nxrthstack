"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "motion/react";
import { ShimmerButton } from "@/components/ui/shimmer-button";
import { Icons } from "@/components/icons";
import { authClient } from "@/lib/auth/client";

type Step = "form" | "verify";

export function RegisterForm() {
  const router = useRouter();

  const [step, setStep] = useState<Step>("form");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [verificationCode, setVerificationCode] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [infoMessage, setInfoMessage] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");
    setInfoMessage("");

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      setIsLoading(false);
      return;
    }

    if (password.length < 8) {
      setError("Password must be at least 8 characters");
      setIsLoading(false);
      return;
    }

    const normalizedEmail = email.toLowerCase();

    try {
      // Step 1: Create Neon Auth account
      const signUpResult = await authClient.signUp.email({
        email: normalizedEmail,
        password,
        name,
      });

      if (signUpResult.error) {
        // Check if email verification is required
        if (signUpResult.error.message?.includes("verify") ||
            signUpResult.error.code === "EMAIL_NOT_VERIFIED") {
          setInfoMessage("Please check your email for a verification code");
          setStep("verify");
          return;
        }
        setError(signUpResult.error.message || "Registration failed");
        return;
      }

      // Step 2: Create local user record with custom fields
      if (signUpResult.data?.user) {
        const setupRes = await fetch("/api/auth/setup-user", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            neonAuthUserId: signUpResult.data.user.id,
            email: normalizedEmail,
            name,
          }),
        });

        if (!setupRes.ok) {
          console.error("Failed to create local user record");
        }
      }

      // Redirect to dashboard (user is already logged in after signup)
      router.push("/dashboard");
      router.refresh();
    } catch {
      setError("An error occurred. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");
    setInfoMessage("");

    const normalizedEmail = email.toLowerCase();

    try {
      // Verify the email with the code
      const verifyResult = await authClient.signIn.emailOtp({
        email: normalizedEmail,
        otp: verificationCode,
      });

      if (verifyResult.error) {
        setError(verifyResult.error.message || "Invalid verification code");
        return;
      }

      // Create local user record
      if (verifyResult.data?.user) {
        const setupRes = await fetch("/api/auth/setup-user", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            neonAuthUserId: verifyResult.data.user.id,
            email: normalizedEmail,
            name,
          }),
        });

        if (!setupRes.ok) {
          console.error("Failed to create local user record");
        }
      }

      // Redirect to dashboard
      router.push("/dashboard");
      router.refresh();
    } catch {
      setError("An error occurred. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendCode = async () => {
    setIsLoading(true);
    setError("");
    setInfoMessage("");

    const normalizedEmail = email.toLowerCase();

    try {
      const result = await authClient.emailOtp.sendVerificationOtp({
        email: normalizedEmail,
        type: "email-verification",
      });

      if (result.error) {
        setError(result.error.message || "Failed to resend code");
        return;
      }

      setInfoMessage("A new verification code has been sent to your email");
    } catch {
      setError("An error occurred. Please try again.");
    } finally {
      setIsLoading(false);
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
            Create an account to get started
          </p>
        </div>

        {error && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="mb-6 rounded-lg bg-destructive/10 p-4 text-sm text-destructive"
          >
            {error}
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

        {/* Registration form */}
        {step === "form" && (
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label
                htmlFor="name"
                className="block text-sm font-medium text-foreground"
              >
                Name
              </label>
              <input
                id="name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="mt-2 w-full rounded-lg border border-input bg-background px-4 py-3 text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                placeholder="John Doe"
              />
            </div>

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
              <p className="mt-1 text-xs text-muted-foreground">
                At least 8 characters
              </p>
            </div>

            <div>
              <label
                htmlFor="confirmPassword"
                className="block text-sm font-medium text-foreground"
              >
                Confirm Password
              </label>
              <input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
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
                  Creating account...
                </>
              ) : (
                "Create Account"
              )}
            </ShimmerButton>
          </form>
        )}

        {/* Email verification step */}
        {step === "verify" && (
          <form onSubmit={handleVerifyCode} className="space-y-5">
            <div>
              <label
                htmlFor="verificationCode"
                className="block text-sm font-medium text-foreground"
              >
                Verification Code
              </label>
              <input
                id="verificationCode"
                type="text"
                value={verificationCode}
                onChange={(e) => setVerificationCode(e.target.value)}
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
                "Verify & Create Account"
              )}
            </ShimmerButton>

            <div className="flex flex-col gap-2">
              <button
                type="button"
                onClick={handleResendCode}
                disabled={isLoading}
                className="w-full text-sm text-muted-foreground hover:text-foreground disabled:opacity-50"
              >
                Resend verification code
              </button>
              <button
                type="button"
                onClick={() => {
                  setStep("form");
                  setVerificationCode("");
                  setError("");
                  setInfoMessage("");
                }}
                className="w-full text-sm text-muted-foreground hover:text-foreground"
              >
                Use a different email
              </button>
            </div>
          </form>
        )}

        <p className="mt-6 text-center text-sm text-muted-foreground">
          Already have an account?{" "}
          <Link
            href="/login"
            className="font-medium text-primary hover:underline"
          >
            Sign in
          </Link>
        </p>
      </div>
    </motion.div>
  );
}

"use client";

import Link from "next/link";
import { useSession, signOut } from "next-auth/react";
import { motion } from "motion/react";
import { Icons } from "@/components/icons";

export function ShopHeader() {
  const { data: session, status } = useSession();

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-background/80 backdrop-blur-lg">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
        <Link href="/" className="flex items-center gap-2">
          <span className="text-xl font-bold text-foreground">
            Nxrth<span className="text-primary">Stack</span>
          </span>
        </Link>

        <nav className="flex items-center gap-6">
          <Link
            href="/shop"
            className="text-sm font-medium text-foreground transition-colors hover:text-primary"
          >
            Shop
          </Link>
          <Link
            href="/"
            className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
          >
            Home
          </Link>

          {status === "loading" ? (
            <div className="h-9 w-24 animate-pulse rounded-lg bg-muted" />
          ) : session ? (
            <div className="flex items-center gap-4">
              <Link
                href="/dashboard"
                className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
              >
                Dashboard
              </Link>
              {session.user.role === "admin" && (
                <Link
                  href="/admin"
                  className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
                >
                  Admin
                </Link>
              )}
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => signOut({ callbackUrl: "/shop" })}
                className="flex items-center gap-2 rounded-lg bg-muted px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-muted/80"
              >
                <Icons.LogOut className="h-4 w-4" />
                Sign Out
              </motion.button>
            </div>
          ) : (
            <div className="flex items-center gap-3">
              <Link
                href="/login"
                className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
              >
                Sign In
              </Link>
              <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                <Link
                  href="/register"
                  className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
                >
                  Get Started
                </Link>
              </motion.div>
            </div>
          )}
        </nav>
      </div>
    </header>
  );
}

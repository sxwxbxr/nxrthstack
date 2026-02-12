"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "motion/react";
import { cn } from "@/lib/utils";
import { Icons } from "@/components/icons";
import { useExtendedSession } from "@/lib/auth/hooks";
import {
  useMobileSidebar,
  SidebarBackdrop,
} from "@/components/ui/mobile-sidebar";

const navItems = [
  {
    title: "Overview",
    href: "/dashboard",
    icon: Icons.LayoutDashboard,
  },
  {
    title: "Purchases",
    href: "/dashboard/purchases",
    icon: Icons.ShoppingBag,
  },
  {
    title: "Downloads",
    href: "/dashboard/downloads",
    icon: Icons.Download,
  },
  {
    title: "Subscriptions",
    href: "/dashboard/subscriptions",
    icon: Icons.Calendar,
  },
  {
    title: "GameHub",
    href: "/dashboard/gamehub",
    icon: Icons.Gamepad,
    requiresFriend: true,
  },
  {
    title: "Settings",
    href: "/dashboard/settings",
    icon: Icons.Settings,
  },
];

export function DashboardNav() {
  const pathname = usePathname();
  const { user, signOut } = useExtendedSession();
  const { open, setOpen } = useMobileSidebar();

  return (
    <>
      <SidebarBackdrop />
      <aside
        className={cn(
          "fixed left-0 top-0 z-50 h-screen w-64 border-r border-border bg-card transition-transform duration-300 ease-in-out",
          "md:translate-x-0",
          open ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="flex h-full flex-col">
          {/* Logo */}
          <div className="flex h-16 items-center justify-between border-b border-border px-6">
            <Link href="/" className="flex items-center gap-2">
              <span className="text-xl font-bold text-foreground">
                Nxrth<span className="text-primary">Stack</span>
              </span>
            </Link>
            <button
              onClick={() => setOpen(false)}
              className="inline-flex items-center justify-center rounded-lg p-1.5 text-muted-foreground hover:bg-accent hover:text-foreground md:hidden"
            >
              <Icons.X className="h-5 w-5" />
            </button>
          </div>

          {/* User Info */}
          <div className="border-b border-border p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                <Icons.User className="h-5 w-5 text-primary" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate font-medium text-foreground">
                  {user?.name || "User"}
                </p>
                <p className="truncate text-sm text-muted-foreground">
                  {user?.email}
                </p>
              </div>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 space-y-1 p-4">
            {navItems
              .filter(
                (item) =>
                  !("requiresFriend" in item) ||
                  !item.requiresFriend ||
                  user?.isFriend ||
                  user?.role === "admin"
              )
              .map((item) => {
                const isActive =
                  item.href === "/dashboard"
                    ? pathname === item.href
                    : pathname.startsWith(item.href);

                return (
                  <Link key={item.href} href={item.href}>
                    <motion.div
                      whileHover={{ x: 4 }}
                      className={cn(
                        "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                        isActive
                          ? "bg-primary text-primary-foreground"
                          : "text-muted-foreground hover:bg-accent hover:text-foreground"
                      )}
                    >
                      <item.icon className="h-5 w-5" />
                      {item.title}
                    </motion.div>
                  </Link>
                );
              })}
          </nav>

          {/* Footer */}
          <div className="border-t border-border p-4">
            {user?.role === "admin" && (
              <Link href="/admin">
                <motion.div
                  whileHover={{ x: 4 }}
                  className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-muted-foreground hover:bg-primary/10 hover:text-primary"
                >
                  <Icons.Shield className="h-5 w-5" />
                  Admin Dashboard
                </motion.div>
              </Link>
            )}
            <Link href="/shop">
              <motion.div
                whileHover={{ x: 4 }}
                className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-muted-foreground hover:bg-accent hover:text-foreground"
              >
                <Icons.Store className="h-5 w-5" />
                Browse Shop
              </motion.div>
            </Link>
            <button
              onClick={async () => {
                await signOut();
                window.location.href = "/";
              }}
              className="mt-1 flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
            >
              <Icons.LogOut className="h-5 w-5" />
              Sign Out
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}

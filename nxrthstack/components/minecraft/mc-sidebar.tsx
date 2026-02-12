"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { motion } from "motion/react";
import { cn } from "@/lib/utils";
import { Icons } from "@/components/icons";
import { useMcStatus } from "@/hooks/use-mc-status";
import { useMcContext } from "@/components/minecraft/mc-context";
import {
  useMobileSidebar,
  SidebarBackdrop,
} from "@/components/ui/mobile-sidebar";

const navItems = [
  {
    title: "Overview",
    path: "",
    icon: Icons.LayoutDashboard,
  },
  {
    title: "Console",
    path: "/console",
    icon: Icons.Terminal,
  },
  {
    title: "Players",
    path: "/players",
    icon: Icons.Users,
  },
  {
    title: "Files",
    path: "/files",
    icon: Icons.FolderOpen,
  },
  {
    title: "Config",
    path: "/config",
    icon: Icons.Sliders,
  },
  {
    title: "Backups",
    path: "/backups",
    icon: Icons.HardDrive,
  },
  {
    title: "Events",
    path: "/events",
    icon: Icons.History,
  },
  {
    title: "Settings",
    path: "/settings",
    icon: Icons.Settings,
  },
];

const comingSoonItems = [
  { title: "Modpacks", icon: Icons.Package },
  { title: "Scheduler", icon: Icons.Calendar },
  { title: "Discord", icon: Icons.MessageCircle },
];

export function McSidebar() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { serverId, serverName } = useMcContext();
  const { status } = useMcStatus(serverId);
  const { open, setOpen } = useMobileSidebar();

  const basePath = "/dashboard/gamehub/minecraft/server";
  const idParam = `?id=${serverId}`;

  const isOnline = status?.running === true;

  return (
    <>
      <SidebarBackdrop />
      <aside
        className={cn(
          "fixed left-0 top-0 z-50 h-screen w-56 border-r border-border bg-card transition-transform duration-300 ease-in-out",
          "md:translate-x-0",
          open ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="flex h-full flex-col">
          {/* Header */}
          <div className="flex h-14 items-center justify-between border-b border-border px-4">
            <Link
              href="/dashboard/gamehub/minecraft"
              className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              <Icons.ChevronLeft className="h-4 w-4" />
              <span className="truncate font-medium text-foreground">
                {serverName}
              </span>
            </Link>
            <button
              onClick={() => setOpen(false)}
              className="inline-flex items-center justify-center rounded-lg p-1.5 text-muted-foreground hover:bg-accent hover:text-foreground md:hidden"
            >
              <Icons.X className="h-4 w-4" />
            </button>
          </div>

          {/* Status indicator */}
          <div className="px-4 py-3 border-b border-border">
            <div className="flex items-center gap-2">
              <span
                className={cn(
                  "h-2 w-2 rounded-full",
                  isOnline ? "bg-green-500 animate-pulse" : "bg-red-500"
                )}
              />
              <span className="text-xs text-muted-foreground">
                {status
                  ? isOnline
                    ? `Online — ${status.players.online}/${status.players.max}`
                    : "Offline"
                  : "Connecting..."}
              </span>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 space-y-0.5 p-3 overflow-y-auto">
            {navItems.map((item) => {
              const href = `${basePath}${item.path}${idParam}`;
              const currentSub = pathname.replace(basePath, "") || "";
              const isActive = currentSub === item.path;

              return (
                <Link key={item.path} href={href}>
                  <motion.div
                    whileHover={{ x: 3 }}
                    className={cn(
                      "flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                      isActive
                        ? "bg-primary text-primary-foreground"
                        : "text-muted-foreground hover:bg-accent hover:text-foreground"
                    )}
                  >
                    <item.icon className="h-4 w-4" />
                    {item.title}
                  </motion.div>
                </Link>
              );
            })}

            {/* Separator */}
            <div className="my-3 border-t border-border" />

            {/* Coming soon */}
            <p className="px-3 pb-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/60">
              Coming Soon
            </p>
            {comingSoonItems.map((item) => (
              <div
                key={item.title}
                className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground/40 cursor-default"
              >
                <item.icon className="h-4 w-4" />
                {item.title}
              </div>
            ))}
          </nav>

          {/* Footer */}
          <div className="border-t border-border p-3">
            <Link href="/dashboard/gamehub/minecraft">
              <motion.div
                whileHover={{ x: 3 }}
                className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-accent hover:text-foreground"
              >
                <Icons.Server className="h-4 w-4" />
                All Servers
              </motion.div>
            </Link>
          </div>
        </div>
      </aside>
    </>
  );
}

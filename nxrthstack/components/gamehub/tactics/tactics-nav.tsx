"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "motion/react";
import { cn } from "@/lib/utils";
import { Icons } from "@/components/icons";

const tacticsNavItems = [
  {
    title: "Dashboard",
    href: "/dashboard/gamehub/tactics",
    icon: Icons.LayoutDashboard,
    exact: true,
  },
  {
    title: "Squad",
    href: "/dashboard/gamehub/tactics/squad",
    icon: Icons.Users,
  },
  {
    title: "Battle",
    href: "/dashboard/gamehub/tactics/battle",
    icon: Icons.Swords,
  },
  {
    title: "History",
    href: "/dashboard/gamehub/tactics/history",
    icon: Icons.Clock,
  },
];

export function TacticsNav() {
  const pathname = usePathname();

  return (
    <nav className="flex gap-2 border-b border-border pb-4 overflow-x-auto scrollbar-none -mx-4 px-4 md:mx-0 md:px-0">
      {tacticsNavItems.map((item) => {
        const isActive = item.exact
          ? pathname === item.href
          : pathname.startsWith(item.href);

        return (
          <Link key={item.href} href={item.href}>
            <motion.div
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className={cn(
                "flex shrink-0 items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors whitespace-nowrap",
                isActive
                  ? "bg-primary text-primary-foreground"
                  : "bg-card text-muted-foreground hover:bg-accent hover:text-foreground"
              )}
            >
              <item.icon className="h-4 w-4" />
              {item.title}
            </motion.div>
          </Link>
        );
      })}
    </nav>
  );
}

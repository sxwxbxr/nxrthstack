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
    title: "Classes",
    href: "/dashboard/gamehub/tactics/classes",
    icon: Icons.BookOpen,
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
  {
    title: "Shop",
    href: "/dashboard/gamehub/tactics/shop",
    icon: Icons.ShoppingBag,
  },
  {
    title: "Inventory",
    href: "/dashboard/gamehub/tactics/inventory",
    icon: Icons.Package,
  },
  {
    title: "Wheel",
    href: "/dashboard/gamehub/tactics/wheel",
    icon: Icons.Dices,
  },
  {
    title: "Wizard Tower",
    href: "/dashboard/gamehub/tactics/wizard-tower",
    icon: Icons.Wand,
  },
  {
    title: "Compare",
    href: "/dashboard/gamehub/tactics/compare",
    icon: Icons.BarChart,
  },
  {
    title: "Quests",
    href: "/dashboard/gamehub/tactics/quests",
    icon: Icons.ScrollText,
  },
  {
    title: "Achievements",
    href: "/dashboard/gamehub/tactics/achievements",
    icon: Icons.Medal,
  },
  {
    title: "Leaderboard",
    href: "/dashboard/gamehub/tactics/leaderboard",
    icon: Icons.Trophy,
  },
];

export function TacticsNav() {
  const pathname = usePathname();

  return (
    <nav className="relative border-b-2 border-border pb-3 overflow-x-auto scrollbar-none -mx-4 px-4 md:mx-0 md:px-0">
      <div className="flex gap-1">
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
                  "relative flex shrink-0 items-center gap-2 rounded-sm px-3 py-2 text-xs font-medium transition-all whitespace-nowrap tactics-stat-label border-2",
                  isActive
                    ? "border-primary bg-primary/10 text-primary shadow-[0_0_8px_2px_var(--tactics-glow-gold)]"
                    : "border-transparent text-muted-foreground hover:text-foreground hover:bg-accent/50"
                )}
              >
                <item.icon className="h-3.5 w-3.5" />
                {item.title}
                {isActive && (
                  <motion.div
                    layoutId="tactics-nav-indicator"
                    className="absolute -bottom-[13px] left-2 right-2 h-0.5 bg-primary"
                  />
                )}
              </motion.div>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

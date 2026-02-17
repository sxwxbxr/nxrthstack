"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "motion/react";
import { cn } from "@/lib/utils";
import { Icons } from "@/components/icons";

interface NavItem {
  title: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  exact?: boolean;
}

interface NavGroup {
  label: string;
  items: NavItem[];
}

const navGroups: NavGroup[] = [
  {
    label: "Play",
    items: [
      { title: "Dashboard", href: "/dashboard/gamehub/tactics", icon: Icons.LayoutDashboard, exact: true },
      { title: "Battle", href: "/dashboard/gamehub/tactics/battle", icon: Icons.Swords },
      { title: "Warfare", href: "/dashboard/gamehub/tactics/warfare", icon: Icons.Shield },
      { title: "Campaign", href: "/dashboard/gamehub/tactics/campaign", icon: Icons.Map },
    ],
  },
  {
    label: "Build",
    items: [
      { title: "Squad", href: "/dashboard/gamehub/tactics/squad", icon: Icons.Users },
      { title: "Classes", href: "/dashboard/gamehub/tactics/classes", icon: Icons.BookOpen },
      { title: "Compare", href: "/dashboard/gamehub/tactics/compare", icon: Icons.BarChart },
    ],
  },
  {
    label: "Collect",
    items: [
      { title: "Shop", href: "/dashboard/gamehub/tactics/shop", icon: Icons.ShoppingBag },
      { title: "Inventory", href: "/dashboard/gamehub/tactics/inventory", icon: Icons.Package },
      { title: "Wheel", href: "/dashboard/gamehub/tactics/wheel", icon: Icons.Dices },
      { title: "Wizard Tower", href: "/dashboard/gamehub/tactics/wizard-tower", icon: Icons.Wand },
    ],
  },
  {
    label: "Progress",
    items: [
      { title: "Quests", href: "/dashboard/gamehub/tactics/quests", icon: Icons.ScrollText },
      { title: "Achievements", href: "/dashboard/gamehub/tactics/achievements", icon: Icons.Medal },
      { title: "History", href: "/dashboard/gamehub/tactics/history", icon: Icons.Clock },
      { title: "Leaderboard", href: "/dashboard/gamehub/tactics/leaderboard", icon: Icons.Trophy },
    ],
  },
  {
    label: "Learn",
    items: [
      { title: "Wiki", href: "/dashboard/gamehub/tactics/wiki", icon: Icons.BookOpen },
    ],
  },
];

export function TacticsNav() {
  const pathname = usePathname();

  return (
    <nav className="relative border-b-2 border-border pb-3 overflow-x-auto scrollbar-none -mx-4 px-4 md:mx-0 md:px-0">
      <div className="flex gap-0.5">
        {navGroups.map((group, gi) => (
          <div key={group.label} className="flex items-center">
            {/* Group separator (except first) */}
            {gi > 0 && (
              <div className="mx-1.5 h-5 w-px bg-border shrink-0" />
            )}

            {/* Group label (desktop only) */}
            <span className="hidden lg:block text-[9px] uppercase tracking-wider text-muted-foreground/50 font-bold mr-1 shrink-0">
              {group.label}
            </span>

            {/* Items */}
            {group.items.map((item) => {
              const isActive = item.exact
                ? pathname === item.href
                : pathname.startsWith(item.href);

              return (
                <Link key={item.href} href={item.href}>
                  <motion.div
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className={cn(
                      "relative flex shrink-0 items-center gap-1.5 rounded-sm px-2 py-1.5 text-[11px] font-medium transition-all whitespace-nowrap tactics-stat-label border-2",
                      isActive
                        ? "border-primary bg-primary/10 text-primary shadow-[0_0_8px_2px_var(--tactics-glow-gold)]"
                        : "border-transparent text-muted-foreground hover:text-foreground hover:bg-accent/50"
                    )}
                  >
                    <item.icon className="h-3 w-3" />
                    <span className="hidden sm:inline">{item.title}</span>
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
        ))}
      </div>
    </nav>
  );
}

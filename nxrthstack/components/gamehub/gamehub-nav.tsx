"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "motion/react";
import { cn } from "@/lib/utils";
import { Icons } from "@/components/icons";

const gameHubNavItems = [
  {
    title: "Home",
    href: "/dashboard/gamehub",
    icon: Icons.Home,
    exact: true,
  },
  {
    title: "Rainbow Six Siege",
    href: "/dashboard/gamehub/r6",
    icon: Icons.Gamepad,
  },
  {
    title: "Pokemon",
    href: "/dashboard/gamehub/pokemon",
    icon: Icons.Sparkles,
  },
  {
    title: "Minecraft",
    href: "/dashboard/gamehub/minecraft",
    icon: Icons.Package,
  },
];

export function GameHubNav() {
  const pathname = usePathname();

  return (
    <nav className="flex gap-2 border-b border-border pb-4">
      {gameHubNavItems.map((item) => {
        const isActive = item.exact
          ? pathname === item.href
          : pathname.startsWith(item.href);

        return (
          <Link key={item.href} href={item.href}>
            <motion.div
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className={cn(
                "flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors",
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

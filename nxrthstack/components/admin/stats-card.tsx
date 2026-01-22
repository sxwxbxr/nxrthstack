"use client";

import { motion } from "motion/react";
import { cn } from "@/lib/utils";
import {
  DollarSign,
  ShoppingBag,
  Package,
  Users,
  TrendingUp,
  Calendar,
  CreditCard,
  Download,
  type LucideIcon,
} from "lucide-react";

const iconMap: Record<string, LucideIcon> = {
  DollarSign,
  ShoppingBag,
  Package,
  Users,
  TrendingUp,
  Calendar,
  CreditCard,
  Download,
};

interface StatsCardProps {
  title: string;
  value: string | number;
  description?: string;
  icon: keyof typeof iconMap;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  className?: string;
}

export function StatsCard({
  title,
  value,
  description,
  icon,
  trend,
  className,
}: StatsCardProps) {
  const Icon = iconMap[icon] || DollarSign;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        "rounded-xl border border-border bg-card p-6",
        className
      )}
    >
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-muted-foreground">{title}</p>
        <div className="rounded-lg bg-primary/10 p-2">
          <Icon className="h-5 w-5 text-primary" />
        </div>
      </div>
      <div className="mt-4">
        <p className="text-3xl font-bold text-foreground">{value}</p>
        {(description || trend) && (
          <div className="mt-1 flex items-center gap-2">
            {trend && (
              <span
                className={cn(
                  "text-sm font-medium",
                  trend.isPositive ? "text-green-500" : "text-red-500"
                )}
              >
                {trend.isPositive ? "+" : ""}
                {trend.value}%
              </span>
            )}
            {description && (
              <span className="text-sm text-muted-foreground">
                {description}
              </span>
            )}
          </div>
        )}
      </div>
    </motion.div>
  );
}

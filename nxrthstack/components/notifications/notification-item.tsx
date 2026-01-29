"use client";

import { motion } from "motion/react";
import Link from "next/link";
import { Icons } from "@/components/icons";
import { cn } from "@/lib/utils";
import { NOTIFICATION_CONFIG, type NotificationType } from "@/lib/notifications/types";

interface NotificationItemProps {
  notification: {
    id: string;
    type: NotificationType;
    category: string;
    title: string;
    message: string;
    actionUrl?: string | null;
    actionLabel?: string | null;
    isRead: boolean;
    createdAt: string;
  };
  onMarkAsRead: (id: string) => void;
  onDelete: (id: string) => void;
}

function formatRelativeTime(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffSeconds = Math.floor(diffMs / 1000);
  const diffMinutes = Math.floor(diffSeconds / 60);
  const diffHours = Math.floor(diffMinutes / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffSeconds < 60) {
    return "just now";
  } else if (diffMinutes < 60) {
    return `${diffMinutes}m ago`;
  } else if (diffHours < 24) {
    return `${diffHours}h ago`;
  } else if (diffDays < 7) {
    return `${diffDays}d ago`;
  } else {
    return date.toLocaleDateString();
  }
}

export function NotificationItem({
  notification,
  onMarkAsRead,
  onDelete,
}: NotificationItemProps) {
  const config = NOTIFICATION_CONFIG[notification.type];
  const IconComponent =
    Icons[config.icon as keyof typeof Icons] || Icons.Bell;

  const handleClick = () => {
    if (!notification.isRead) {
      onMarkAsRead(notification.id);
    }
  };

  const content = (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 10 }}
      className={cn(
        "group flex gap-3 px-4 py-3 hover:bg-accent/50 transition-colors cursor-pointer",
        !notification.isRead && "bg-primary/5"
      )}
      onClick={handleClick}
    >
      {/* Icon */}
      <div
        className={cn(
          "flex-shrink-0 flex h-10 w-10 items-center justify-center rounded-full",
          notification.category === "gamehub" &&
            "bg-orange-500/10 text-orange-500",
          notification.category === "product" &&
            "bg-blue-500/10 text-blue-500",
          notification.category === "system" &&
            "bg-purple-500/10 text-purple-500"
        )}
      >
        <IconComponent className="h-5 w-5" />
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <p
            className={cn(
              "text-sm",
              notification.isRead
                ? "text-foreground/80"
                : "text-foreground font-medium"
            )}
          >
            {notification.title}
          </p>
          {!notification.isRead && (
            <span className="flex-shrink-0 h-2 w-2 rounded-full bg-primary" />
          )}
        </div>
        <p className="text-sm text-muted-foreground line-clamp-2 mt-0.5">
          {notification.message}
        </p>
        <div className="flex items-center gap-2 mt-1">
          <span className="text-xs text-muted-foreground">
            {formatRelativeTime(notification.createdAt)}
          </span>
          {notification.actionUrl && notification.actionLabel && (
            <span className="text-xs text-primary font-medium">
              {notification.actionLabel}
            </span>
          )}
        </div>
      </div>

      {/* Delete button */}
      <button
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          onDelete(notification.id);
        }}
        className="flex-shrink-0 p-1 rounded hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors opacity-0 group-hover:opacity-100"
      >
        <Icons.Trash2 className="h-4 w-4" />
      </button>
    </motion.div>
  );

  if (notification.actionUrl) {
    return (
      <Link href={notification.actionUrl} className="block">
        {content}
      </Link>
    );
  }

  return content;
}

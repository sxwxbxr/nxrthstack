"use client";

import { useState, useEffect, useCallback } from "react";
import { AnimatePresence } from "motion/react";
import { Icons } from "@/components/icons";
import { cn } from "@/lib/utils";
import { NotificationItem } from "./notification-item";
import type { NotificationType } from "@/lib/notifications/types";

interface Notification {
  id: string;
  type: NotificationType;
  category: string;
  title: string;
  message: string;
  actionUrl?: string | null;
  actionLabel?: string | null;
  metadata: Record<string, unknown>;
  isRead: boolean;
  createdAt: string;
}

interface NotificationPanelProps {
  onClose: () => void;
  onNotificationsRead: () => void;
}

type TabType = "all" | "gamehub" | "product" | "system";

export function NotificationPanel({
  onClose,
  onNotificationsRead,
}: NotificationPanelProps) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<TabType>("all");
  const [unreadCount, setUnreadCount] = useState(0);

  const fetchNotifications = useCallback(async () => {
    try {
      const params = new URLSearchParams({ limit: "20" });
      if (activeTab !== "all") {
        params.set("category", activeTab);
      }

      const res = await fetch(`/api/notifications?${params}`);
      if (res.ok) {
        const data = await res.json();
        setNotifications(data.notifications);
        setUnreadCount(data.unreadCount);
      }
    } catch (error) {
      console.error("Failed to fetch notifications:", error);
    } finally {
      setLoading(false);
    }
  }, [activeTab]);

  useEffect(() => {
    setLoading(true);
    fetchNotifications();
  }, [fetchNotifications]);

  const handleMarkAsRead = async (id: string) => {
    try {
      await fetch(`/api/notifications/${id}`, { method: "PATCH" });
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
      onNotificationsRead();
    } catch (error) {
      console.error("Failed to mark as read:", error);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await fetch("/api/notifications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "mark_all_read",
          category: activeTab !== "all" ? activeTab : undefined,
        }),
      });
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      setUnreadCount(0);
      onNotificationsRead();
    } catch (error) {
      console.error("Failed to mark all as read:", error);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await fetch(`/api/notifications/${id}`, { method: "DELETE" });
      const deleted = notifications.find((n) => n.id === id);
      setNotifications((prev) => prev.filter((n) => n.id !== id));
      if (deleted && !deleted.isRead) {
        setUnreadCount((prev) => Math.max(0, prev - 1));
        onNotificationsRead();
      }
    } catch (error) {
      console.error("Failed to delete notification:", error);
    }
  };

  const tabs: { key: TabType; label: string; icon: typeof Icons.Bell }[] = [
    { key: "all", label: "All", icon: Icons.Bell },
    { key: "gamehub", label: "GameHub", icon: Icons.Gamepad },
    { key: "product", label: "Products", icon: Icons.Package },
    { key: "system", label: "System", icon: Icons.Info },
  ];

  return (
    <div className="rounded-xl border border-border bg-card shadow-xl overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border px-4 py-3">
        <div className="flex items-center gap-2">
          <Icons.Bell className="h-5 w-5 text-primary" />
          <h3 className="font-semibold text-foreground">Notifications</h3>
          {unreadCount > 0 && (
            <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
              {unreadCount} new
            </span>
          )}
        </div>
        <button
          onClick={onClose}
          className="p-1 rounded hover:bg-accent text-muted-foreground hover:text-foreground transition-colors"
        >
          <Icons.Close className="h-4 w-4" />
        </button>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-border px-2">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={cn(
              "flex items-center gap-1.5 px-3 py-2 text-sm font-medium transition-colors border-b-2 -mb-px",
              activeTab === tab.key
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground"
            )}
          >
            <tab.icon className="h-4 w-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Mark all read button */}
      {unreadCount > 0 && (
        <div className="px-4 py-2 border-b border-border">
          <button
            onClick={handleMarkAllRead}
            className="text-xs text-primary hover:text-primary/80 font-medium"
          >
            Mark all as read
          </button>
        </div>
      )}

      {/* Notifications list */}
      <div className="max-h-96 overflow-y-auto">
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Icons.Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : notifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
            <Icons.Bell className="h-8 w-8 mb-2 opacity-50" />
            <p className="text-sm">No notifications yet</p>
          </div>
        ) : (
          <div className="divide-y divide-border">
            <AnimatePresence>
              {notifications.map((notification) => (
                <NotificationItem
                  key={notification.id}
                  notification={notification}
                  onMarkAsRead={handleMarkAsRead}
                  onDelete={handleDelete}
                />
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="border-t border-border px-4 py-2">
        <a
          href="/dashboard/settings/notifications"
          className="flex items-center justify-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
        >
          <Icons.Settings className="h-3 w-3" />
          Notification Settings
        </a>
      </div>
    </div>
  );
}

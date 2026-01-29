"use client";

import { useState, useEffect } from "react";
import { Icons } from "@/components/icons";

interface Preferences {
  gamehubAchievements: boolean;
  gamehubLobbyInvites: boolean;
  gamehubMatchResults: boolean;
  gamehubTournaments: boolean;
  gamehubAnnouncements: boolean;
  productUpdates: boolean;
  productUpdatesEmail: boolean;
  systemAnnouncements: boolean;
  systemAnnouncementsEmail: boolean;
}

export function NotificationPreferences() {
  const [preferences, setPreferences] = useState<Preferences | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchPreferences();
  }, []);

  async function fetchPreferences() {
    try {
      const res = await fetch("/api/notifications/preferences");
      if (res.ok) {
        const data = await res.json();
        setPreferences(data.preferences);
      }
    } catch (error) {
      console.error("Failed to fetch preferences:", error);
    } finally {
      setLoading(false);
    }
  }

  async function updatePreference(key: keyof Preferences, value: boolean) {
    if (!preferences) return;

    setSaving(true);
    const updated = { ...preferences, [key]: value };
    setPreferences(updated);

    try {
      await fetch("/api/notifications/preferences", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ [key]: value }),
      });
    } catch (error) {
      console.error("Failed to update preference:", error);
      setPreferences(preferences); // Revert on error
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Icons.Loader2 className="h-6 w-6 animate-spin" />
      </div>
    );
  }

  if (!preferences) return null;

  const sections = [
    {
      title: "GameHub Notifications",
      description: "Notifications for GameHub activities (website only)",
      icon: Icons.Gamepad,
      items: [
        {
          key: "gamehubAchievements" as const,
          label: "Achievement unlocks",
        },
        {
          key: "gamehubLobbyInvites" as const,
          label: "Lobby invitations & joins",
        },
        { key: "gamehubMatchResults" as const, label: "Match results" },
        { key: "gamehubTournaments" as const, label: "Tournament updates" },
        {
          key: "gamehubAnnouncements" as const,
          label: "GameHub announcements",
        },
      ],
    },
    {
      title: "Product Updates",
      description: "Notifications about software you've purchased",
      icon: Icons.Package,
      items: [
        {
          key: "productUpdates" as const,
          label: "New version available (website)",
        },
        {
          key: "productUpdatesEmail" as const,
          label: "New version available (email)",
          isEmail: true,
        },
      ],
    },
    {
      title: "System Notifications",
      description: "Important updates from NxrthStack",
      icon: Icons.Info,
      items: [
        {
          key: "systemAnnouncements" as const,
          label: "System announcements (website)",
        },
        {
          key: "systemAnnouncementsEmail" as const,
          label: "System announcements (email)",
          isEmail: true,
        },
      ],
    },
  ];

  return (
    <div className="space-y-8">
      {sections.map((section) => (
        <div key={section.title} className="space-y-4">
          <div className="flex items-center gap-3">
            <section.icon className="h-5 w-5 text-primary" />
            <div>
              <h3 className="font-medium text-foreground">{section.title}</h3>
              <p className="text-sm text-muted-foreground">
                {section.description}
              </p>
            </div>
          </div>

          <div className="space-y-3 pl-8">
            {section.items.map((item) => (
              <label
                key={item.key}
                className="flex items-center justify-between py-2"
              >
                <span className="text-sm text-foreground">
                  {item.label}
                  {"isEmail" in item && item.isEmail && (
                    <span className="ml-2 text-xs text-muted-foreground">
                      (Coming soon)
                    </span>
                  )}
                </span>
                <button
                  onClick={() =>
                    updatePreference(item.key, !preferences[item.key])
                  }
                  disabled={("isEmail" in item && item.isEmail) || saving}
                  className={`
                    relative inline-flex h-6 w-11 items-center rounded-full transition-colors
                    ${"isEmail" in item && item.isEmail ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}
                    ${preferences[item.key] ? "bg-primary" : "bg-muted"}
                  `}
                >
                  <span
                    className={`
                      inline-block h-4 w-4 transform rounded-full bg-white transition-transform
                      ${preferences[item.key] ? "translate-x-6" : "translate-x-1"}
                    `}
                  />
                </button>
              </label>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

"use client";

import { useState } from "react";
import { Icons } from "@/components/icons";
import type { UserProfileData } from "@/lib/gamehub/profiles";

interface Achievement {
  id: string;
  key: string;
  name: string;
  icon: string | null;
  rarity: string | null;
  unlockedAt: Date;
}

interface PassportEditorProps {
  initialProfile: UserProfileData;
  achievements: Achievement[];
  userName: string;
  userAvatar: string | null;
}

export function PassportEditor({
  initialProfile,
  achievements,
  userName,
  userAvatar,
}: PassportEditorProps) {
  const [profile, setProfile] = useState(initialProfile);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(
    null
  );

  const handleSave = async () => {
    setIsSaving(true);
    setMessage(null);

    try {
      const res = await fetch("/api/gamehub/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          bio: profile.bio,
          usernameSlug: profile.usernameSlug,
          isPublic: profile.isPublic,
          showStats: profile.showStats,
          showActivity: profile.showActivity,
          featuredAchievements: profile.featuredAchievements,
          socialLinks: profile.socialLinks,
        }),
      });

      if (res.ok) {
        setMessage({ type: "success", text: "Profile saved successfully!" });
      } else {
        const data = await res.json();
        setMessage({ type: "error", text: data.error || "Failed to save" });
      }
    } catch {
      setMessage({ type: "error", text: "Failed to save profile" });
    } finally {
      setIsSaving(false);
    }
  };

  const toggleFeaturedAchievement = (achievementId: string) => {
    setProfile((prev) => {
      const featured = prev.featuredAchievements || [];
      if (featured.includes(achievementId)) {
        return {
          ...prev,
          featuredAchievements: featured.filter((id) => id !== achievementId),
        };
      }
      if (featured.length >= 6) {
        return prev; // Max 6 featured
      }
      return {
        ...prev,
        featuredAchievements: [...featured, achievementId],
      };
    });
  };

  return (
    <div className="space-y-6">
      {/* Settings */}
      <div className="rounded-xl border border-border bg-card p-6">
        <h2 className="text-lg font-semibold text-foreground mb-4">Profile Settings</h2>

        <div className="space-y-4">
          {/* Username */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Username
            </label>
            <div className="flex gap-2">
              <span className="flex items-center px-3 rounded-l-lg border border-r-0 border-border bg-muted text-muted-foreground text-sm">
                /u/
              </span>
              <input
                type="text"
                value={profile.usernameSlug || ""}
                onChange={(e) =>
                  setProfile((prev) => ({
                    ...prev,
                    usernameSlug: e.target.value.toLowerCase().replace(/[^a-z0-9_-]/g, ""),
                  }))
                }
                maxLength={50}
                className="flex-1 px-3 py-2 rounded-r-lg border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder="your-username"
              />
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              3-50 characters, lowercase letters, numbers, underscores, or hyphens
            </p>
          </div>

          {/* Bio */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Bio
            </label>
            <textarea
              value={profile.bio || ""}
              onChange={(e) =>
                setProfile((prev) => ({ ...prev, bio: e.target.value }))
              }
              maxLength={500}
              rows={3}
              className="w-full px-3 py-2 rounded-lg border border-border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary resize-none"
              placeholder="Tell others about yourself..."
            />
            <p className="text-xs text-muted-foreground mt-1">
              {profile.bio?.length || 0}/500 characters
            </p>
          </div>

          {/* Privacy Toggles */}
          <div className="space-y-3">
            <ToggleSwitch
              label="Public Profile"
              description="Allow others to view your profile"
              checked={profile.isPublic}
              onChange={(checked) =>
                setProfile((prev) => ({ ...prev, isPublic: checked }))
              }
            />
            <ToggleSwitch
              label="Show Stats"
              description="Display your gaming statistics"
              checked={profile.showStats}
              onChange={(checked) =>
                setProfile((prev) => ({ ...prev, showStats: checked }))
              }
            />
            <ToggleSwitch
              label="Show Activity"
              description="Display your recent activity"
              checked={profile.showActivity}
              onChange={(checked) =>
                setProfile((prev) => ({ ...prev, showActivity: checked }))
              }
            />
          </div>
        </div>
      </div>

      {/* Featured Achievements */}
      {achievements.length > 0 && (
        <div className="rounded-xl border border-border bg-card p-6">
          <h2 className="text-lg font-semibold text-foreground mb-2">
            Featured Achievements
          </h2>
          <p className="text-sm text-muted-foreground mb-4">
            Select up to 6 achievements to showcase on your profile
          </p>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {achievements.map((achievement) => {
              const isFeatured = profile.featuredAchievements?.includes(achievement.id);
              return (
                <button
                  key={achievement.id}
                  onClick={() => toggleFeaturedAchievement(achievement.id)}
                  className={`flex items-center gap-3 p-3 rounded-lg border transition-colors text-left ${
                    isFeatured
                      ? "border-primary bg-primary/10"
                      : "border-border hover:bg-muted"
                  }`}
                >
                  <div
                    className={`flex h-8 w-8 items-center justify-center rounded-full ${getRarityColor(
                      achievement.rarity
                    )}`}
                  >
                    {achievement.icon ? (
                      <span>{achievement.icon}</span>
                    ) : (
                      <Icons.Award className="h-4 w-4" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-foreground text-sm truncate">
                      {achievement.name}
                    </p>
                    <p className="text-xs text-muted-foreground capitalize">
                      {achievement.rarity}
                    </p>
                  </div>
                  {isFeatured && <Icons.Check className="h-4 w-4 text-primary" />}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Save Button */}
      <div className="flex items-center justify-between">
        {message && (
          <div
            className={`flex items-center gap-2 text-sm ${
              message.type === "success" ? "text-green-500" : "text-red-500"
            }`}
          >
            {message.type === "success" ? (
              <Icons.CheckCircle className="h-4 w-4" />
            ) : (
              <Icons.AlertCircle className="h-4 w-4" />
            )}
            {message.text}
          </div>
        )}
        <div className="ml-auto">
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="flex items-center gap-2 px-6 py-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 text-sm font-medium transition-colors disabled:opacity-50"
          >
            {isSaving ? (
              <Icons.Spinner className="h-4 w-4 animate-spin" />
            ) : (
              <Icons.Save className="h-4 w-4" />
            )}
            Save Changes
          </button>
        </div>
      </div>
    </div>
  );
}

function ToggleSwitch({
  label,
  description,
  checked,
  onChange,
}: {
  label: string;
  description: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between p-3 rounded-lg border border-border">
      <div>
        <p className="font-medium text-foreground text-sm">{label}</p>
        <p className="text-xs text-muted-foreground">{description}</p>
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
          checked ? "bg-primary" : "bg-muted"
        }`}
      >
        <span
          className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
            checked ? "translate-x-6" : "translate-x-1"
          }`}
        />
      </button>
    </div>
  );
}

function getRarityColor(rarity: string | null): string {
  switch (rarity) {
    case "legendary":
      return "bg-orange-500/20 text-orange-500";
    case "epic":
      return "bg-purple-500/20 text-purple-500";
    case "rare":
      return "bg-blue-500/20 text-blue-500";
    case "uncommon":
      return "bg-green-500/20 text-green-500";
    default:
      return "bg-muted text-muted-foreground";
  }
}

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Icons } from "@/components/icons";
import type { GamehubAnnouncement } from "@/lib/db/schema";

interface AnnouncementsManagerProps {
  initialAnnouncements: GamehubAnnouncement[];
}

export function AnnouncementsManager({
  initialAnnouncements,
}: AnnouncementsManagerProps) {
  const router = useRouter();
  const [announcements, setAnnouncements] = useState(initialAnnouncements);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Form state
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [category, setCategory] = useState<string>("");
  const [isPinned, setIsPinned] = useState(false);
  const [isActive, setIsActive] = useState(true);

  function resetForm() {
    setTitle("");
    setContent("");
    setCategory("");
    setIsPinned(false);
    setIsActive(true);
    setEditingId(null);
    setShowForm(false);
  }

  function startEdit(announcement: GamehubAnnouncement) {
    setTitle(announcement.title);
    setContent(announcement.content);
    setCategory(announcement.category || "");
    setIsPinned(announcement.isPinned);
    setIsActive(announcement.isActive);
    setEditingId(announcement.id);
    setShowForm(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setIsLoading(true);

    try {
      const payload = {
        title,
        content,
        category: category || null,
        isPinned,
        isActive,
      };

      const url = editingId
        ? `/api/admin/gamehub/announcements/${editingId}`
        : "/api/admin/gamehub/announcements";

      const response = await fetch(url, {
        method: editingId ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || "Failed to save announcement");
      }

      resetForm();
      router.refresh();
    } catch (error) {
      console.error("Failed to save announcement:", error);
      alert(error instanceof Error ? error.message : "Failed to save announcement");
    } finally {
      setIsLoading(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Are you sure you want to delete this announcement?")) return;

    setIsLoading(true);
    try {
      const response = await fetch(`/api/admin/gamehub/announcements/${id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Failed to delete announcement");
      }

      setAnnouncements((prev) => prev.filter((a) => a.id !== id));
      router.refresh();
    } catch (error) {
      console.error("Failed to delete announcement:", error);
    } finally {
      setIsLoading(false);
    }
  }

  async function handleTogglePin(announcement: GamehubAnnouncement) {
    try {
      const response = await fetch(
        `/api/admin/gamehub/announcements/${announcement.id}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ isPinned: !announcement.isPinned }),
        }
      );

      if (!response.ok) {
        throw new Error("Failed to update announcement");
      }

      router.refresh();
    } catch (error) {
      console.error("Failed to toggle pin:", error);
    }
  }

  async function handleToggleActive(announcement: GamehubAnnouncement) {
    try {
      const response = await fetch(
        `/api/admin/gamehub/announcements/${announcement.id}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ isActive: !announcement.isActive }),
        }
      );

      if (!response.ok) {
        throw new Error("Failed to update announcement");
      }

      router.refresh();
    } catch (error) {
      console.error("Failed to toggle active:", error);
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-foreground">Announcements</h2>
        <button
          onClick={() => {
            resetForm();
            setShowForm(true);
          }}
          className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
        >
          <Icons.Plus className="h-4 w-4" />
          Add Announcement
        </button>
      </div>

      {/* Form */}
      {showForm && (
        <div className="rounded-xl border border-border bg-card p-6">
          <h3 className="text-lg font-semibold text-foreground mb-4">
            {editingId ? "Edit Announcement" : "New Announcement"}
          </h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Title
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full rounded-lg border border-border bg-background px-4 py-2 text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Content
              </label>
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                className="w-full rounded-lg border border-border bg-background px-4 py-2 text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary resize-none"
                rows={4}
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Category
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full rounded-lg border border-border bg-background px-4 py-2 text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              >
                <option value="">General</option>
                <option value="r6">Rainbow Six Siege</option>
                <option value="minecraft">Minecraft</option>
              </select>
            </div>

            <div className="flex items-center gap-6">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isPinned}
                  onChange={(e) => setIsPinned(e.target.checked)}
                  className="h-4 w-4 rounded border-border text-primary focus:ring-primary"
                />
                <span className="text-sm text-foreground">Pinned</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isActive}
                  onChange={(e) => setIsActive(e.target.checked)}
                  className="h-4 w-4 rounded border-border text-primary focus:ring-primary"
                />
                <span className="text-sm text-foreground">Active</span>
              </label>
            </div>

            <div className="flex items-center gap-3 pt-4">
              <button
                type="submit"
                disabled={isLoading}
                className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
              >
                {isLoading ? (
                  <Icons.Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Icons.Check className="h-4 w-4" />
                )}
                {editingId ? "Update" : "Create"}
              </button>
              <button
                type="button"
                onClick={resetForm}
                className="rounded-lg border border-border px-4 py-2 text-sm font-medium text-foreground hover:bg-accent"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Announcements List */}
      {announcements.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border p-12 text-center">
          <Icons.Info className="mx-auto h-12 w-12 text-muted-foreground" />
          <h3 className="mt-4 text-lg font-medium text-foreground">
            No announcements yet
          </h3>
          <p className="mt-2 text-muted-foreground">
            Create your first announcement to show on the GameHub blackboard
          </p>
        </div>
      ) : (
        <div className="rounded-xl border border-border bg-card overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border bg-muted/50">
                <th className="px-6 py-4 text-left text-sm font-medium text-muted-foreground">
                  Announcement
                </th>
                <th className="px-6 py-4 text-left text-sm font-medium text-muted-foreground">
                  Category
                </th>
                <th className="px-6 py-4 text-left text-sm font-medium text-muted-foreground">
                  Status
                </th>
                <th className="px-6 py-4 text-left text-sm font-medium text-muted-foreground">
                  Created
                </th>
                <th className="px-6 py-4 text-right text-sm font-medium text-muted-foreground">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {announcements.map((announcement) => (
                <tr
                  key={announcement.id}
                  className="border-b border-border last:border-0"
                >
                  <td className="px-6 py-4">
                    <div className="flex items-start gap-3">
                      {announcement.isPinned && (
                        <Icons.TrendingUp className="h-4 w-4 text-yellow-500 mt-1 flex-shrink-0" />
                      )}
                      <div>
                        <p className="font-medium text-foreground">
                          {announcement.title}
                        </p>
                        <p className="text-sm text-muted-foreground line-clamp-1">
                          {announcement.content}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="rounded-full bg-muted px-2.5 py-0.5 text-xs font-medium text-muted-foreground">
                      {announcement.category || "general"}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
                        announcement.isActive
                          ? "bg-green-500/10 text-green-500"
                          : "bg-muted text-muted-foreground"
                      }`}
                    >
                      {announcement.isActive ? "Active" : "Inactive"}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-muted-foreground">
                    {new Date(announcement.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => handleTogglePin(announcement)}
                        title={announcement.isPinned ? "Unpin" : "Pin"}
                        className={`rounded p-1.5 ${
                          announcement.isPinned
                            ? "bg-yellow-500/10 text-yellow-500"
                            : "text-muted-foreground hover:bg-accent"
                        }`}
                      >
                        <Icons.TrendingUp className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleToggleActive(announcement)}
                        title={announcement.isActive ? "Deactivate" : "Activate"}
                        className={`rounded p-1.5 ${
                          announcement.isActive
                            ? "bg-green-500/10 text-green-500"
                            : "text-muted-foreground hover:bg-accent"
                        }`}
                      >
                        {announcement.isActive ? (
                          <Icons.Eye className="h-4 w-4" />
                        ) : (
                          <Icons.EyeOff className="h-4 w-4" />
                        )}
                      </button>
                      <button
                        onClick={() => startEdit(announcement)}
                        className="rounded p-1.5 text-muted-foreground hover:bg-accent hover:text-foreground"
                      >
                        <Icons.Pencil className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(announcement.id)}
                        className="rounded p-1.5 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                      >
                        <Icons.Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

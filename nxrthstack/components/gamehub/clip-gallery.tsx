"use client";

import { useState, useEffect } from "react";
import { Icons } from "@/components/icons";
import { cn } from "@/lib/utils";
import Link from "next/link";

interface Clip {
  id: string;
  title: string;
  description: string | null;
  game: string;
  category: string | null;
  blobUrl: string;
  thumbnailUrl: string | null;
  durationSeconds: number | null;
  viewCount: number;
  isFeatured: boolean;
  createdAt: Date;
  userId: string;
  userName: string | null;
  userDiscordAvatar: string | null;
  likeCount: number;
  commentCount: number;
}

interface ClipGalleryProps {
  currentUserId: string;
}

const games = [
  { value: "", label: "All Games" },
  { value: "r6", label: "Rainbow Six" },
  { value: "minecraft", label: "Minecraft" },
  { value: "pokemon", label: "Pokemon" },
  { value: "valorant", label: "Valorant" },
  { value: "other", label: "Other" },
];

const categories = [
  { value: "", label: "All Categories" },
  { value: "funny", label: "Funny" },
  { value: "clutch", label: "Clutch" },
  { value: "fail", label: "Fail" },
  { value: "tutorial", label: "Tutorial" },
  { value: "highlight", label: "Highlight" },
];

const gameColors: Record<string, string> = {
  r6: "bg-orange-500/10 text-orange-500",
  minecraft: "bg-green-500/10 text-green-500",
  pokemon: "bg-yellow-500/10 text-yellow-500",
  valorant: "bg-red-500/10 text-red-500",
  other: "bg-primary/10 text-primary",
};

function formatDuration(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, "0")}`;
}

export function ClipGallery({ currentUserId }: ClipGalleryProps) {
  const [clips, setClips] = useState<Clip[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [game, setGame] = useState("");
  const [category, setCategory] = useState("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [showMyClips, setShowMyClips] = useState(false);
  const [viewMode, setViewMode] = useState<"grid" | "feed">("grid");

  const fetchClips = async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      params.set("page", page.toString());
      params.set("limit", "12");
      if (game) params.set("game", game);
      if (category) params.set("category", category);
      if (search) params.set("search", search);
      if (showMyClips) params.set("userId", currentUserId);

      const res = await fetch(`/api/clips?${params}`);
      const data = await res.json();

      if (res.ok) {
        setClips(data.clips);
        setTotalPages(data.pagination.totalPages);
      }
    } catch (error) {
      console.error("Failed to fetch clips:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchClips();
  }, [game, category, page, showMyClips]);

  useEffect(() => {
    const debounce = setTimeout(() => {
      if (page === 1) {
        fetchClips();
      } else {
        setPage(1);
      }
    }, 300);
    return () => clearTimeout(debounce);
  }, [search]);

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="rounded-xl border border-border bg-card p-4">
        <div className="flex flex-wrap gap-4">
          {/* Search */}
          <div className="relative flex-1 min-w-[200px]">
            <Icons.Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search clips..."
              className="w-full pl-10 pr-4 py-2 rounded-lg border border-input bg-background text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
          </div>

          {/* Game Filter */}
          <select
            value={game}
            onChange={(e) => {
              setGame(e.target.value);
              setPage(1);
            }}
            className="px-4 py-2 rounded-lg border border-input bg-background text-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
          >
            {games.map((g) => (
              <option key={g.value} value={g.value}>
                {g.label}
              </option>
            ))}
          </select>

          {/* Category Filter */}
          <select
            value={category}
            onChange={(e) => {
              setCategory(e.target.value);
              setPage(1);
            }}
            className="px-4 py-2 rounded-lg border border-input bg-background text-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
          >
            {categories.map((c) => (
              <option key={c.value} value={c.value}>
                {c.label}
              </option>
            ))}
          </select>

          {/* My Clips Toggle */}
          <button
            onClick={() => {
              setShowMyClips(!showMyClips);
              setPage(1);
            }}
            className={cn(
              "px-4 py-2 rounded-lg border text-sm font-medium transition-colors",
              showMyClips
                ? "border-primary bg-primary/10 text-primary"
                : "border-input bg-background text-muted-foreground hover:text-foreground"
            )}
          >
            My Clips
          </button>

          {/* View Mode Toggle */}
          <div className="flex items-center rounded-lg border border-input overflow-hidden">
            <button
              onClick={() => setViewMode("grid")}
              className={cn(
                "p-2 transition-colors",
                viewMode === "grid"
                  ? "bg-primary/10 text-primary"
                  : "bg-background text-muted-foreground hover:text-foreground"
              )}
              title="Grid view"
            >
              <Icons.LayoutGrid className="h-4 w-4" />
            </button>
            <button
              onClick={() => setViewMode("feed")}
              className={cn(
                "p-2 transition-colors",
                viewMode === "feed"
                  ? "bg-primary/10 text-primary"
                  : "bg-background text-muted-foreground hover:text-foreground"
              )}
              title="Feed view"
            >
              <Icons.List className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Clips */}
      {isLoading ? (
        viewMode === "grid" ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="rounded-xl border border-border bg-card overflow-hidden animate-pulse">
                <div className="aspect-video bg-muted" />
                <div className="p-4 space-y-2">
                  <div className="h-4 bg-muted rounded w-3/4" />
                  <div className="h-3 bg-muted rounded w-1/2" />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="max-w-2xl mx-auto space-y-6">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="rounded-xl border border-border bg-card overflow-hidden animate-pulse">
                <div className="flex items-center gap-3 p-4">
                  <div className="h-10 w-10 rounded-full bg-muted" />
                  <div className="space-y-1.5 flex-1">
                    <div className="h-3.5 bg-muted rounded w-1/4" />
                    <div className="h-3 bg-muted rounded w-1/6" />
                  </div>
                </div>
                <div className="aspect-video bg-muted" />
                <div className="p-4 space-y-2">
                  <div className="h-4 bg-muted rounded w-3/4" />
                  <div className="h-3 bg-muted rounded w-full" />
                  <div className="h-3 bg-muted rounded w-1/2" />
                </div>
              </div>
            ))}
          </div>
        )
      ) : clips.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border p-12 text-center">
          <Icons.Tv className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium text-foreground mb-2">
            No clips found
          </h3>
          <p className="text-muted-foreground mb-4">
            {showMyClips
              ? "You haven't uploaded any clips yet."
              : "No clips match your filters."}
          </p>
          <Link
            href="/dashboard/gamehub/clips/upload"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 text-sm font-medium transition-colors"
          >
            <Icons.Upload className="h-4 w-4" />
            Upload a Clip
          </Link>
        </div>
      ) : viewMode === "grid" ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {clips.map((clip) => (
            <Link
              key={clip.id}
              href={`/dashboard/gamehub/clips/${clip.id}`}
              className="group rounded-xl border border-border bg-card overflow-hidden hover:border-primary/50 transition-colors"
            >
              {/* Thumbnail */}
              <div className="relative aspect-video bg-muted">
                {clip.thumbnailUrl ? (
                  <img
                    src={clip.thumbnailUrl}
                    alt={clip.title}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="h-full w-full flex items-center justify-center">
                    <Icons.Tv className="h-12 w-12 text-muted-foreground/50" />
                  </div>
                )}
                {/* Duration */}
                {clip.durationSeconds && (
                  <div className="absolute bottom-2 right-2 px-1.5 py-0.5 rounded bg-black/75 text-white text-xs font-medium">
                    {formatDuration(clip.durationSeconds)}
                  </div>
                )}
                {/* Featured Badge */}
                {clip.isFeatured && (
                  <div className="absolute top-2 left-2 px-2 py-0.5 rounded-full bg-yellow-500/90 text-black text-xs font-medium flex items-center gap-1">
                    <Icons.Star className="h-3 w-3" />
                    Featured
                  </div>
                )}
                {/* Play Overlay */}
                <div className="absolute inset-0 flex items-center justify-center bg-black/0 group-hover:bg-black/30 transition-colors">
                  <div className="h-12 w-12 rounded-full bg-primary/90 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <Icons.Tv className="h-5 w-5 text-primary-foreground ml-0.5" />
                  </div>
                </div>
              </div>

              {/* Info */}
              <div className="p-3">
                <h3 className="font-medium text-foreground truncate group-hover:text-primary transition-colors">
                  {clip.title}
                </h3>
                <div className="flex items-center gap-2 mt-1">
                  <span
                    className={cn(
                      "text-xs font-medium px-1.5 py-0.5 rounded",
                      gameColors[clip.game] || gameColors.other
                    )}
                  >
                    {clip.game.toUpperCase()}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {clip.userName || "Anonymous"}
                  </span>
                </div>
                <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Icons.Eye className="h-3 w-3" />
                    {clip.viewCount.toLocaleString()}
                  </span>
                  <span className="flex items-center gap-1">
                    <Icons.Heart className="h-3 w-3" />
                    {clip.likeCount}
                  </span>
                  <span className="flex items-center gap-1">
                    <Icons.MessageCircle className="h-3 w-3" />
                    {clip.commentCount}
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      ) : (
        /* Feed View */
        <div className="max-w-2xl mx-auto space-y-6">
          {clips.map((clip) => (
            <Link
              key={clip.id}
              href={`/dashboard/gamehub/clips/${clip.id}`}
              className="group block rounded-xl border border-border bg-card overflow-hidden hover:border-primary/50 transition-colors"
            >
              {/* User Info Header */}
              <div className="flex items-center gap-3 p-4">
                {clip.userDiscordAvatar ? (
                  <img
                    src={clip.userDiscordAvatar}
                    alt={clip.userName || "User"}
                    className="h-10 w-10 rounded-full"
                  />
                ) : (
                  <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <Icons.User className="h-5 w-5 text-primary" />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-foreground text-sm">
                    {clip.userName || "Anonymous"}
                  </p>
                  <div className="flex items-center gap-2">
                    <span
                      className={cn(
                        "text-xs font-medium px-1.5 py-0.5 rounded",
                        gameColors[clip.game] || gameColors.other
                      )}
                    >
                      {clip.game.toUpperCase()}
                    </span>
                    {clip.category && (
                      <span className="text-xs text-muted-foreground">
                        {clip.category.charAt(0).toUpperCase() + clip.category.slice(1)}
                      </span>
                    )}
                    <span className="text-xs text-muted-foreground">
                      {new Date(clip.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>
                {clip.isFeatured && (
                  <div className="px-2 py-0.5 rounded-full bg-yellow-500/90 text-black text-xs font-medium flex items-center gap-1">
                    <Icons.Star className="h-3 w-3" />
                    Featured
                  </div>
                )}
              </div>

              {/* Thumbnail */}
              <div className="relative aspect-video bg-muted">
                {clip.thumbnailUrl ? (
                  <img
                    src={clip.thumbnailUrl}
                    alt={clip.title}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="h-full w-full flex items-center justify-center">
                    <Icons.Tv className="h-16 w-16 text-muted-foreground/50" />
                  </div>
                )}
                {clip.durationSeconds && (
                  <div className="absolute bottom-2 right-2 px-1.5 py-0.5 rounded bg-black/75 text-white text-xs font-medium">
                    {formatDuration(clip.durationSeconds)}
                  </div>
                )}
                {/* Play Overlay */}
                <div className="absolute inset-0 flex items-center justify-center bg-black/0 group-hover:bg-black/30 transition-colors">
                  <div className="h-14 w-14 rounded-full bg-primary/90 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <Icons.Tv className="h-6 w-6 text-primary-foreground ml-0.5" />
                  </div>
                </div>
              </div>

              {/* Info */}
              <div className="p-4">
                <h3 className="font-semibold text-foreground text-lg group-hover:text-primary transition-colors">
                  {clip.title}
                </h3>
                {clip.description && (
                  <p className="mt-1 text-sm text-muted-foreground line-clamp-2">
                    {clip.description}
                  </p>
                )}
                <div className="flex items-center gap-4 mt-3 text-sm text-muted-foreground">
                  <span className="flex items-center gap-1.5">
                    <Icons.Eye className="h-4 w-4" />
                    {clip.viewCount.toLocaleString()}
                  </span>
                  <span className="flex items-center gap-1.5">
                    <Icons.Heart className="h-4 w-4" />
                    {clip.likeCount}
                  </span>
                  <span className="flex items-center gap-1.5">
                    <Icons.MessageCircle className="h-4 w-4" />
                    {clip.commentCount}
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <button
            onClick={() => setPage(Math.max(1, page - 1))}
            disabled={page === 1}
            className="p-2 rounded-lg border border-input bg-background text-foreground hover:bg-muted disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Icons.ChevronLeft className="h-4 w-4" />
          </button>
          <span className="px-4 py-2 text-sm text-muted-foreground">
            Page {page} of {totalPages}
          </span>
          <button
            onClick={() => setPage(Math.min(totalPages, page + 1))}
            disabled={page === totalPages}
            className="p-2 rounded-lg border border-input bg-background text-foreground hover:bg-muted disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Icons.ChevronRight className="h-4 w-4" />
          </button>
        </div>
      )}
    </div>
  );
}

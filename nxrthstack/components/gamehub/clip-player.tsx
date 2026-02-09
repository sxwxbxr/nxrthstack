"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { Icons } from "@/components/icons";
import { cn } from "@/lib/utils";

interface ClipPlayerProps {
  clipId: string;
  blobUrl: string;
  thumbnailUrl: string | null;
  title: string;
  initialLiked: boolean;
  initialLikeCount: number;
  isOwner: boolean;
}

export function ClipPlayer({
  clipId,
  blobUrl,
  thumbnailUrl,
  title,
  initialLiked,
  initialLikeCount,
  isOwner,
}: ClipPlayerProps) {
  const router = useRouter();
  const [hasLiked, setHasLiked] = useState(initialLiked);
  const [likeCount, setLikeCount] = useState(initialLikeCount);
  const [isLiking, setIsLiking] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const hasCountedView = useRef(false);

  const handlePlay = () => {
    if (hasCountedView.current) return;
    hasCountedView.current = true;
    fetch(`/api/clips/${clipId}/view`, { method: "POST" }).catch(() => {});
  };

  const handleLike = async () => {
    if (isLiking) return;

    setIsLiking(true);
    // Optimistic update
    setHasLiked(!hasLiked);
    setLikeCount((prev) => (hasLiked ? prev - 1 : prev + 1));

    try {
      const res = await fetch(`/api/clips/${clipId}/like`, {
        method: "POST",
      });

      if (!res.ok) {
        // Revert on error
        setHasLiked(hasLiked);
        setLikeCount((prev) => (hasLiked ? prev + 1 : prev - 1));
      }
    } catch {
      // Revert on error
      setHasLiked(hasLiked);
      setLikeCount((prev) => (hasLiked ? prev + 1 : prev - 1));
    } finally {
      setIsLiking(false);
    }
  };

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      const res = await fetch(`/api/clips/${clipId}`, {
        method: "DELETE",
      });

      if (res.ok) {
        router.push("/dashboard/gamehub/clips");
      }
    } catch {
      console.error("Failed to delete clip");
    } finally {
      setIsDeleting(false);
      setShowDeleteConfirm(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Video Player */}
      <div className="relative aspect-video overflow-hidden rounded-xl bg-black">
        <video
          src={blobUrl}
          poster={thumbnailUrl || undefined}
          controls
          className="h-full w-full"
          playsInline
          onPlay={handlePlay}
        />
      </div>

      {/* Actions */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {/* Like Button */}
          <button
            onClick={handleLike}
            disabled={isLiking}
            className={cn(
              "inline-flex items-center gap-2 px-4 py-2 rounded-lg border text-sm font-medium transition-colors",
              hasLiked
                ? "border-red-500 bg-red-500/10 text-red-500"
                : "border-border bg-background text-muted-foreground hover:text-foreground hover:border-muted-foreground"
            )}
          >
            <Icons.Heart
              className={cn("h-4 w-4", hasLiked && "fill-current")}
            />
            {likeCount}
          </button>

          {/* Share Button */}
          <button
            onClick={() => {
              navigator.clipboard.writeText(window.location.href);
            }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-border bg-background text-sm font-medium text-muted-foreground hover:text-foreground hover:border-muted-foreground transition-colors"
          >
            <Icons.Link className="h-4 w-4" />
            Share
          </button>
        </div>

        {/* Owner Actions */}
        {isOwner && (
          <div className="relative">
            {showDeleteConfirm ? (
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">Delete?</span>
                <button
                  onClick={handleDelete}
                  disabled={isDeleting}
                  className="px-3 py-1.5 rounded-lg bg-destructive text-destructive-foreground text-sm font-medium hover:bg-destructive/90 disabled:opacity-50"
                >
                  {isDeleting ? "Deleting..." : "Yes"}
                </button>
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  className="px-3 py-1.5 rounded-lg border border-border text-sm font-medium text-muted-foreground hover:text-foreground"
                >
                  No
                </button>
              </div>
            ) : (
              <button
                onClick={() => setShowDeleteConfirm(true)}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-border bg-background text-sm font-medium text-muted-foreground hover:text-destructive hover:border-destructive transition-colors"
              >
                <Icons.Trash2 className="h-4 w-4" />
                Delete
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

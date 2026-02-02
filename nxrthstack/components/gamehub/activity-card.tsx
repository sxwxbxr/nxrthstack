"use client";

import { useState } from "react";
import { Icons } from "@/components/icons";
import type { ActivityWithDetails, ActivityComment } from "@/lib/gamehub/activity";

interface ActivityCardProps {
  activity: ActivityWithDetails;
  currentUserId?: string;
}

const ACTIVITY_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  achievement_unlocked: Icons.Trophy,
  session_joined: Icons.Calendar,
  session_created: Icons.Calendar,
  match_won: Icons.Swords,
  rivalry_update: Icons.Swords,
  clip_uploaded: Icons.Tv,
  friend_added: Icons.Users,
  tournament_won: Icons.Crown,
  shiny_found: Icons.Sparkles,
};

const ACTIVITY_COLORS: Record<string, string> = {
  achievement_unlocked: "text-yellow-500 bg-yellow-500/10",
  session_joined: "text-blue-500 bg-blue-500/10",
  session_created: "text-blue-500 bg-blue-500/10",
  match_won: "text-green-500 bg-green-500/10",
  rivalry_update: "text-purple-500 bg-purple-500/10",
  clip_uploaded: "text-pink-500 bg-pink-500/10",
  friend_added: "text-cyan-500 bg-cyan-500/10",
  tournament_won: "text-orange-500 bg-orange-500/10",
  shiny_found: "text-amber-500 bg-amber-500/10",
};

export function ActivityCard({ activity, currentUserId }: ActivityCardProps) {
  const [liked, setLiked] = useState(activity.isLikedByUser);
  const [likeCount, setLikeCount] = useState(activity.likeCount);
  const [isLiking, setIsLiking] = useState(false);
  const [showComments, setShowComments] = useState(false);
  const [comments, setComments] = useState<ActivityComment[]>([]);
  const [newComment, setNewComment] = useState("");
  const [isLoadingComments, setIsLoadingComments] = useState(false);
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);

  const Icon = ACTIVITY_ICONS[activity.activityType] || Icons.Activity;
  const colorClass = ACTIVITY_COLORS[activity.activityType] || "text-primary bg-primary/10";

  const timeAgo = getTimeAgo(new Date(activity.createdAt));

  const handleLike = async () => {
    if (isLiking || !currentUserId) return;

    setIsLiking(true);
    setLiked(!liked);
    setLikeCount((prev) => (liked ? prev - 1 : prev + 1));

    try {
      const res = await fetch(`/api/gamehub/activity/${activity.id}/like`, {
        method: "POST",
      });

      if (!res.ok) {
        // Revert on failure
        setLiked(liked);
        setLikeCount(likeCount);
      }
    } catch {
      setLiked(liked);
      setLikeCount(likeCount);
    } finally {
      setIsLiking(false);
    }
  };

  const loadComments = async () => {
    if (isLoadingComments) return;

    setIsLoadingComments(true);
    try {
      const res = await fetch(`/api/gamehub/activity/${activity.id}/comments`);
      if (res.ok) {
        const data = await res.json();
        setComments(data.comments);
      }
    } finally {
      setIsLoadingComments(false);
    }
  };

  const handleToggleComments = () => {
    if (!showComments && comments.length === 0) {
      loadComments();
    }
    setShowComments(!showComments);
  };

  const handleSubmitComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim() || isSubmittingComment) return;

    setIsSubmittingComment(true);
    try {
      const res = await fetch(`/api/gamehub/activity/${activity.id}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: newComment.trim() }),
      });

      if (res.ok) {
        const data = await res.json();
        setComments((prev) => [...prev, data.comment]);
        setNewComment("");
      }
    } finally {
      setIsSubmittingComment(false);
    }
  };

  return (
    <div className="rounded-xl border border-border bg-card p-4 hover:border-primary/20 transition-colors">
      {/* Header */}
      <div className="flex items-start gap-3">
        {/* Activity Icon */}
        <div className={`flex h-10 w-10 items-center justify-center rounded-full ${colorClass}`}>
          <Icon className="h-5 w-5" />
        </div>

        <div className="flex-1 min-w-0">
          {/* User & Time */}
          <div className="flex items-center gap-2 mb-1">
            {activity.userAvatar ? (
              <img
                src={activity.userAvatar}
                alt={activity.userName || "User"}
                className="h-5 w-5 rounded-full"
              />
            ) : (
              <div className="h-5 w-5 rounded-full bg-muted flex items-center justify-center text-xs font-medium">
                {(activity.userName || activity.userEmail)[0].toUpperCase()}
              </div>
            )}
            <span className="font-medium text-foreground text-sm">
              {activity.userName || activity.userEmail}
            </span>
            <span className="text-muted-foreground text-xs">{timeAgo}</span>
          </div>

          {/* Title */}
          <p className="text-foreground">{activity.title}</p>

          {/* Description */}
          {activity.description && (
            <p className="text-sm text-muted-foreground mt-1">
              {activity.description}
            </p>
          )}

          {/* Game Tag */}
          {activity.game && (
            <span className="inline-block mt-2 px-2 py-0.5 text-xs rounded-full bg-muted text-muted-foreground">
              {activity.game}
            </span>
          )}
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-4 mt-4 pt-3 border-t border-border">
        <button
          onClick={handleLike}
          disabled={!currentUserId}
          className={`flex items-center gap-1.5 text-sm transition-colors ${
            liked
              ? "text-red-500"
              : "text-muted-foreground hover:text-red-500"
          } ${!currentUserId ? "cursor-not-allowed opacity-50" : ""}`}
        >
          <Icons.Heart className={`h-4 w-4 ${liked ? "fill-current" : ""}`} />
          <span>{likeCount}</span>
        </button>

        <button
          onClick={handleToggleComments}
          className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <Icons.MessageCircle className="h-4 w-4" />
          <span>{activity.commentCount}</span>
        </button>
      </div>

      {/* Comments Section */}
      {showComments && (
        <div className="mt-4 pt-3 border-t border-border space-y-3">
          {isLoadingComments ? (
            <div className="flex items-center justify-center py-4">
              <Icons.Spinner className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <>
              {comments.map((comment) => (
                <div key={comment.id} className="flex gap-2">
                  {comment.userAvatar ? (
                    <img
                      src={comment.userAvatar}
                      alt={comment.userName || "User"}
                      className="h-6 w-6 rounded-full flex-shrink-0"
                    />
                  ) : (
                    <div className="h-6 w-6 rounded-full bg-muted flex items-center justify-center text-xs font-medium flex-shrink-0">
                      {(comment.userName || "U")[0].toUpperCase()}
                    </div>
                  )}
                  <div className="flex-1 bg-muted/50 rounded-lg px-3 py-2">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-sm text-foreground">
                        {comment.userName || "User"}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {getTimeAgo(new Date(comment.createdAt))}
                      </span>
                    </div>
                    <p className="text-sm text-foreground/80">{comment.content}</p>
                  </div>
                </div>
              ))}

              {comments.length === 0 && (
                <p className="text-center text-sm text-muted-foreground py-2">
                  No comments yet
                </p>
              )}

              {/* Comment Input */}
              {currentUserId && (
                <form onSubmit={handleSubmitComment} className="flex gap-2">
                  <input
                    type="text"
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    placeholder="Write a comment..."
                    maxLength={500}
                    className="flex-1 px-3 py-2 rounded-lg border border-border bg-background text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                  <button
                    type="submit"
                    disabled={!newComment.trim() || isSubmittingComment}
                    className="px-3 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isSubmittingComment ? (
                      <Icons.Spinner className="h-4 w-4 animate-spin" />
                    ) : (
                      <Icons.Send className="h-4 w-4" />
                    )}
                  </button>
                </form>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}

function getTimeAgo(date: Date): string {
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000);

  if (seconds < 60) return "just now";
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`;

  return date.toLocaleDateString();
}

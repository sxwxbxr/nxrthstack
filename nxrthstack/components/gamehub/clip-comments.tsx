"use client";

import { useState } from "react";
import { Icons } from "@/components/icons";

interface Comment {
  id: string;
  content: string;
  createdAt: Date;
  userId: string;
  userName: string | null;
  userDiscordAvatar: string | null;
}

interface ClipCommentsProps {
  clipId: string;
  initialComments: Comment[];
  commentCount: number;
  currentUserId: string;
}

export function ClipComments({
  clipId,
  initialComments,
  commentCount,
  currentUserId,
}: ClipCommentsProps) {
  const [comments, setComments] = useState<Comment[]>(initialComments);
  const [newComment, setNewComment] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!newComment.trim() || isSubmitting) return;

    setIsSubmitting(true);

    try {
      const res = await fetch(`/api/clips/${clipId}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: newComment.trim() }),
      });

      if (res.ok) {
        const data = await res.json();
        setComments((prev) => [data.comment, ...prev]);
        setNewComment("");
      }
    } catch {
      console.error("Failed to post comment");
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatTimeAgo = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - new Date(date).getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return "just now";
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    return new Date(date).toLocaleDateString();
  };

  return (
    <div className="rounded-xl border border-border bg-card">
      {/* Header */}
      <div className="p-4 border-b border-border">
        <h3 className="font-semibold text-foreground flex items-center gap-2">
          <Icons.MessageCircle className="h-4 w-4" />
          Comments
          <span className="text-muted-foreground font-normal">
            ({commentCount})
          </span>
        </h3>
      </div>

      {/* Comment Form */}
      <form onSubmit={handleSubmit} className="p-4 border-b border-border">
        <textarea
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
          placeholder="Add a comment..."
          maxLength={500}
          rows={2}
          className="w-full px-3 py-2 rounded-lg border border-input bg-background text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 resize-none text-sm"
        />
        <div className="flex items-center justify-between mt-2">
          <span className="text-xs text-muted-foreground">
            {newComment.length}/500
          </span>
          <button
            type="submit"
            disabled={!newComment.trim() || isSubmitting}
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting && (
              <Icons.Loader2 className="h-3 w-3 animate-spin" />
            )}
            Post
          </button>
        </div>
      </form>

      {/* Comments List */}
      <div className="max-h-[400px] overflow-y-auto">
        {comments.length === 0 ? (
          <div className="p-8 text-center">
            <Icons.MessageCircle className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
            <p className="text-sm text-muted-foreground">
              No comments yet. Be the first!
            </p>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {comments.map((comment) => (
              <div key={comment.id} className="p-4">
                <div className="flex items-start gap-3">
                  {comment.userDiscordAvatar ? (
                    <img
                      src={comment.userDiscordAvatar}
                      alt={comment.userName || "User"}
                      className="h-8 w-8 rounded-full shrink-0"
                    />
                  ) : (
                    <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                      <Icons.User className="h-4 w-4 text-primary" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-foreground text-sm">
                        {comment.userName || "Anonymous"}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {formatTimeAgo(comment.createdAt)}
                      </span>
                    </div>
                    <p className="mt-1 text-sm text-foreground whitespace-pre-wrap break-words">
                      {comment.content}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

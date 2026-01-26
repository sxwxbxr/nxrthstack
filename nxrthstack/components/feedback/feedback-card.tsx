"use client";

import { useState } from "react";
import { Icons } from "@/components/icons";

interface FeedbackRequest {
  id: string;
  type: "feature" | "bug";
  title: string;
  description: string;
  status: string;
  priority: string | null;
  category: string | null;
  adminNotes?: string | null;
  createdAt: string;
  updatedAt: string;
  authorId: string;
  authorName: string | null;
  authorEmail: string;
  voteCount: number;
  hasVoted: boolean;
  isOwner: boolean;
}

interface FeedbackCardProps {
  request: FeedbackRequest;
  isAdmin: boolean;
  onVote: () => void;
  onDelete: () => void;
  onStatusUpdate: (status: string) => void;
  onPriorityUpdate: (priority: string | null) => void;
}

const statusConfig: Record<string, { label: string; color: string }> = {
  pending: { label: "Pending", color: "bg-yellow-500/10 text-yellow-500" },
  approved: { label: "Approved", color: "bg-blue-500/10 text-blue-500" },
  in_progress: { label: "In Progress", color: "bg-purple-500/10 text-purple-500" },
  completed: { label: "Completed", color: "bg-green-500/10 text-green-500" },
  rejected: { label: "Rejected", color: "bg-red-500/10 text-red-500" },
};

const priorityConfig: Record<string, { label: string; color: string }> = {
  low: { label: "Low", color: "bg-gray-500/10 text-gray-500" },
  medium: { label: "Medium", color: "bg-blue-500/10 text-blue-500" },
  high: { label: "High", color: "bg-orange-500/10 text-orange-500" },
  critical: { label: "Critical", color: "bg-red-500/10 text-red-500" },
};

const categoryConfig: Record<string, string> = {
  gamehub: "GameHub",
  shop: "Shop",
  dashboard: "Dashboard",
  general: "General",
};

export function FeedbackCard({
  request,
  isAdmin,
  onVote,
  onDelete,
  onStatusUpdate,
  onPriorityUpdate,
}: FeedbackCardProps) {
  const [showAdminPanel, setShowAdminPanel] = useState(false);
  const [expanded, setExpanded] = useState(false);

  const status = statusConfig[request.status] || statusConfig.pending;
  const priority = request.priority ? priorityConfig[request.priority] : null;

  return (
    <div className="rounded-xl border border-border bg-card overflow-hidden">
      <div className="p-4">
        <div className="flex gap-4">
          {/* Vote Button */}
          <div className="flex flex-col items-center gap-1">
            <button
              onClick={onVote}
              className={`flex flex-col items-center gap-1 rounded-lg p-2 transition-colors ${
                request.hasVoted
                  ? "bg-primary/10 text-primary"
                  : "bg-muted text-muted-foreground hover:bg-accent hover:text-foreground"
              }`}
            >
              <Icons.ChevronDown className="h-5 w-5 rotate-180" />
              <span className="text-sm font-semibold">{request.voteCount}</span>
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            {/* Header */}
            <div className="flex flex-wrap items-center gap-2 mb-2">
              {/* Type Badge */}
              <span
                className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                  request.type === "feature"
                    ? "bg-blue-500/10 text-blue-500"
                    : "bg-red-500/10 text-red-500"
                }`}
              >
                {request.type === "feature" ? "Feature" : "Bug"}
              </span>

              {/* Status Badge */}
              <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${status.color}`}>
                {status.label}
              </span>

              {/* Priority Badge */}
              {priority && (
                <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${priority.color}`}>
                  {priority.label}
                </span>
              )}

              {/* Category Badge */}
              {request.category && (
                <span className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
                  {categoryConfig[request.category] || request.category}
                </span>
              )}

              {/* Owner Badge */}
              {request.isOwner && (
                <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs text-primary">
                  Your submission
                </span>
              )}
            </div>

            {/* Title */}
            <h3 className="font-semibold text-foreground mb-1">{request.title}</h3>

            {/* Description */}
            <p className={`text-sm text-muted-foreground ${!expanded && "line-clamp-2"}`}>
              {request.description}
            </p>
            {request.description.length > 150 && (
              <button
                onClick={() => setExpanded(!expanded)}
                className="text-xs text-primary hover:underline mt-1"
              >
                {expanded ? "Show less" : "Show more"}
              </button>
            )}

            {/* Meta */}
            <div className="flex flex-wrap items-center gap-3 mt-3 text-xs text-muted-foreground">
              <span className="flex items-center gap-1">
                <Icons.User className="h-3 w-3" />
                {request.authorName || request.authorEmail}
              </span>
              <span className="flex items-center gap-1">
                <Icons.Clock className="h-3 w-3" />
                {new Date(request.createdAt).toLocaleDateString()}
              </span>
            </div>

            {/* Admin Panel Toggle */}
            {isAdmin && (
              <button
                onClick={() => setShowAdminPanel(!showAdminPanel)}
                className="text-xs text-primary hover:underline mt-2 flex items-center gap-1"
              >
                <Icons.Settings className="h-3 w-3" />
                {showAdminPanel ? "Hide Admin Panel" : "Admin Panel"}
              </button>
            )}
          </div>

          {/* Actions */}
          <div className="flex flex-col gap-2">
            {(request.isOwner || isAdmin) && request.status === "pending" && (
              <button
                onClick={onDelete}
                className="p-2 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                title="Delete"
              >
                <Icons.Trash2 className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Admin Panel */}
      {isAdmin && showAdminPanel && (
        <div className="border-t border-border bg-muted/50 p-4 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            {/* Status */}
            <div>
              <label className="block text-xs font-medium text-foreground mb-1">
                Status
              </label>
              <select
                value={request.status}
                onChange={(e) => onStatusUpdate(e.target.value)}
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none"
              >
                <option value="pending">Pending</option>
                <option value="approved">Approved</option>
                <option value="in_progress">In Progress</option>
                <option value="completed">Completed</option>
                <option value="rejected">Rejected</option>
              </select>
            </div>

            {/* Priority */}
            <div>
              <label className="block text-xs font-medium text-foreground mb-1">
                Priority
              </label>
              <select
                value={request.priority || ""}
                onChange={(e) => onPriorityUpdate(e.target.value || null)}
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none"
              >
                <option value="">No Priority</option>
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="critical">Critical</option>
              </select>
            </div>
          </div>

          {/* Admin Notes */}
          {request.adminNotes && (
            <div>
              <label className="block text-xs font-medium text-foreground mb-1">
                Admin Notes (Private)
              </label>
              <p className="text-sm text-muted-foreground bg-background rounded-lg p-3 border border-border">
                {request.adminNotes}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

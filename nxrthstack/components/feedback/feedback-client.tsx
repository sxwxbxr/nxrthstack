"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Icons } from "@/components/icons";
import { ShimmerButton } from "@/components/ui/shimmer-button";
import { FeedbackForm } from "./feedback-form";
import { FeedbackCard } from "./feedback-card";

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

interface FeedbackClientProps {
  userId: string;
  isAdmin: boolean;
}

type FilterType = "all" | "feature" | "bug";
type FilterStatus = "all" | "pending" | "approved" | "in_progress" | "completed" | "rejected";
type SortBy = "votes" | "newest" | "oldest";

export function FeedbackClient({ userId, isAdmin }: FeedbackClientProps) {
  const router = useRouter();
  const [requests, setRequests] = useState<FeedbackRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [filterType, setFilterType] = useState<FilterType>("all");
  const [filterStatus, setFilterStatus] = useState<FilterStatus>("all");
  const [sortBy, setSortBy] = useState<SortBy>("votes");
  const [searchQuery, setSearchQuery] = useState("");

  const fetchRequests = useCallback(async () => {
    try {
      const response = await fetch("/api/feedback");
      if (response.ok) {
        const data = await response.json();
        setRequests(data.requests);
      }
    } catch (error) {
      console.error("Failed to fetch requests:", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRequests();
  }, [fetchRequests]);

  const handleVote = async (requestId: string) => {
    try {
      const response = await fetch(`/api/feedback/${requestId}/vote`, {
        method: "POST",
      });

      if (response.ok) {
        const data = await response.json();
        setRequests((prev) =>
          prev.map((r) =>
            r.id === requestId
              ? {
                  ...r,
                  hasVoted: data.voted,
                  voteCount: data.voted ? r.voteCount + 1 : r.voteCount - 1,
                }
              : r
          )
        );
      }
    } catch (error) {
      console.error("Failed to vote:", error);
    }
  };

  const handleDelete = async (requestId: string) => {
    if (!confirm("Are you sure you want to delete this?")) return;

    try {
      const response = await fetch(`/api/feedback/${requestId}`, {
        method: "DELETE",
      });

      if (response.ok) {
        setRequests((prev) => prev.filter((r) => r.id !== requestId));
      }
    } catch (error) {
      console.error("Failed to delete:", error);
    }
  };

  const handleStatusUpdate = async (requestId: string, status: string) => {
    try {
      const response = await fetch(`/api/feedback/${requestId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });

      if (response.ok) {
        const data = await response.json();
        setRequests((prev) =>
          prev.map((r) => (r.id === requestId ? { ...r, ...data.request } : r))
        );
      }
    } catch (error) {
      console.error("Failed to update status:", error);
    }
  };

  const handlePriorityUpdate = async (requestId: string, priority: string | null) => {
    try {
      const response = await fetch(`/api/feedback/${requestId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ priority }),
      });

      if (response.ok) {
        const data = await response.json();
        setRequests((prev) =>
          prev.map((r) => (r.id === requestId ? { ...r, ...data.request } : r))
        );
      }
    } catch (error) {
      console.error("Failed to update priority:", error);
    }
  };

  // Filter and sort requests
  const filteredRequests = requests
    .filter((r) => {
      if (filterType !== "all" && r.type !== filterType) return false;
      if (filterStatus !== "all" && r.status !== filterStatus) return false;
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        return (
          r.title.toLowerCase().includes(query) ||
          r.description.toLowerCase().includes(query)
        );
      }
      return true;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case "votes":
          return b.voteCount - a.voteCount;
        case "newest":
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        case "oldest":
          return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
        default:
          return 0;
      }
    });

  const stats = {
    total: requests.length,
    features: requests.filter((r) => r.type === "feature").length,
    bugs: requests.filter((r) => r.type === "bug").length,
    pending: requests.filter((r) => r.status === "pending").length,
    inProgress: requests.filter((r) => r.status === "in_progress").length,
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Icons.Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
        <div className="rounded-xl border border-border bg-card p-4">
          <p className="text-sm text-muted-foreground">Total</p>
          <p className="text-2xl font-bold text-foreground">{stats.total}</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-4">
          <p className="text-sm text-muted-foreground">Features</p>
          <p className="text-2xl font-bold text-blue-500">{stats.features}</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-4">
          <p className="text-sm text-muted-foreground">Bugs</p>
          <p className="text-2xl font-bold text-red-500">{stats.bugs}</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-4">
          <p className="text-sm text-muted-foreground">Pending</p>
          <p className="text-2xl font-bold text-yellow-500">{stats.pending}</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-4">
          <p className="text-sm text-muted-foreground">In Progress</p>
          <p className="text-2xl font-bold text-green-500">{stats.inProgress}</p>
        </div>
      </div>

      {/* Actions & Filters */}
      <div className="flex flex-wrap items-center gap-4">
        <ShimmerButton onClick={() => setShowForm(!showForm)} className="gap-2">
          <Icons.Plus className="h-4 w-4" />
          {showForm ? "Cancel" : "Submit Feedback"}
        </ShimmerButton>

        {/* Search */}
        <div className="relative flex-1 min-w-[200px]">
          <Icons.Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search..."
            className="w-full rounded-lg border border-border bg-background pl-10 pr-4 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none"
          />
        </div>

        {/* Type Filter */}
        <select
          value={filterType}
          onChange={(e) => setFilterType(e.target.value as FilterType)}
          className="rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none"
        >
          <option value="all">All Types</option>
          <option value="feature">Features</option>
          <option value="bug">Bugs</option>
        </select>

        {/* Status Filter */}
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value as FilterStatus)}
          className="rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none"
        >
          <option value="all">All Statuses</option>
          <option value="pending">Pending</option>
          <option value="approved">Approved</option>
          <option value="in_progress">In Progress</option>
          <option value="completed">Completed</option>
          <option value="rejected">Rejected</option>
        </select>

        {/* Sort */}
        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value as SortBy)}
          className="rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none"
        >
          <option value="votes">Most Votes</option>
          <option value="newest">Newest</option>
          <option value="oldest">Oldest</option>
        </select>
      </div>

      {/* Submission Form */}
      {showForm && (
        <FeedbackForm
          onSuccess={() => {
            setShowForm(false);
            fetchRequests();
          }}
          onCancel={() => setShowForm(false)}
        />
      )}

      {/* Request List */}
      <div className="space-y-4">
        {filteredRequests.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border bg-card p-8 text-center">
            <Icons.Message className="mx-auto h-12 w-12 text-muted-foreground" />
            <h3 className="mt-4 text-lg font-medium text-foreground">
              No Feedback Found
            </h3>
            <p className="mt-2 text-muted-foreground">
              {requests.length === 0
                ? "Be the first to submit feedback!"
                : "Try adjusting your filters."}
            </p>
          </div>
        ) : (
          filteredRequests.map((request) => (
            <FeedbackCard
              key={request.id}
              request={request}
              isAdmin={isAdmin}
              onVote={() => handleVote(request.id)}
              onDelete={() => handleDelete(request.id)}
              onStatusUpdate={(status) => handleStatusUpdate(request.id, status)}
              onPriorityUpdate={(priority) => handlePriorityUpdate(request.id, priority)}
            />
          ))
        )}
      </div>
    </div>
  );
}

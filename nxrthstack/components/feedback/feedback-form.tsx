"use client";

import { useState } from "react";
import { Icons } from "@/components/icons";
import { ShimmerButton } from "@/components/ui/shimmer-button";

interface FeedbackFormProps {
  onSuccess: () => void;
  onCancel: () => void;
}

type FeedbackType = "feature" | "bug";
type Category = "gamehub" | "shop" | "dashboard" | "general";

export function FeedbackForm({ onSuccess, onCancel }: FeedbackFormProps) {
  const [type, setType] = useState<FeedbackType>("feature");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState<Category>("general");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type, title, description, category }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to submit feedback");
      }

      onSuccess();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to submit feedback");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="rounded-xl border border-border bg-card p-6">
      <h3 className="text-lg font-semibold text-foreground mb-4">
        Submit Feedback
      </h3>
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Type Selection */}
        <div>
          <label className="block text-sm font-medium text-foreground mb-2">
            Type
          </label>
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setType("feature")}
              className={`rounded-lg border p-4 text-center transition-all ${
                type === "feature"
                  ? "border-blue-500 bg-blue-500/10 text-blue-500"
                  : "border-border bg-background text-foreground hover:border-blue-500/50"
              }`}
            >
              <Icons.Sparkles className="h-6 w-6 mx-auto mb-2" />
              <p className="font-medium">Feature Idea</p>
              <p className="text-xs text-muted-foreground mt-1">
                Suggest a new feature
              </p>
            </button>
            <button
              type="button"
              onClick={() => setType("bug")}
              className={`rounded-lg border p-4 text-center transition-all ${
                type === "bug"
                  ? "border-red-500 bg-red-500/10 text-red-500"
                  : "border-border bg-background text-foreground hover:border-red-500/50"
              }`}
            >
              <Icons.AlertCircle className="h-6 w-6 mx-auto mb-2" />
              <p className="font-medium">Bug Report</p>
              <p className="text-xs text-muted-foreground mt-1">
                Report an issue
              </p>
            </button>
          </div>
        </div>

        {/* Category */}
        <div>
          <label className="block text-sm font-medium text-foreground mb-2">
            Category
          </label>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value as Category)}
            className="w-full rounded-lg border border-border bg-background px-4 py-2 text-foreground focus:border-primary focus:outline-none"
          >
            <option value="general">General</option>
            <option value="gamehub">GameHub</option>
            <option value="shop">Shop</option>
            <option value="dashboard">Dashboard</option>
          </select>
        </div>

        {/* Title */}
        <div>
          <label className="block text-sm font-medium text-foreground mb-2">
            Title
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder={
              type === "feature"
                ? "e.g., Add dark mode support for..."
                : "e.g., Button not working when..."
            }
            className="w-full rounded-lg border border-border bg-background px-4 py-2 text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none"
            minLength={5}
            maxLength={200}
            required
          />
          <p className="text-xs text-muted-foreground mt-1">
            {title.length}/200 characters
          </p>
        </div>

        {/* Description */}
        <div>
          <label className="block text-sm font-medium text-foreground mb-2">
            Description
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder={
              type === "feature"
                ? "Describe the feature you'd like to see and why it would be useful..."
                : "Describe the bug, steps to reproduce, and expected vs actual behavior..."
            }
            className="w-full rounded-lg border border-border bg-background px-4 py-3 text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none resize-none"
            rows={4}
            minLength={20}
            maxLength={2000}
            required
          />
          <p className="text-xs text-muted-foreground mt-1">
            {description.length}/2000 characters (min 20)
          </p>
        </div>

        {/* Error */}
        {error && (
          <p className="text-sm text-destructive flex items-center gap-2">
            <Icons.AlertCircle className="h-4 w-4" />
            {error}
          </p>
        )}

        {/* Actions */}
        <div className="flex justify-end gap-3">
          <button
            type="button"
            onClick={onCancel}
            className="rounded-lg border border-border bg-background px-4 py-2 text-sm font-medium text-foreground hover:bg-accent"
          >
            Cancel
          </button>
          <ShimmerButton type="submit" disabled={isLoading}>
            {isLoading ? (
              <>
                <Icons.Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Submitting...
              </>
            ) : (
              <>
                <Icons.Check className="h-4 w-4 mr-2" />
                Submit Feedback
              </>
            )}
          </ShimmerButton>
        </div>
      </form>
    </div>
  );
}

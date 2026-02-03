"use client";

import { useState } from "react";
import { motion } from "motion/react";
import { Icons } from "@/components/icons";
import { ShimmerButton } from "@/components/ui/shimmer-button";

interface ProfileStepProps {
  userId: string;
  onNext: () => void;
}

export function ProfileStep({ userId, onNext }: ProfileStepProps) {
  const [displayName, setDisplayName] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!displayName.trim()) {
      onNext(); // Skip if no name entered
      return;
    }

    setIsLoading(true);
    try {
      // Update the user profile
      await fetch("/api/user/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: displayName.trim() }),
      });
      onNext();
    } catch (error) {
      console.error("Failed to update profile:", error);
      onNext(); // Continue anyway
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring" }}
          className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-primary/10"
        >
          <Icons.User className="h-10 w-10 text-primary" />
        </motion.div>

        <h2 className="text-2xl font-bold text-foreground">
          Set Up Your Profile
        </h2>
        <p className="text-muted-foreground max-w-md mx-auto">
          Choose a display name that other players will see. You can always change this later in settings.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label
            htmlFor="displayName"
            className="block text-sm font-medium text-foreground mb-2"
          >
            Display Name
          </label>
          <input
            id="displayName"
            type="text"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            placeholder="Enter your gamer tag..."
            maxLength={30}
            className="w-full rounded-lg border border-input bg-background px-4 py-3 text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
          />
          <p className="mt-1 text-xs text-muted-foreground">
            This will be visible on leaderboards and to other players
          </p>
        </div>

        <div className="pt-2">
          <ShimmerButton
            type="submit"
            disabled={isLoading}
            className="w-full"
          >
            {isLoading ? (
              <>
                <Icons.Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                Continue
                <Icons.ArrowRight className="ml-2 h-4 w-4" />
              </>
            )}
          </ShimmerButton>
        </div>
      </form>
    </div>
  );
}

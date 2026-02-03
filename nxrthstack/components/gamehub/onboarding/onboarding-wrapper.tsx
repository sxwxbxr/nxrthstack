"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { OnboardingModal } from "./onboarding-modal";

interface OnboardingWrapperProps {
  userId: string;
  userName: string | null;
  hasDiscord: boolean;
  showOnboarding: boolean;
}

export function OnboardingWrapper({
  userId,
  userName,
  hasDiscord,
  showOnboarding,
}: OnboardingWrapperProps) {
  const [isComplete, setIsComplete] = useState(!showOnboarding);
  const router = useRouter();

  if (isComplete) return null;

  return (
    <OnboardingModal
      userId={userId}
      userName={userName}
      hasDiscord={hasDiscord}
      onComplete={() => {
        setIsComplete(true);
        router.refresh();
      }}
    />
  );
}

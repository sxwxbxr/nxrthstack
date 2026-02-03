"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Icons } from "@/components/icons";
import { WelcomeStep } from "./steps/welcome-step";
import { FeaturesStep } from "./steps/features-step";
import { DiscordStep } from "./steps/discord-step";
import { ProfileStep } from "./steps/profile-step";
import { CompleteStep } from "./steps/complete-step";

interface OnboardingModalProps {
  userId: string;
  userName: string | null;
  hasDiscord: boolean;
  onComplete: () => void;
}

const STEPS = [
  { key: "welcome", title: "Welcome" },
  { key: "features", title: "Features" },
  { key: "discord", title: "Discord" },
  { key: "profile", title: "Profile" },
  { key: "complete", title: "Complete" },
];

export function OnboardingModal({
  userId,
  userName,
  hasDiscord,
  onComplete,
}: OnboardingModalProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [isOpen, setIsOpen] = useState(true);

  const handleNext = () => {
    if (currentStep < STEPS.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleSkip = () => {
    if (currentStep < STEPS.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleComplete = async () => {
    try {
      await fetch("/api/gamehub/onboarding", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId }),
      });
      onComplete();
      setIsOpen(false);
    } catch (error) {
      console.error("Failed to complete onboarding:", error);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm"
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          transition={{ type: "spring", duration: 0.5 }}
          className="relative w-full max-w-2xl mx-4 rounded-2xl border border-border bg-card shadow-2xl"
        >
          {/* Progress Bar */}
          <div className="absolute top-0 left-0 right-0 h-1 rounded-t-2xl bg-muted overflow-hidden">
            <motion.div
              className="h-full bg-primary"
              initial={{ width: 0 }}
              animate={{ width: `${((currentStep + 1) / STEPS.length) * 100}%` }}
              transition={{ duration: 0.3 }}
            />
          </div>

          {/* Step Indicators */}
          <div className="flex justify-center gap-2 pt-6 pb-2">
            {STEPS.map((step, index) => (
              <div
                key={step.key}
                className={`h-2 w-2 rounded-full transition-colors ${
                  index <= currentStep ? "bg-primary" : "bg-muted"
                }`}
              />
            ))}
          </div>

          {/* Content */}
          <div className="p-6 pt-2">
            <AnimatePresence mode="wait">
              <motion.div
                key={currentStep}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
              >
                {currentStep === 0 && (
                  <WelcomeStep userName={userName} onNext={handleNext} />
                )}
                {currentStep === 1 && (
                  <FeaturesStep onNext={handleNext} />
                )}
                {currentStep === 2 && (
                  <DiscordStep
                    hasDiscord={hasDiscord}
                    onNext={handleNext}
                    onSkip={handleSkip}
                  />
                )}
                {currentStep === 3 && (
                  <ProfileStep userId={userId} onNext={handleNext} />
                )}
                {currentStep === 4 && (
                  <CompleteStep onComplete={handleComplete} />
                )}
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Skip Button (except for last step) */}
          {currentStep < STEPS.length - 1 && currentStep !== 0 && (
            <div className="absolute bottom-6 right-6">
              <button
                onClick={handleSkip}
                className="text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                Skip
              </button>
            </div>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

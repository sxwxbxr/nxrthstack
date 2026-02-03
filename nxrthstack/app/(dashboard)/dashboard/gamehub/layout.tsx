import { getSessionWithUser } from "@/lib/auth/server";
import { redirect } from "next/navigation";
import { GameHubNav } from "@/components/gamehub/gamehub-nav";
import { OnboardingWrapper } from "@/components/gamehub/onboarding/onboarding-wrapper";

export const dynamic = "force-dynamic";

export default async function GameHubLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user } = await getSessionWithUser();

  // Protect GameHub - only accessible to friends or admins
  if (!user?.isFriend && user?.role !== "admin") {
    redirect("/dashboard");
  }

  // Check if user needs onboarding
  const showOnboarding = !user.gamehubOnboardingComplete;

  return (
    <div className="space-y-6">
      <GameHubNav />
      {children}
      <OnboardingWrapper
        userId={user.id}
        userName={user.name}
        hasDiscord={!!user.discordId}
        showOnboarding={showOnboarding}
      />
    </div>
  );
}

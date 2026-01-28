import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Icons } from "@/components/icons";
import { FadeIn } from "@/components/ui/fade-in";
import { GradientText } from "@/components/ui/gradient-text";
import { AchievementsDisplay } from "@/components/gamehub/achievements-display";
import { db } from "@/lib/db";
import { userAchievements, gamehubAchievements } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

export const metadata = {
  title: "Achievements | GameHub - NxrthStack",
  description: "Track your GameHub achievements and progress",
};

export default async function AchievementsPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  // Fetch user's achievements
  const userAchievementData = await db
    .select({
      achievementKey: gamehubAchievements.key,
      unlockedAt: userAchievements.unlockedAt,
    })
    .from(userAchievements)
    .innerJoin(
      gamehubAchievements,
      eq(userAchievements.achievementId, gamehubAchievements.id)
    )
    .where(eq(userAchievements.userId, session.user.id));

  return (
    <div className="space-y-6">
      {/* Header */}
      <FadeIn>
        <Link
          href="/dashboard/gamehub"
          className="inline-flex items-center text-sm text-foreground/60 hover:text-foreground mb-4"
        >
          <Icons.ChevronRight className="h-4 w-4 mr-1 rotate-180" />
          Back to GameHub
        </Link>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">
              <GradientText>Achievements</GradientText>
            </h1>
            <p className="mt-1 text-foreground/60">
              Track your progress and unlock achievements across all GameHub features
            </p>
          </div>
          <div className="flex items-center gap-2 text-yellow-500">
            <Icons.Trophy className="h-6 w-6" />
            <span className="text-2xl font-bold">{userAchievementData.length}</span>
          </div>
        </div>
      </FadeIn>

      {/* Achievements Display */}
      <FadeIn delay={0.1}>
        <AchievementsDisplay userAchievements={userAchievementData} />
      </FadeIn>
    </div>
  );
}

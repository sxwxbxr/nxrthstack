import { auth } from "@/lib/auth";
import { db, tacticsPlayers, tacticsAchievements } from "@/lib/db";
import { eq, and } from "drizzle-orm";
import { NextResponse } from "next/server";
import { ACHIEVEMENTS, ACHIEVEMENT_MAP } from "@/lib/gamehub/tactics/achievements";

/** GET - List all achievements with unlock/claim status */
export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const player = await db.query.tacticsPlayers.findFirst({
      where: eq(tacticsPlayers.userId, session.user.id),
    });
    if (!player) {
      return NextResponse.json({ error: "Player not found" }, { status: 404 });
    }

    const unlocked = await db
      .select()
      .from(tacticsAchievements)
      .where(eq(tacticsAchievements.playerId, player.id));

    const unlockedMap = Object.fromEntries(
      unlocked.map((a) => [a.achievementId, a])
    );

    const achievements = ACHIEVEMENTS.map((def) => ({
      ...def,
      unlocked: !!unlockedMap[def.id],
      claimed: unlockedMap[def.id]?.claimed ?? false,
      unlockedAt: unlockedMap[def.id]?.unlockedAt?.toISOString() ?? null,
    }));

    return NextResponse.json({ achievements });
  } catch (error) {
    console.error("Error fetching achievements:", error);
    return NextResponse.json({ error: "Failed to fetch achievements" }, { status: 500 });
  }
}

/** POST - Claim unlocked achievement reward */
export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { achievementId } = body as { achievementId: string };

    if (!achievementId || !ACHIEVEMENT_MAP[achievementId]) {
      return NextResponse.json({ error: "Invalid achievement" }, { status: 400 });
    }

    const player = await db.query.tacticsPlayers.findFirst({
      where: eq(tacticsPlayers.userId, session.user.id),
    });
    if (!player) {
      return NextResponse.json({ error: "Player not found" }, { status: 404 });
    }

    const [achievement] = await db
      .select()
      .from(tacticsAchievements)
      .where(
        and(
          eq(tacticsAchievements.playerId, player.id),
          eq(tacticsAchievements.achievementId, achievementId)
        )
      );

    if (!achievement) {
      return NextResponse.json({ error: "Achievement not unlocked" }, { status: 400 });
    }

    if (achievement.claimed) {
      return NextResponse.json({ error: "Already claimed" }, { status: 400 });
    }

    const reward = ACHIEVEMENT_MAP[achievementId].reward;

    await db
      .update(tacticsAchievements)
      .set({ claimed: true })
      .where(eq(tacticsAchievements.id, achievement.id));

    await db
      .update(tacticsPlayers)
      .set({ currency: player.currency + reward })
      .where(eq(tacticsPlayers.id, player.id));

    return NextResponse.json({
      success: true,
      reward,
      currencyRemaining: player.currency + reward,
    });
  } catch (error) {
    console.error("Error claiming achievement:", error);
    return NextResponse.json({ error: "Failed to claim achievement" }, { status: 500 });
  }
}

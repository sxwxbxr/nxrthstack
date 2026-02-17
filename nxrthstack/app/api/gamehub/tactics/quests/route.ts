import { auth } from "@/lib/auth";
import { db, tacticsPlayers, tacticsDailyQuests } from "@/lib/db";
import { eq, and } from "drizzle-orm";
import { NextResponse } from "next/server";
import { pickDailyQuests, getTodayDateSeed, isQuestFromToday } from "@/lib/gamehub/tactics/quests";

/** GET - Fetch today's quests (auto-generate if none exist) */
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

    // Get existing quests for this player
    const existingQuests = await db
      .select()
      .from(tacticsDailyQuests)
      .where(eq(tacticsDailyQuests.playerId, player.id));

    // Check if today's quests exist
    const todayQuests = existingQuests.filter((q) => isQuestFromToday(q.createdAt));

    if (todayQuests.length >= 3) {
      return NextResponse.json({ quests: todayQuests });
    }

    // Generate today's quests
    const dateSeed = getTodayDateSeed();
    const picks = pickDailyQuests(dateSeed + player.id);

    const newQuests = await Promise.all(
      picks.map((pick) =>
        db
          .insert(tacticsDailyQuests)
          .values({
            playerId: player.id,
            questType: pick.type,
            target: pick.target,
            reward: pick.reward,
            progress: 0,
          })
          .returning()
      )
    );

    return NextResponse.json({ quests: newQuests.map((q) => q[0]) });
  } catch (error) {
    console.error("Error fetching quests:", error);
    return NextResponse.json({ error: "Failed to fetch quests" }, { status: 500 });
  }
}

/** POST - Claim completed quest reward */
export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { questId } = body as { questId: string };

    if (!questId) {
      return NextResponse.json({ error: "Missing questId" }, { status: 400 });
    }

    const player = await db.query.tacticsPlayers.findFirst({
      where: eq(tacticsPlayers.userId, session.user.id),
    });
    if (!player) {
      return NextResponse.json({ error: "Player not found" }, { status: 404 });
    }

    const [quest] = await db
      .select()
      .from(tacticsDailyQuests)
      .where(
        and(
          eq(tacticsDailyQuests.id, questId),
          eq(tacticsDailyQuests.playerId, player.id)
        )
      );

    if (!quest) {
      return NextResponse.json({ error: "Quest not found" }, { status: 404 });
    }

    if (quest.completedAt) {
      return NextResponse.json({ error: "Quest already claimed" }, { status: 400 });
    }

    if (quest.progress < quest.target) {
      return NextResponse.json({ error: "Quest not completed yet" }, { status: 400 });
    }

    // Mark as claimed and award currency
    await db
      .update(tacticsDailyQuests)
      .set({ completedAt: new Date() })
      .where(eq(tacticsDailyQuests.id, questId));

    await db
      .update(tacticsPlayers)
      .set({ currency: player.currency + quest.reward })
      .where(eq(tacticsPlayers.id, player.id));

    return NextResponse.json({
      success: true,
      reward: quest.reward,
      currencyRemaining: player.currency + quest.reward,
    });
  } catch (error) {
    console.error("Error claiming quest:", error);
    return NextResponse.json({ error: "Failed to claim quest" }, { status: 500 });
  }
}

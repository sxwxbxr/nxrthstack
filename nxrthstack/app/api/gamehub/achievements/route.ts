import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { userAchievements, gamehubAchievements } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { ACHIEVEMENT_DEFINITIONS, getAchievementByKey } from "@/lib/gamehub/achievements";

// GET - Fetch user achievements
export async function GET() {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const achievements = await db
      .select({
        achievementKey: gamehubAchievements.key,
        name: gamehubAchievements.name,
        description: gamehubAchievements.description,
        icon: gamehubAchievements.icon,
        category: gamehubAchievements.category,
        points: gamehubAchievements.points,
        rarity: gamehubAchievements.rarity,
        unlockedAt: userAchievements.unlockedAt,
      })
      .from(userAchievements)
      .innerJoin(
        gamehubAchievements,
        eq(userAchievements.achievementId, gamehubAchievements.id)
      )
      .where(eq(userAchievements.userId, session.user.id));

    return NextResponse.json({ achievements });
  } catch (error) {
    console.error("Error fetching achievements:", error);
    return NextResponse.json(
      { error: "Failed to fetch achievements" },
      { status: 500 }
    );
  }
}

// POST - Unlock an achievement
export async function POST(request: Request) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { achievementKey } = await request.json();

    if (!achievementKey) {
      return NextResponse.json(
        { error: "Achievement key is required" },
        { status: 400 }
      );
    }

    // Check if achievement exists in definitions
    const achievementDef = getAchievementByKey(achievementKey);
    if (!achievementDef) {
      return NextResponse.json(
        { error: "Invalid achievement key" },
        { status: 400 }
      );
    }

    // Get or create the achievement in the database
    let [achievement] = await db
      .select()
      .from(gamehubAchievements)
      .where(eq(gamehubAchievements.key, achievementKey))
      .limit(1);

    if (!achievement) {
      // Create the achievement in the database
      [achievement] = await db
        .insert(gamehubAchievements)
        .values({
          key: achievementDef.key,
          name: achievementDef.name,
          description: achievementDef.description,
          icon: achievementDef.icon,
          category: achievementDef.category,
          points: achievementDef.points,
          rarity: achievementDef.rarity,
          isSecret: achievementDef.isSecret || false,
        })
        .returning();
    }

    // Check if user already has this achievement
    const [existing] = await db
      .select()
      .from(userAchievements)
      .where(
        and(
          eq(userAchievements.userId, session.user.id),
          eq(userAchievements.achievementId, achievement.id)
        )
      )
      .limit(1);

    if (existing) {
      return NextResponse.json({
        success: true,
        alreadyUnlocked: true,
        achievement: achievementDef,
      });
    }

    // Unlock the achievement
    await db.insert(userAchievements).values({
      userId: session.user.id,
      achievementId: achievement.id,
    });

    return NextResponse.json({
      success: true,
      alreadyUnlocked: false,
      achievement: achievementDef,
    });
  } catch (error) {
    console.error("Error unlocking achievement:", error);
    return NextResponse.json(
      { error: "Failed to unlock achievement" },
      { status: 500 }
    );
  }
}

// PUT - Seed all achievements to database
export async function PUT() {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if user is admin
    const isAdmin = (session.user as { role?: string }).role === "admin";
    if (!isAdmin) {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 });
    }

    // Seed all achievements
    const seededAchievements = [];
    for (const def of ACHIEVEMENT_DEFINITIONS) {
      const [existing] = await db
        .select()
        .from(gamehubAchievements)
        .where(eq(gamehubAchievements.key, def.key))
        .limit(1);

      if (!existing) {
        const [created] = await db
          .insert(gamehubAchievements)
          .values({
            key: def.key,
            name: def.name,
            description: def.description,
            icon: def.icon,
            category: def.category,
            points: def.points,
            rarity: def.rarity,
            isSecret: def.isSecret || false,
          })
          .returning();
        seededAchievements.push(created);
      }
    }

    return NextResponse.json({
      success: true,
      seeded: seededAchievements.length,
      total: ACHIEVEMENT_DEFINITIONS.length,
    });
  } catch (error) {
    console.error("Error seeding achievements:", error);
    return NextResponse.json(
      { error: "Failed to seed achievements" },
      { status: 500 }
    );
  }
}

import { auth } from "@/lib/auth";
import { db, tacticsPlayers } from "@/lib/db";
import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { STARTER_UNIT_IDS } from "@/lib/gamehub/tactics/units";
import { ALL_PRESETS, DEFAULT_PRESET_FOR_CLASS } from "@/lib/gamehub/tactics/behaviors";
import { ALL_UNITS } from "@/lib/gamehub/tactics/units";
import { getTodayString, wasYesterday, getStreakReward } from "@/lib/gamehub/tactics/login-streaks";
import type { Squad, SquadUnit } from "@/lib/gamehub/tactics/types";
import { checkAndUnlockAchievements, addCurrencySpent } from "@/lib/gamehub/tactics/progression";

function createStarterSquad(): Squad {
  const units: SquadUnit[] = STARTER_UNIT_IDS.map((id, i) => {
    const template = ALL_UNITS[id];
    const presetId = DEFAULT_PRESET_FOR_CLASS[template.class] ?? "aggressive";
    const preset = ALL_PRESETS[presetId];
    return {
      templateId: id,
      instanceId: `${id}_${i}`,
      behaviorRules: preset.rules.map((r, ri) => ({
        ...r,
        id: `${id}_rule_${ri}`,
      })),
      position: { x: 1 + i * 2, y: 7 },
    };
  });
  return { units };
}

function createStarterDefenseSquad(): Squad {
  const units: SquadUnit[] = STARTER_UNIT_IDS.map((id, i) => {
    const template = ALL_UNITS[id];
    const presetId = DEFAULT_PRESET_FOR_CLASS[template.class] ?? "aggressive";
    const preset = ALL_PRESETS[presetId];
    return {
      templateId: id,
      instanceId: `${id}_def_${i}`,
      behaviorRules: preset.rules.map((r, ri) => ({
        ...r,
        id: `${id}_def_rule_${ri}`,
      })),
      position: { x: 1 + i * 2, y: 0 },
    };
  });
  return { units };
}

/** GET - Fetch player profile (auto-creates if not found) */
export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    let player = await db.query.tacticsPlayers.findFirst({
      where: eq(tacticsPlayers.userId, session.user.id),
    });

    if (!player) {
      const attackSquad = createStarterSquad();
      const defenseSquad = createStarterDefenseSquad();

      const [created] = await db
        .insert(tacticsPlayers)
        .values({
          userId: session.user.id,
          unlockedUnitIds: STARTER_UNIT_IDS,
          attackSquad,
          defenseSquad,
        })
        .returning();
      player = created;
    }

    // Login streak check
    let loginReward = null;
    const today = getTodayString();
    if (player.lastLoginDate !== today) {
      // Calculate new streak
      let newStreak: number;
      if (player.lastLoginDate && wasYesterday(player.lastLoginDate)) {
        newStreak = player.loginStreak + 1;
      } else {
        newStreak = 1; // Reset streak
      }

      const reward = getStreakReward(newStreak);

      const [updated] = await db
        .update(tacticsPlayers)
        .set({
          loginStreak: newStreak,
          lastLoginDate: today,
          currency: player.currency + reward.currency,
          updatedAt: new Date(),
        })
        .where(eq(tacticsPlayers.userId, session.user.id))
        .returning();

      player = updated;
      loginReward = {
        day: newStreak,
        currency: reward.currency,
        bonusEquipment: reward.bonusEquipment,
      };
    }

    return NextResponse.json({ player, loginReward });
  } catch (error) {
    console.error("Error fetching tactics player:", error);
    return NextResponse.json(
      { error: "Failed to fetch player data" },
      { status: 500 }
    );
  }
}

/** PATCH - Update player (unlock units, spend currency) */
export async function PATCH(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { unlockUnitId } = body;

    const player = await db.query.tacticsPlayers.findFirst({
      where: eq(tacticsPlayers.userId, session.user.id),
    });

    if (!player) {
      return NextResponse.json({ error: "Player not found" }, { status: 404 });
    }

    if (unlockUnitId) {
      const template = ALL_UNITS[unlockUnitId];
      if (!template) {
        return NextResponse.json({ error: "Invalid unit ID" }, { status: 400 });
      }

      const unlockedIds = player.unlockedUnitIds as string[];
      if (unlockedIds.includes(unlockUnitId)) {
        return NextResponse.json({ error: "Unit already unlocked" }, { status: 400 });
      }

      if (player.currency < template.unlockCost) {
        return NextResponse.json({ error: "Insufficient currency" }, { status: 400 });
      }

      const newUnlocked = [...unlockedIds, unlockUnitId];
      const [updated] = await db
        .update(tacticsPlayers)
        .set({
          unlockedUnitIds: newUnlocked,
          currency: player.currency - template.unlockCost,
          updatedAt: new Date(),
        })
        .where(eq(tacticsPlayers.userId, session.user.id))
        .returning();

      // Spending & achievements
      await addCurrencySpent(player.id, template.unlockCost);
      await checkAndUnlockAchievements(player.id);

      return NextResponse.json({ player: updated });
    }

    return NextResponse.json({ error: "No action specified" }, { status: 400 });
  } catch (error) {
    console.error("Error updating tactics player:", error);
    return NextResponse.json(
      { error: "Failed to update player" },
      { status: 500 }
    );
  }
}

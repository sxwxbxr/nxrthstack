import { auth } from "@/lib/auth";
import { db, tacticsPlayers, tacticsMatches, tacticsMatchCooldowns, users } from "@/lib/db";
import { eq, ne, and, gt, sql, isNotNull } from "drizzle-orm";
import { NextResponse } from "next/server";
import { simulateBattle } from "@/lib/gamehub/tactics/simulation";
import { calculateRatingChange, calculateCurrencyReward } from "@/lib/gamehub/tactics/elo";
import type { Squad } from "@/lib/gamehub/tactics/types";

const TICK_RATE = 10;
const COOLDOWN_MINUTES = 30;
const INITIAL_RATING_WINDOW = 200;
const MAX_RATING_WINDOW = 500;

/** POST - Find opponent and simulate battle */
export async function POST() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Fetch attacker profile
    const attacker = await db.query.tacticsPlayers.findFirst({
      where: eq(tacticsPlayers.userId, session.user.id),
    });

    if (!attacker) {
      return NextResponse.json({ error: "Player not found. Visit tactics dashboard first." }, { status: 404 });
    }

    const attackSquad = attacker.attackSquad as Squad | null;
    if (!attackSquad?.units?.length) {
      return NextResponse.json({ error: "You need an attack squad to battle." }, { status: 400 });
    }

    // Find a defender within rating window
    const now = new Date();

    // Get active cooldowns for this attacker
    const cooldowns = await db
      .select({ defenderId: tacticsMatchCooldowns.defenderId })
      .from(tacticsMatchCooldowns)
      .where(
        and(
          eq(tacticsMatchCooldowns.attackerId, session.user.id),
          gt(tacticsMatchCooldowns.expiresAt, now)
        )
      );
    const cooldownIds = cooldowns.map((c) => c.defenderId);

    // Try expanding rating window to find an opponent
    let defender = null;
    for (let window = INITIAL_RATING_WINDOW; window <= MAX_RATING_WINDOW; window += 100) {
      const candidates = await db
        .select()
        .from(tacticsPlayers)
        .where(
          and(
            ne(tacticsPlayers.userId, session.user.id),
            isNotNull(tacticsPlayers.defenseSquad),
            sql`${tacticsPlayers.rating} BETWEEN ${attacker.rating - window} AND ${attacker.rating + window}`
          )
        )
        .limit(20);

      // Filter out cooldowns and players without defense squads
      const eligible = candidates.filter((c) => {
        if (cooldownIds.includes(c.userId)) return false;
        const defSquad = c.defenseSquad as Squad | null;
        return defSquad?.units?.length && defSquad.units.length >= 3;
      });

      if (eligible.length > 0) {
        // Pick random defender from eligible
        defender = eligible[Math.floor(Math.random() * eligible.length)];
        break;
      }
    }

    if (!defender) {
      return NextResponse.json(
        { error: "No opponents available. Try again later." },
        { status: 404 }
      );
    }

    // Get defender's user info for display
    const defenderUser = await db.query.users.findFirst({
      where: eq(users.id, defender.userId),
    });

    const defenseSquad = defender.defenseSquad as Squad;

    // Generate seed and simulate
    const seed = Math.floor(Math.random() * 2147483647);
    const mapId = ""; // selectMap will pick based on seed

    const result = simulateBattle(attackSquad, defenseSquad, mapId, seed);
    const attackerWon = result.winner === "attacker";

    // Calculate rating changes
    const ratingChange = calculateRatingChange(
      attacker.rating,
      defender.rating,
      attackerWon
    );

    const attackerCurrency = calculateCurrencyReward(attackerWon, true);
    const defenderCurrency = calculateCurrencyReward(attackerWon, false);

    // Store match result
    const [match] = await db
      .insert(tacticsMatches)
      .values({
        attackerId: session.user.id,
        defenderId: defender.userId,
        attackerRatingBefore: attacker.rating,
        defenderRatingBefore: defender.rating,
        attackerRatingChange: ratingChange.attackerChange,
        defenderRatingChange: ratingChange.defenderChange,
        attackerSquadSnapshot: attackSquad,
        defenderSquadSnapshot: defenseSquad,
        mapId: result.mapId,
        seed,
        winner: result.winner,
        durationTicks: result.durationTicks,
        durationSeconds: Math.ceil(result.durationTicks / TICK_RATE),
        stats: result.stats,
        events: result.events,
      })
      .returning();

    // Update attacker rating, currency, wins/losses
    await db
      .update(tacticsPlayers)
      .set({
        rating: attacker.rating + ratingChange.attackerChange,
        currency: attacker.currency + attackerCurrency,
        totalWins: attackerWon ? attacker.totalWins + 1 : attacker.totalWins,
        totalLosses: attackerWon ? attacker.totalLosses : attacker.totalLosses + 1,
        updatedAt: now,
      })
      .where(eq(tacticsPlayers.userId, session.user.id));

    // Update defender rating, currency, wins/losses
    await db
      .update(tacticsPlayers)
      .set({
        rating: defender.rating + ratingChange.defenderChange,
        currency: defender.currency + defenderCurrency,
        totalWins: attackerWon ? defender.totalWins : defender.totalWins + 1,
        totalLosses: attackerWon ? defender.totalLosses + 1 : defender.totalLosses,
        updatedAt: now,
      })
      .where(eq(tacticsPlayers.userId, defender.userId));

    // Add cooldown
    await db.insert(tacticsMatchCooldowns).values({
      attackerId: session.user.id,
      defenderId: defender.userId,
      expiresAt: new Date(now.getTime() + COOLDOWN_MINUTES * 60 * 1000),
    });

    return NextResponse.json({
      match: {
        matchId: match.id,
        attackerId: session.user.id,
        attackerName: session.user.name || "You",
        defenderId: defender.userId,
        defenderName: defenderUser?.name || "Unknown",
        attackerRatingBefore: attacker.rating,
        defenderRatingBefore: defender.rating,
        attackerRatingChange: ratingChange.attackerChange,
        defenderRatingChange: ratingChange.defenderChange,
        winner: result.winner,
        durationSeconds: Math.ceil(result.durationTicks / TICK_RATE),
        stats: result.stats,
        currencyEarned: attackerCurrency,
        createdAt: match.createdAt.toISOString(),
      },
    });
  } catch (error) {
    console.error("Error in tactics match:", error);
    return NextResponse.json(
      { error: "Failed to process match" },
      { status: 500 }
    );
  }
}

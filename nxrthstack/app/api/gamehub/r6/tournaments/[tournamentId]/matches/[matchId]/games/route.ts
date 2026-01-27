import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import {
  r6Tournaments,
  r6TournamentParticipants,
  r6TournamentMatches,
  r6TournamentGames,
} from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { z } from "zod";

const createGameSchema = z.object({
  winnerId: z.string().uuid(),
  player1Kills: z.number().int().min(0).optional(),
  player1Deaths: z.number().int().min(0).optional(),
  player2Kills: z.number().int().min(0).optional(),
  player2Deaths: z.number().int().min(0).optional(),
  player1RoundsWon: z.number().int().min(0).max(10).optional(),
  player2RoundsWon: z.number().int().min(0).max(10).optional(),
  mapPlayed: z.string().max(100).optional(),
  screenshotUrl: z.string().url().max(500).optional(),
  notes: z.string().max(500).optional(),
});

// Helper to advance winner to next match
async function advanceWinner(
  tournamentId: string,
  matchId: string,
  winnerId: string,
  loserId: string
) {
  // Get all matches for the tournament
  const allMatches = await db.query.r6TournamentMatches.findMany({
    where: eq(r6TournamentMatches.tournamentId, tournamentId),
  });

  const currentMatch = allMatches.find((m) => m.id === matchId);
  if (!currentMatch) return;

  // Find the next match in the bracket
  const currentRound = currentMatch.round;
  const currentMatchNumber = currentMatch.matchNumber;

  // Calculate next match position
  const nextRound = currentRound + 1;
  const nextMatchNumber = Math.ceil(currentMatchNumber / 2);

  const nextMatch = allMatches.find(
    (m) => m.round === nextRound && m.matchNumber === nextMatchNumber
  );

  if (nextMatch) {
    // Determine which slot (player1 or player2) based on current match number
    const isOddMatch = currentMatchNumber % 2 === 1;
    const updates = isOddMatch
      ? { player1Id: winnerId }
      : { player2Id: winnerId };

    await db
      .update(r6TournamentMatches)
      .set(updates)
      .where(eq(r6TournamentMatches.id, nextMatch.id));
  } else {
    // This was the final match - update tournament winner
    await db
      .update(r6Tournaments)
      .set({
        winnerId,
        status: "completed",
        completedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(r6Tournaments.id, tournamentId));

    // Update participant placements
    await db
      .update(r6TournamentParticipants)
      .set({ finalPlacement: 1 })
      .where(
        and(
          eq(r6TournamentParticipants.tournamentId, tournamentId),
          eq(r6TournamentParticipants.userId, winnerId)
        )
      );

    await db
      .update(r6TournamentParticipants)
      .set({ finalPlacement: 2, isEliminated: true, eliminatedAt: currentRound })
      .where(
        and(
          eq(r6TournamentParticipants.tournamentId, tournamentId),
          eq(r6TournamentParticipants.userId, loserId)
        )
      );
  }

  // Mark loser as eliminated
  if (loserId) {
    await db
      .update(r6TournamentParticipants)
      .set({ isEliminated: true, eliminatedAt: currentRound })
      .where(
        and(
          eq(r6TournamentParticipants.tournamentId, tournamentId),
          eq(r6TournamentParticipants.userId, loserId)
        )
      );
  }
}

// POST /api/gamehub/r6/tournaments/[tournamentId]/matches/[matchId]/games
export async function POST(
  request: Request,
  { params }: { params: Promise<{ tournamentId: string; matchId: string }> }
) {
  try {
    const session = await auth();
    const { tournamentId, matchId } = await params;

    if (!session?.user?.isFriend && session?.user?.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get tournament
    const tournament = await db.query.r6Tournaments.findFirst({
      where: eq(r6Tournaments.id, tournamentId),
    });

    if (!tournament) {
      return NextResponse.json(
        { error: "Tournament not found" },
        { status: 404 }
      );
    }

    // Get match with games
    const match = await db.query.r6TournamentMatches.findFirst({
      where: and(
        eq(r6TournamentMatches.id, matchId),
        eq(r6TournamentMatches.tournamentId, tournamentId)
      ),
      with: {
        games: true,
      },
    });

    if (!match) {
      return NextResponse.json({ error: "Match not found" }, { status: 404 });
    }

    // Check authorization
    const isHost = tournament.hostId === session.user.id;
    const isParticipant =
      match.player1Id === session.user.id || match.player2Id === session.user.id;

    if (!isHost && !isParticipant && session.user.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    // Check match status
    if (match.status === "completed") {
      return NextResponse.json(
        { error: "Match is already completed" },
        { status: 400 }
      );
    }

    const body = await request.json();
    const parsed = createGameSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid input", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { winnerId, ...gameData } = parsed.data;

    // Validate winner is one of the players
    if (winnerId !== match.player1Id && winnerId !== match.player2Id) {
      return NextResponse.json(
        { error: "Winner must be one of the match players" },
        { status: 400 }
      );
    }

    // Calculate game number
    const gameNumber = match.games.length + 1;

    // Check if match already has enough games
    const gamesNeeded = Math.ceil(tournament.bestOf / 2);
    const player1Wins = match.games.filter(
      (g) => g.winnerId === match.player1Id
    ).length;
    const player2Wins = match.games.filter(
      (g) => g.winnerId === match.player2Id
    ).length;

    if (player1Wins >= gamesNeeded || player2Wins >= gamesNeeded) {
      return NextResponse.json(
        { error: "Match already decided" },
        { status: 400 }
      );
    }

    // Create game
    const [game] = await db
      .insert(r6TournamentGames)
      .values({
        matchId,
        gameNumber,
        winnerId,
        ...gameData,
      })
      .returning();

    // Update match scores
    const newPlayer1Wins =
      player1Wins + (winnerId === match.player1Id ? 1 : 0);
    const newPlayer2Wins =
      player2Wins + (winnerId === match.player2Id ? 1 : 0);

    // Update participant stats
    if (gameData.player1Kills !== undefined || gameData.player1Deaths !== undefined) {
      await db
        .update(r6TournamentParticipants)
        .set({
          totalKills: match.player1Id
            ? (await db.query.r6TournamentParticipants.findFirst({
                where: and(
                  eq(r6TournamentParticipants.tournamentId, tournamentId),
                  eq(r6TournamentParticipants.userId, match.player1Id)
                ),
              }))?.totalKills || 0 + (gameData.player1Kills || 0)
            : 0,
          totalDeaths: match.player1Id
            ? (await db.query.r6TournamentParticipants.findFirst({
                where: and(
                  eq(r6TournamentParticipants.tournamentId, tournamentId),
                  eq(r6TournamentParticipants.userId, match.player1Id)
                ),
              }))?.totalDeaths || 0 + (gameData.player1Deaths || 0)
            : 0,
        })
        .where(
          and(
            eq(r6TournamentParticipants.tournamentId, tournamentId),
            eq(r6TournamentParticipants.userId, match.player1Id || "")
          )
        );
    }

    if (gameData.player2Kills !== undefined || gameData.player2Deaths !== undefined) {
      await db
        .update(r6TournamentParticipants)
        .set({
          totalKills: match.player2Id
            ? (await db.query.r6TournamentParticipants.findFirst({
                where: and(
                  eq(r6TournamentParticipants.tournamentId, tournamentId),
                  eq(r6TournamentParticipants.userId, match.player2Id)
                ),
              }))?.totalKills || 0 + (gameData.player2Kills || 0)
            : 0,
          totalDeaths: match.player2Id
            ? (await db.query.r6TournamentParticipants.findFirst({
                where: and(
                  eq(r6TournamentParticipants.tournamentId, tournamentId),
                  eq(r6TournamentParticipants.userId, match.player2Id)
                ),
              }))?.totalDeaths || 0 + (gameData.player2Deaths || 0)
            : 0,
        })
        .where(
          and(
            eq(r6TournamentParticipants.tournamentId, tournamentId),
            eq(r6TournamentParticipants.userId, match.player2Id || "")
          )
        );
    }

    // Check if match is decided
    let matchWinnerId: string | null = null;
    let matchLoserId: string | null = null;

    if (newPlayer1Wins >= gamesNeeded) {
      matchWinnerId = match.player1Id;
      matchLoserId = match.player2Id;
    } else if (newPlayer2Wins >= gamesNeeded) {
      matchWinnerId = match.player2Id;
      matchLoserId = match.player1Id;
    }

    // Update match
    await db
      .update(r6TournamentMatches)
      .set({
        player1Score: newPlayer1Wins,
        player2Score: newPlayer2Wins,
        status: matchWinnerId ? "completed" : "in_progress",
        winnerId: matchWinnerId,
        loserId: matchLoserId,
        completedAt: matchWinnerId ? new Date() : null,
      })
      .where(eq(r6TournamentMatches.id, matchId));

    // If match is decided, advance winner
    if (matchWinnerId && matchLoserId) {
      await advanceWinner(tournamentId, matchId, matchWinnerId, matchLoserId);

      // Update participant win/loss counts
      await db
        .update(r6TournamentParticipants)
        .set({
          matchesWon: (await db.query.r6TournamentParticipants.findFirst({
            where: and(
              eq(r6TournamentParticipants.tournamentId, tournamentId),
              eq(r6TournamentParticipants.userId, matchWinnerId)
            ),
          }))?.matchesWon || 0 + 1,
        })
        .where(
          and(
            eq(r6TournamentParticipants.tournamentId, tournamentId),
            eq(r6TournamentParticipants.userId, matchWinnerId)
          )
        );

      await db
        .update(r6TournamentParticipants)
        .set({
          matchesLost: (await db.query.r6TournamentParticipants.findFirst({
            where: and(
              eq(r6TournamentParticipants.tournamentId, tournamentId),
              eq(r6TournamentParticipants.userId, matchLoserId)
            ),
          }))?.matchesLost || 0 + 1,
        })
        .where(
          and(
            eq(r6TournamentParticipants.tournamentId, tournamentId),
            eq(r6TournamentParticipants.userId, matchLoserId)
          )
        );
    }

    // Update tournament timestamp
    await db
      .update(r6Tournaments)
      .set({ updatedAt: new Date() })
      .where(eq(r6Tournaments.id, tournamentId));

    // Fetch updated match
    const updatedMatch = await db.query.r6TournamentMatches.findFirst({
      where: eq(r6TournamentMatches.id, matchId),
      with: {
        player1: { columns: { id: true, name: true, email: true } },
        player2: { columns: { id: true, name: true, email: true } },
        winner: { columns: { id: true, name: true, email: true } },
        games: true,
      },
    });

    return NextResponse.json({ match: updatedMatch, game }, { status: 201 });
  } catch (error) {
    console.error("Error recording game:", error);
    return NextResponse.json(
      { error: "Failed to record game" },
      { status: 500 }
    );
  }
}

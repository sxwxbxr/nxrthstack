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

const updateMatchSchema = z.object({
  status: z.enum(["pending", "in_progress", "completed"]).optional(),
});

// GET /api/gamehub/r6/tournaments/[tournamentId]/matches/[matchId]
export async function GET(
  request: Request,
  { params }: { params: Promise<{ tournamentId: string; matchId: string }> }
) {
  try {
    const session = await auth();
    const { tournamentId, matchId } = await params;

    if (!session?.user?.isFriend && session?.user?.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const match = await db.query.r6TournamentMatches.findFirst({
      where: and(
        eq(r6TournamentMatches.id, matchId),
        eq(r6TournamentMatches.tournamentId, tournamentId)
      ),
      with: {
        player1: { columns: { id: true, name: true, email: true } },
        player2: { columns: { id: true, name: true, email: true } },
        winner: { columns: { id: true, name: true, email: true } },
        games: true,
        tournament: {
          columns: { bestOf: true, trackKills: true },
        },
      },
    });

    if (!match) {
      return NextResponse.json({ error: "Match not found" }, { status: 404 });
    }

    return NextResponse.json({ match });
  } catch (error) {
    console.error("Error fetching match:", error);
    return NextResponse.json(
      { error: "Failed to fetch match" },
      { status: 500 }
    );
  }
}

// PATCH /api/gamehub/r6/tournaments/[tournamentId]/matches/[matchId]
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ tournamentId: string; matchId: string }> }
) {
  try {
    const session = await auth();
    const { tournamentId, matchId } = await params;

    if (!session?.user?.isFriend && session?.user?.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get tournament and match
    const tournament = await db.query.r6Tournaments.findFirst({
      where: eq(r6Tournaments.id, tournamentId),
    });

    if (!tournament) {
      return NextResponse.json(
        { error: "Tournament not found" },
        { status: 404 }
      );
    }

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

    // Check authorization (host, or participant in match)
    const isHost = tournament.hostId === session.user.id;
    const isParticipant =
      match.player1Id === session.user.id || match.player2Id === session.user.id;

    if (!isHost && !isParticipant && session.user.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const body = await request.json();
    const parsed = updateMatchSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid input", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    // Update match status
    if (parsed.data.status) {
      await db
        .update(r6TournamentMatches)
        .set({ status: parsed.data.status })
        .where(eq(r6TournamentMatches.id, matchId));
    }

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

    return NextResponse.json({ match: updatedMatch });
  } catch (error) {
    console.error("Error updating match:", error);
    return NextResponse.json(
      { error: "Failed to update match" },
      { status: 500 }
    );
  }
}

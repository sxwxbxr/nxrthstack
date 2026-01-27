import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import {
  r6Tournaments,
  r6TournamentParticipants,
  r6TournamentMatches,
} from "@/lib/db/schema";
import { eq, and, or } from "drizzle-orm";
import { z } from "zod";

const updateTournamentSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  description: z.string().max(500).optional(),
  trackKills: z.boolean().optional(),
  bestOf: z.number().refine((n) => [1, 3, 5].includes(n)).optional(),
});

// Helper function to generate bracket matches
function generateBracket(
  tournamentId: string,
  participants: { id: string; seed: number | null; userId: string }[],
  format: string
) {
  const matches: {
    tournamentId: string;
    round: number;
    matchNumber: number;
    bracketSide: string;
    player1Id: string | null;
    player2Id: string | null;
    status: string;
  }[] = [];

  const size = participants.length;
  const rounds = Math.log2(size);

  // Sort participants by seed
  const seeded = [...participants].sort((a, b) => (a.seed || 999) - (b.seed || 999));

  // Generate standard bracket seeding (1v8, 4v5, 2v7, 3v6 for 8-player)
  const bracketOrder = generateBracketOrder(size);

  // First round matches
  for (let i = 0; i < size / 2; i++) {
    const player1Index = bracketOrder[i * 2];
    const player2Index = bracketOrder[i * 2 + 1];

    matches.push({
      tournamentId,
      round: 1,
      matchNumber: i + 1,
      bracketSide: "winners",
      player1Id: seeded[player1Index]?.userId || null,
      player2Id: seeded[player2Index]?.userId || null,
      status: "pending",
    });
  }

  // Generate empty matches for subsequent rounds
  for (let round = 2; round <= rounds; round++) {
    const matchesInRound = size / Math.pow(2, round);
    for (let i = 0; i < matchesInRound; i++) {
      matches.push({
        tournamentId,
        round,
        matchNumber: i + 1,
        bracketSide: "winners",
        player1Id: null,
        player2Id: null,
        status: "pending",
      });
    }
  }

  return matches;
}

// Generate bracket order for proper seeding
function generateBracketOrder(size: number): number[] {
  if (size === 2) return [0, 1];

  const half = size / 2;
  const previousOrder = generateBracketOrder(half);

  const order: number[] = [];
  for (let i = 0; i < half; i++) {
    order.push(previousOrder[i]);
    order.push(size - 1 - previousOrder[i]);
  }

  return order;
}

// GET /api/gamehub/r6/tournaments/[tournamentId]
export async function GET(
  request: Request,
  { params }: { params: Promise<{ tournamentId: string }> }
) {
  try {
    const session = await auth();
    const { tournamentId } = await params;

    if (!session?.user?.isFriend && session?.user?.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const tournament = await db.query.r6Tournaments.findFirst({
      where: eq(r6Tournaments.id, tournamentId),
      with: {
        host: {
          columns: { id: true, name: true, email: true },
        },
        winner: {
          columns: { id: true, name: true, email: true },
        },
        participants: {
          with: {
            user: {
              columns: { id: true, name: true, email: true },
            },
          },
        },
        matches: {
          with: {
            player1: {
              columns: { id: true, name: true, email: true },
            },
            player2: {
              columns: { id: true, name: true, email: true },
            },
            winner: {
              columns: { id: true, name: true, email: true },
            },
            games: true,
          },
        },
      },
    });

    if (!tournament) {
      return NextResponse.json(
        { error: "Tournament not found" },
        { status: 404 }
      );
    }

    // Check if user is host or participant
    const isHost = tournament.hostId === session.user.id;
    const isParticipant = tournament.participants.some(
      (p) => p.userId === session.user.id
    );

    if (!isHost && !isParticipant && session.user.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    return NextResponse.json({ tournament });
  } catch (error) {
    console.error("Error fetching tournament:", error);
    return NextResponse.json(
      { error: "Failed to fetch tournament" },
      { status: 500 }
    );
  }
}

// PATCH /api/gamehub/r6/tournaments/[tournamentId]
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ tournamentId: string }> }
) {
  try {
    const session = await auth();
    const { tournamentId } = await params;

    if (!session?.user?.isFriend && session?.user?.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const tournament = await db.query.r6Tournaments.findFirst({
      where: eq(r6Tournaments.id, tournamentId),
      with: {
        participants: true,
      },
    });

    if (!tournament) {
      return NextResponse.json(
        { error: "Tournament not found" },
        { status: 404 }
      );
    }

    // Only host can update
    if (tournament.hostId !== session.user.id && session.user.role !== "admin") {
      return NextResponse.json({ error: "Only host can update tournament" }, { status: 403 });
    }

    const body = await request.json();

    // Handle start tournament action
    if (body.action === "start") {
      if (tournament.status !== "registration") {
        return NextResponse.json(
          { error: "Tournament has already started" },
          { status: 400 }
        );
      }

      // Check if we have enough participants (must match size or be power of 2)
      const participantCount = tournament.participants.length;
      if (participantCount < 2) {
        return NextResponse.json(
          { error: "Need at least 2 participants to start" },
          { status: 400 }
        );
      }

      // Adjust size if needed (use next lower power of 2)
      let actualSize = tournament.size;
      while (actualSize > participantCount) {
        actualSize = actualSize / 2;
      }

      // Generate bracket
      const bracketMatches = generateBracket(
        tournament.id,
        tournament.participants,
        tournament.format
      );

      // Insert matches
      if (bracketMatches.length > 0) {
        await db.insert(r6TournamentMatches).values(bracketMatches);
      }

      // Update tournament status
      await db
        .update(r6Tournaments)
        .set({
          status: "in_progress",
          currentRound: 1,
          startedAt: new Date(),
          size: actualSize,
          updatedAt: new Date(),
        })
        .where(eq(r6Tournaments.id, tournamentId));

      // Fetch updated tournament
      const updatedTournament = await db.query.r6Tournaments.findFirst({
        where: eq(r6Tournaments.id, tournamentId),
        with: {
          host: { columns: { id: true, name: true, email: true } },
          participants: {
            with: { user: { columns: { id: true, name: true, email: true } } },
          },
          matches: {
            with: {
              player1: { columns: { id: true, name: true, email: true } },
              player2: { columns: { id: true, name: true, email: true } },
              winner: { columns: { id: true, name: true, email: true } },
              games: true,
            },
          },
        },
      });

      return NextResponse.json({ tournament: updatedTournament });
    }

    // Regular update
    if (tournament.status !== "registration") {
      return NextResponse.json(
        { error: "Cannot update tournament after it has started" },
        { status: 400 }
      );
    }

    const parsed = updateTournamentSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid input", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const updates: Record<string, unknown> = { updatedAt: new Date() };
    if (parsed.data.name) updates.name = parsed.data.name;
    if (parsed.data.description !== undefined) updates.description = parsed.data.description;
    if (parsed.data.trackKills !== undefined) updates.trackKills = parsed.data.trackKills;
    if (parsed.data.bestOf !== undefined) updates.bestOf = parsed.data.bestOf;

    await db
      .update(r6Tournaments)
      .set(updates)
      .where(eq(r6Tournaments.id, tournamentId));

    const updatedTournament = await db.query.r6Tournaments.findFirst({
      where: eq(r6Tournaments.id, tournamentId),
      with: {
        host: { columns: { id: true, name: true, email: true } },
        participants: {
          with: { user: { columns: { id: true, name: true, email: true } } },
        },
      },
    });

    return NextResponse.json({ tournament: updatedTournament });
  } catch (error) {
    console.error("Error updating tournament:", error);
    return NextResponse.json(
      { error: "Failed to update tournament" },
      { status: 500 }
    );
  }
}

// DELETE /api/gamehub/r6/tournaments/[tournamentId]
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ tournamentId: string }> }
) {
  try {
    const session = await auth();
    const { tournamentId } = await params;

    if (!session?.user?.isFriend && session?.user?.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const tournament = await db.query.r6Tournaments.findFirst({
      where: eq(r6Tournaments.id, tournamentId),
    });

    if (!tournament) {
      return NextResponse.json(
        { error: "Tournament not found" },
        { status: 404 }
      );
    }

    // Only host can delete
    if (tournament.hostId !== session.user.id && session.user.role !== "admin") {
      return NextResponse.json({ error: "Only host can delete tournament" }, { status: 403 });
    }

    // Delete tournament (cascades to participants and matches)
    await db.delete(r6Tournaments).where(eq(r6Tournaments.id, tournamentId));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting tournament:", error);
    return NextResponse.json(
      { error: "Failed to delete tournament" },
      { status: 500 }
    );
  }
}

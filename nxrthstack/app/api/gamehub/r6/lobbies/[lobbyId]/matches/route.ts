import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db, r6Lobbies, r6Matches } from "@/lib/db";
import { eq, or, and, desc } from "drizzle-orm";
import { z } from "zod";

interface RouteParams {
  params: Promise<{ lobbyId: string }>;
}

const createMatchSchema = z.object({
  winnerId: z.string().uuid(),
  player1Kills: z.number().int().min(0).optional(),
  player1Deaths: z.number().int().min(0).optional(),
  player2Kills: z.number().int().min(0).optional(),
  player2Deaths: z.number().int().min(0).optional(),
  player1RoundsWon: z.number().int().min(0).max(10).optional(),
  player2RoundsWon: z.number().int().min(0).max(10).optional(),
  screenshotUrl: z.string().url().optional(),
  notes: z.string().max(500).optional(),
});

export async function GET(request: Request, { params }: RouteParams) {
  try {
    const session = await auth();
    if (!session?.user?.isFriend && session?.user?.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { lobbyId } = await params;

    // Verify user has access to lobby
    const lobby = await db.query.r6Lobbies.findFirst({
      where: and(
        eq(r6Lobbies.id, lobbyId),
        or(
          eq(r6Lobbies.hostId, session.user.id),
          eq(r6Lobbies.opponentId, session.user.id)
        )
      ),
    });

    if (!lobby) {
      return NextResponse.json({ error: "Lobby not found" }, { status: 404 });
    }

    const matches = await db.query.r6Matches.findMany({
      where: eq(r6Matches.lobbyId, lobbyId),
      orderBy: [desc(r6Matches.createdAt)],
      with: {
        winner: true,
      },
    });

    // Remove password hashes
    const safeMatches = matches.map((match) => ({
      ...match,
      winner: match.winner
        ? {
            id: match.winner.id,
            name: match.winner.name,
            email: match.winner.email,
          }
        : null,
    }));

    return NextResponse.json({ matches: safeMatches });
  } catch (error) {
    console.error("Failed to fetch matches:", error);
    return NextResponse.json(
      { error: "Failed to fetch matches" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request, { params }: RouteParams) {
  try {
    const session = await auth();
    if (!session?.user?.isFriend && session?.user?.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { lobbyId } = await params;
    const body = await request.json();
    const parsed = createMatchSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0].message },
        { status: 400 }
      );
    }

    // Verify user has access to lobby and lobby is active
    const lobby = await db.query.r6Lobbies.findFirst({
      where: and(
        eq(r6Lobbies.id, lobbyId),
        or(
          eq(r6Lobbies.hostId, session.user.id),
          eq(r6Lobbies.opponentId, session.user.id)
        )
      ),
    });

    if (!lobby) {
      return NextResponse.json({ error: "Lobby not found" }, { status: 404 });
    }

    if (lobby.status !== "active") {
      return NextResponse.json(
        { error: "Lobby is not active" },
        { status: 400 }
      );
    }

    // Verify winner is either host or opponent
    if (
      parsed.data.winnerId !== lobby.hostId &&
      parsed.data.winnerId !== lobby.opponentId
    ) {
      return NextResponse.json(
        { error: "Winner must be a participant in the lobby" },
        { status: 400 }
      );
    }

    const [match] = await db
      .insert(r6Matches)
      .values({
        lobbyId,
        winnerId: parsed.data.winnerId,
        player1Kills: parsed.data.player1Kills,
        player1Deaths: parsed.data.player1Deaths,
        player2Kills: parsed.data.player2Kills,
        player2Deaths: parsed.data.player2Deaths,
        player1RoundsWon: parsed.data.player1RoundsWon,
        player2RoundsWon: parsed.data.player2RoundsWon,
        screenshotUrl: parsed.data.screenshotUrl,
        notes: parsed.data.notes,
      })
      .returning();

    // Update lobby timestamp
    await db
      .update(r6Lobbies)
      .set({ updatedAt: new Date() })
      .where(eq(r6Lobbies.id, lobbyId));

    return NextResponse.json({ match }, { status: 201 });
  } catch (error) {
    console.error("Failed to create match:", error);
    return NextResponse.json(
      { error: "Failed to create match" },
      { status: 500 }
    );
  }
}

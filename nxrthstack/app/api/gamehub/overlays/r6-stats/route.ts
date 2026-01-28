import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { r6Lobbies, r6Matches, streamOverlays, users } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const lobbyId = searchParams.get("lobbyId");
    const tournamentId = searchParams.get("tournamentId");
    const token = searchParams.get("token");

    if (!token) {
      return NextResponse.json({ error: "Token required" }, { status: 401 });
    }

    // Verify the overlay token is valid
    const [overlay] = await db
      .select()
      .from(streamOverlays)
      .where(eq(streamOverlays.accessToken, token))
      .limit(1);

    if (!overlay || !overlay.isActive) {
      return NextResponse.json({ error: "Invalid or inactive overlay" }, { status: 403 });
    }

    if (lobbyId) {
      // Fetch lobby stats
      const lobby = await db.query.r6Lobbies.findFirst({
        where: eq(r6Lobbies.id, lobbyId),
        with: {
          host: true,
          opponent: true,
          matches: true,
        },
      });

      if (!lobby) {
        return NextResponse.json({ error: "Lobby not found" }, { status: 404 });
      }

      // Calculate stats from matches
      let player1Score = 0;
      let player2Score = 0;
      let player1Kills = 0;
      let player1Deaths = 0;
      let player2Kills = 0;
      let player2Deaths = 0;

      for (const match of lobby.matches) {
        if (match.winnerId === lobby.hostId) {
          player1Score++;
        } else if (match.winnerId === lobby.opponentId) {
          player2Score++;
        }

        player1Kills += match.player1Kills || 0;
        player1Deaths += match.player1Deaths || 0;
        player2Kills += match.player2Kills || 0;
        player2Deaths += match.player2Deaths || 0;
      }

      return NextResponse.json({
        player1Name: lobby.host?.name || "Player 1",
        player2Name: lobby.opponent?.name || "Waiting...",
        player1Score,
        player2Score,
        player1Kills,
        player1Deaths,
        player2Kills,
        player2Deaths,
      });
    }

    if (tournamentId) {
      // TODO: Implement tournament stats fetching
      // For now, return placeholder data
      return NextResponse.json({
        player1Name: "Tournament",
        player2Name: "Stats",
        player1Score: 0,
        player2Score: 0,
        player1Kills: 0,
        player1Deaths: 0,
        player2Kills: 0,
        player2Deaths: 0,
      });
    }

    return NextResponse.json({ error: "Lobby or tournament ID required" }, { status: 400 });
  } catch (error) {
    console.error("Error fetching R6 stats:", error);
    return NextResponse.json(
      { error: "Failed to fetch stats" },
      { status: 500 }
    );
  }
}

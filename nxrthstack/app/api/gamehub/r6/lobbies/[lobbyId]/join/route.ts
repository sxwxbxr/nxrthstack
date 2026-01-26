import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db, r6Lobbies } from "@/lib/db";
import { eq, and } from "drizzle-orm";

interface RouteParams {
  params: Promise<{ lobbyId: string }>;
}

export async function POST(request: Request, { params }: RouteParams) {
  try {
    const session = await auth();
    if (!session?.user?.isFriend && session?.user?.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { lobbyId } = await params;

    const lobby = await db.query.r6Lobbies.findFirst({
      where: eq(r6Lobbies.id, lobbyId),
    });

    if (!lobby) {
      return NextResponse.json({ error: "Lobby not found" }, { status: 404 });
    }

    if (lobby.hostId === session.user.id) {
      return NextResponse.json(
        { error: "You cannot join your own lobby" },
        { status: 400 }
      );
    }

    if (lobby.opponentId) {
      return NextResponse.json(
        { error: "Lobby is already full" },
        { status: 400 }
      );
    }

    if (lobby.status !== "open") {
      return NextResponse.json(
        { error: "Lobby is not open for joining" },
        { status: 400 }
      );
    }

    const [updatedLobby] = await db
      .update(r6Lobbies)
      .set({
        opponentId: session.user.id,
        status: "active",
        updatedAt: new Date(),
      })
      .where(eq(r6Lobbies.id, lobbyId))
      .returning();

    return NextResponse.json({ lobby: updatedLobby });
  } catch (error) {
    console.error("Failed to join lobby:", error);
    return NextResponse.json(
      { error: "Failed to join lobby" },
      { status: 500 }
    );
  }
}

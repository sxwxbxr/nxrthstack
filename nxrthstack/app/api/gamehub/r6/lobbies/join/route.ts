import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db, r6Lobbies } from "@/lib/db";
import { eq } from "drizzle-orm";
import { z } from "zod";

const joinByCodeSchema = z.object({
  inviteCode: z.string().min(1),
});

export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.isFriend && session?.user?.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const parsed = joinByCodeSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0].message },
        { status: 400 }
      );
    }

    const lobby = await db.query.r6Lobbies.findFirst({
      where: eq(r6Lobbies.inviteCode, parsed.data.inviteCode.toUpperCase()),
    });

    if (!lobby) {
      return NextResponse.json(
        { error: "Invalid invite code" },
        { status: 404 }
      );
    }

    if (lobby.hostId === session.user.id) {
      return NextResponse.json(
        { error: "You cannot join your own lobby" },
        { status: 400 }
      );
    }

    if (lobby.opponentId === session.user.id) {
      // Already in lobby, return it
      return NextResponse.json({ lobby });
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
      .where(eq(r6Lobbies.id, lobby.id))
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

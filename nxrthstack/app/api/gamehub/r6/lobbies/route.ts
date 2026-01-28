import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db, r6Lobbies, users } from "@/lib/db";
import { eq, or, desc } from "drizzle-orm";
import { z } from "zod";
import { nanoid } from "nanoid";
import { unlockAchievement } from "@/lib/gamehub/unlock-achievement";

const createLobbySchema = z.object({
  name: z.string().min(1).max(100),
  trackKills: z.boolean().optional().default(false),
});

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.isFriend && session?.user?.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const lobbies = await db.query.r6Lobbies.findMany({
      where: or(
        eq(r6Lobbies.hostId, session.user.id),
        eq(r6Lobbies.opponentId, session.user.id)
      ),
      orderBy: [desc(r6Lobbies.updatedAt)],
      with: {
        host: true,
        opponent: true,
        matches: true,
      },
    });

    // Remove password hashes from user data
    const safeLobbies = lobbies.map((lobby) => ({
      ...lobby,
      host: lobby.host
        ? { id: lobby.host.id, name: lobby.host.name, email: lobby.host.email }
        : null,
      opponent: lobby.opponent
        ? {
            id: lobby.opponent.id,
            name: lobby.opponent.name,
            email: lobby.opponent.email,
          }
        : null,
    }));

    return NextResponse.json({ lobbies: safeLobbies });
  } catch (error) {
    console.error("Failed to fetch lobbies:", error);
    return NextResponse.json(
      { error: "Failed to fetch lobbies" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.isFriend && session?.user?.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const parsed = createLobbySchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0].message },
        { status: 400 }
      );
    }

    const inviteCode = nanoid(8).toUpperCase();

    const [lobby] = await db
      .insert(r6Lobbies)
      .values({
        name: parsed.data.name,
        hostId: session.user.id,
        inviteCode,
        trackKills: parsed.data.trackKills,
        status: "open",
      })
      .returning();

    // Unlock the lobby_host achievement
    await unlockAchievement(session.user.id, "lobby_host");

    return NextResponse.json({ lobby }, { status: 201 });
  } catch (error) {
    console.error("Failed to create lobby:", error);
    return NextResponse.json(
      { error: "Failed to create lobby" },
      { status: 500 }
    );
  }
}

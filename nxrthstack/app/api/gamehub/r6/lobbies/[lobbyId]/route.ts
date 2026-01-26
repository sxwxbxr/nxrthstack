import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db, r6Lobbies } from "@/lib/db";
import { eq, or, and } from "drizzle-orm";
import { z } from "zod";

interface RouteParams {
  params: Promise<{ lobbyId: string }>;
}

const updateLobbySchema = z.object({
  name: z.string().min(1).max(100).optional(),
  status: z.enum(["open", "active", "completed"]).optional(),
  trackKills: z.boolean().optional(),
  requestDeletion: z.boolean().optional(), // Request or cancel deletion
});

export async function GET(request: Request, { params }: RouteParams) {
  try {
    const session = await auth();
    if (!session?.user?.isFriend && session?.user?.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { lobbyId } = await params;

    const lobby = await db.query.r6Lobbies.findFirst({
      where: and(
        eq(r6Lobbies.id, lobbyId),
        or(
          eq(r6Lobbies.hostId, session.user.id),
          eq(r6Lobbies.opponentId, session.user.id)
        )
      ),
      with: {
        host: true,
        opponent: true,
        matches: {
          with: {
            winner: true,
          },
          orderBy: (matches, { desc }) => [desc(matches.createdAt)],
        },
      },
    });

    if (!lobby) {
      return NextResponse.json({ error: "Lobby not found" }, { status: 404 });
    }

    // Remove password hashes
    const safeLobby = {
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
      matches: lobby.matches.map((match) => ({
        ...match,
        winner: match.winner
          ? {
              id: match.winner.id,
              name: match.winner.name,
              email: match.winner.email,
            }
          : null,
      })),
    };

    return NextResponse.json({ lobby: safeLobby });
  } catch (error) {
    console.error("Failed to fetch lobby:", error);
    return NextResponse.json(
      { error: "Failed to fetch lobby" },
      { status: 500 }
    );
  }
}

export async function PATCH(request: Request, { params }: RouteParams) {
  try {
    const session = await auth();
    if (!session?.user?.isFriend && session?.user?.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { lobbyId } = await params;
    const body = await request.json();
    const parsed = updateLobbySchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0].message },
        { status: 400 }
      );
    }

    // Get the lobby and check if user is a participant
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
      return NextResponse.json(
        { error: "Lobby not found or you are not a participant" },
        { status: 404 }
      );
    }

    // Handle deletion request
    if (parsed.data.requestDeletion !== undefined) {
      if (parsed.data.requestDeletion) {
        // User wants to request deletion
        if (lobby.deletionRequestedBy === session.user.id) {
          return NextResponse.json(
            { error: "You have already requested deletion" },
            { status: 400 }
          );
        }

        const [updatedLobby] = await db
          .update(r6Lobbies)
          .set({
            deletionRequestedBy: session.user.id,
            updatedAt: new Date(),
          })
          .where(eq(r6Lobbies.id, lobbyId))
          .returning();

        return NextResponse.json({
          lobby: updatedLobby,
          message: "Deletion requested. Waiting for the other participant to confirm."
        });
      } else {
        // User wants to cancel their deletion request
        if (lobby.deletionRequestedBy !== session.user.id) {
          return NextResponse.json(
            { error: "You cannot cancel a deletion request you did not make" },
            { status: 400 }
          );
        }

        const [updatedLobby] = await db
          .update(r6Lobbies)
          .set({
            deletionRequestedBy: null,
            updatedAt: new Date(),
          })
          .where(eq(r6Lobbies.id, lobbyId))
          .returning();

        return NextResponse.json({
          lobby: updatedLobby,
          message: "Deletion request cancelled."
        });
      }
    }

    // Only host can update other lobby settings
    if (lobby.hostId !== session.user.id) {
      return NextResponse.json(
        { error: "Only the host can update lobby settings" },
        { status: 403 }
      );
    }

    const { requestDeletion, ...updateData } = parsed.data;
    const [updatedLobby] = await db
      .update(r6Lobbies)
      .set({
        ...updateData,
        updatedAt: new Date(),
      })
      .where(eq(r6Lobbies.id, lobbyId))
      .returning();

    return NextResponse.json({ lobby: updatedLobby });
  } catch (error) {
    console.error("Failed to update lobby:", error);
    return NextResponse.json(
      { error: "Failed to update lobby" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request, { params }: RouteParams) {
  try {
    const session = await auth();
    if (!session?.user?.isFriend && session?.user?.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { lobbyId } = await params;

    // Get the lobby and check if user is a participant
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
      return NextResponse.json(
        { error: "Lobby not found or you are not a participant" },
        { status: 404 }
      );
    }

    // If lobby has only one user (host), they can delete directly
    if (!lobby.opponentId) {
      if (lobby.hostId !== session.user.id) {
        return NextResponse.json(
          { error: "Only the host can delete an empty lobby" },
          { status: 403 }
        );
      }
      await db.delete(r6Lobbies).where(eq(r6Lobbies.id, lobbyId));
      return NextResponse.json({ success: true, message: "Lobby deleted." });
    }

    // Lobby has two users - require confirmation from the OTHER user
    if (!lobby.deletionRequestedBy) {
      return NextResponse.json(
        { error: "No deletion request pending. Request deletion first." },
        { status: 400 }
      );
    }

    if (lobby.deletionRequestedBy === session.user.id) {
      return NextResponse.json(
        { error: "You cannot confirm your own deletion request. The other participant must confirm." },
        { status: 400 }
      );
    }

    // The other user has requested deletion and current user is confirming - delete the lobby
    // This will cascade delete all matches due to onDelete: "cascade"
    await db.delete(r6Lobbies).where(eq(r6Lobbies.id, lobbyId));

    return NextResponse.json({ success: true, message: "Lobby deleted by mutual agreement." });
  } catch (error) {
    console.error("Failed to delete lobby:", error);
    return NextResponse.json(
      { error: "Failed to delete lobby" },
      { status: 500 }
    );
  }
}

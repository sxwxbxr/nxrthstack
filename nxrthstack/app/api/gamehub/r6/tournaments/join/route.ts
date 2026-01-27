import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { r6Tournaments, r6TournamentParticipants } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { z } from "zod";

const joinSchema = z.object({
  inviteCode: z.string().min(1).max(20),
});

// POST /api/gamehub/r6/tournaments/join - Join a tournament by invite code
export async function POST(request: Request) {
  try {
    const session = await auth();

    if (!session?.user?.isFriend && session?.user?.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const parsed = joinSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid input", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { inviteCode } = parsed.data;

    // Find tournament by invite code
    const tournament = await db.query.r6Tournaments.findFirst({
      where: eq(r6Tournaments.inviteCode, inviteCode.toUpperCase()),
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

    // Check if tournament is still in registration
    if (tournament.status !== "registration") {
      return NextResponse.json(
        { error: "Tournament has already started" },
        { status: 400 }
      );
    }

    // Check if user is already a participant
    const existingParticipant = tournament.participants.find(
      (p) => p.userId === session.user.id
    );

    if (existingParticipant) {
      return NextResponse.json(
        { error: "You are already in this tournament" },
        { status: 400 }
      );
    }

    // Check if tournament is full
    if (tournament.participants.length >= tournament.size) {
      return NextResponse.json(
        { error: "Tournament is full" },
        { status: 400 }
      );
    }

    // Add user as participant
    const nextSeed = tournament.participants.length + 1;
    await db.insert(r6TournamentParticipants).values({
      tournamentId: tournament.id,
      userId: session.user.id,
      seed: nextSeed,
    });

    // Update tournament timestamp
    await db
      .update(r6Tournaments)
      .set({ updatedAt: new Date() })
      .where(eq(r6Tournaments.id, tournament.id));

    // Fetch updated tournament
    const updatedTournament = await db.query.r6Tournaments.findFirst({
      where: eq(r6Tournaments.id, tournament.id),
      with: {
        host: {
          columns: { id: true, name: true, email: true },
        },
        participants: {
          with: {
            user: {
              columns: { id: true, name: true, email: true },
            },
          },
        },
      },
    });

    return NextResponse.json({ tournament: updatedTournament });
  } catch (error) {
    console.error("Error joining tournament:", error);
    return NextResponse.json(
      { error: "Failed to join tournament" },
      { status: 500 }
    );
  }
}

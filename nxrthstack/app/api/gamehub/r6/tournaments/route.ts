import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import {
  r6Tournaments,
  r6TournamentParticipants,
  users,
} from "@/lib/db/schema";
import { eq, or, desc } from "drizzle-orm";
import { z } from "zod";
import { nanoid } from "nanoid";

const createTournamentSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().max(500).optional(),
  size: z.number().refine((n) => [4, 8, 16, 32].includes(n), {
    message: "Size must be 4, 8, 16, or 32",
  }),
  format: z.enum(["single_elimination", "double_elimination"]).default("single_elimination"),
  trackKills: z.boolean().default(true),
  bestOf: z.number().refine((n) => [1, 3, 5].includes(n), {
    message: "Best of must be 1, 3, or 5",
  }).default(1),
});

// GET /api/gamehub/r6/tournaments - List tournaments user is part of
export async function GET() {
  try {
    const session = await auth();

    if (!session?.user?.isFriend && session?.user?.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get all tournaments where user is host or participant
    const participantTournaments = await db
      .select({ tournamentId: r6TournamentParticipants.tournamentId })
      .from(r6TournamentParticipants)
      .where(eq(r6TournamentParticipants.userId, session.user.id));

    const participantIds = participantTournaments.map((p) => p.tournamentId);

    const tournaments = await db.query.r6Tournaments.findMany({
      where: or(
        eq(r6Tournaments.hostId, session.user.id),
        ...participantIds.map((id) => eq(r6Tournaments.id, id))
      ),
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
      },
      orderBy: [desc(r6Tournaments.updatedAt)],
    });

    return NextResponse.json({ tournaments });
  } catch (error) {
    console.error("Error fetching tournaments:", error);
    return NextResponse.json(
      { error: "Failed to fetch tournaments" },
      { status: 500 }
    );
  }
}

// POST /api/gamehub/r6/tournaments - Create a new tournament
export async function POST(request: Request) {
  try {
    const session = await auth();

    if (!session?.user?.isFriend && session?.user?.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const parsed = createTournamentSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid input", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { name, description, size, format, trackKills, bestOf } = parsed.data;

    // Generate unique invite code
    const inviteCode = nanoid(8).toUpperCase();

    // Create tournament
    const [tournament] = await db
      .insert(r6Tournaments)
      .values({
        name,
        description,
        hostId: session.user.id,
        inviteCode,
        size,
        format,
        trackKills,
        bestOf,
      })
      .returning();

    // Auto-add host as first participant
    await db.insert(r6TournamentParticipants).values({
      tournamentId: tournament.id,
      userId: session.user.id,
      seed: 1,
    });

    // Fetch the complete tournament with relations
    const fullTournament = await db.query.r6Tournaments.findFirst({
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

    return NextResponse.json({ tournament: fullTournament }, { status: 201 });
  } catch (error) {
    console.error("Error creating tournament:", error);
    return NextResponse.json(
      { error: "Failed to create tournament" },
      { status: 500 }
    );
  }
}

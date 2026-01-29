import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import {
  getUserPreferences,
  updateUserPreferences,
} from "@/lib/notifications/service";
import { z } from "zod";

const preferencesSchema = z.object({
  gamehubAchievements: z.boolean().optional(),
  gamehubLobbyInvites: z.boolean().optional(),
  gamehubMatchResults: z.boolean().optional(),
  gamehubTournaments: z.boolean().optional(),
  gamehubAnnouncements: z.boolean().optional(),
  productUpdates: z.boolean().optional(),
  productUpdatesEmail: z.boolean().optional(),
  systemAnnouncements: z.boolean().optional(),
  systemAnnouncementsEmail: z.boolean().optional(),
});

// GET /api/notifications/preferences
export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const preferences = await getUserPreferences(session.user.id);

    // Return defaults if no preferences exist
    return NextResponse.json({
      preferences: preferences || {
        gamehubAchievements: true,
        gamehubLobbyInvites: true,
        gamehubMatchResults: true,
        gamehubTournaments: true,
        gamehubAnnouncements: true,
        productUpdates: true,
        productUpdatesEmail: true,
        systemAnnouncements: true,
        systemAnnouncementsEmail: true,
      },
    });
  } catch (error) {
    console.error("Error fetching preferences:", error);
    return NextResponse.json(
      { error: "Failed to fetch preferences" },
      { status: 500 }
    );
  }
}

// PATCH /api/notifications/preferences
export async function PATCH(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const parsed = preferencesSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid preferences", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const success = await updateUserPreferences(session.user.id, parsed.data);

    if (!success) {
      return NextResponse.json(
        { error: "Failed to update preferences" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error updating preferences:", error);
    return NextResponse.json(
      { error: "Failed to update preferences" },
      { status: 500 }
    );
  }
}

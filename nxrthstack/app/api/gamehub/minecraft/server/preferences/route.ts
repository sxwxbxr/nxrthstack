import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { mcDashboardPreferences } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const [prefs] = await db
      .select()
      .from(mcDashboardPreferences)
      .where(eq(mcDashboardPreferences.userId, session.user.id))
      .limit(1);

    return NextResponse.json({
      preferences: prefs
        ? {
            theme: prefs.theme,
            consoleFontSize: prefs.consoleFontSize,
            consoleTimestamps: prefs.consoleTimestamps,
            customColors: prefs.customColors,
          }
        : null,
    });
  } catch (error) {
    console.error("Error fetching preferences:", error);
    return NextResponse.json({ error: "Failed to fetch preferences" }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { preferences } = await request.json();
    if (!preferences) {
      return NextResponse.json(
        { error: "preferences is required" },
        { status: 400 }
      );
    }

    const [existing] = await db
      .select({ id: mcDashboardPreferences.id })
      .from(mcDashboardPreferences)
      .where(eq(mcDashboardPreferences.userId, session.user.id))
      .limit(1);

    if (existing) {
      await db
        .update(mcDashboardPreferences)
        .set({
          ...preferences,
          updatedAt: new Date(),
        })
        .where(eq(mcDashboardPreferences.id, existing.id));
    } else {
      await db.insert(mcDashboardPreferences).values({
        userId: session.user.id,
        ...preferences,
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error saving preferences:", error);
    return NextResponse.json({ error: "Failed to save preferences" }, { status: 500 });
  }
}

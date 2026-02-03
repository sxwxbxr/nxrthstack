import { NextResponse } from "next/server";
import { getSessionWithUser } from "@/lib/auth/server";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

export async function POST() {
  try {
    const { user } = await getSessionWithUser();

    if (!user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Remove Discord connection
    await db
      .update(users)
      .set({
        discordId: null,
        discordUsername: null,
        discordAvatar: null,
        discordConnectedAt: null,
        updatedAt: new Date(),
      })
      .where(eq(users.id, user.id));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Discord disconnect error:", error);
    return NextResponse.json(
      { error: "Failed to disconnect Discord" },
      { status: 500 }
    );
  }
}

import { NextResponse } from "next/server";
import { getSessionWithUser } from "@/lib/auth/server";
import { db, users } from "@/lib/db";
import { eq } from "drizzle-orm";

export const dynamic = "force-dynamic";

// GET - Check onboarding status
export async function GET() {
  try {
    const { user } = await getSessionWithUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    return NextResponse.json({
      complete: user.gamehubOnboardingComplete,
    });
  } catch (error) {
    console.error("Error fetching onboarding status:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// POST - Complete onboarding
export async function POST(request: Request) {
  try {
    const { user } = await getSessionWithUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Update user's onboarding status
    await db
      .update(users)
      .set({
        gamehubOnboardingComplete: true,
        updatedAt: new Date(),
      })
      .where(eq(users.id, user.id));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error completing onboarding:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";
import {
  getOrCreateProfile,
  updateProfile,
  getUserAchievements,
} from "@/lib/gamehub/profiles";

// GET /api/gamehub/profile - Get current user's profile
export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const [profile, achievements] = await Promise.all([
      getOrCreateProfile(session.user.id),
      getUserAchievements(session.user.id),
    ]);

    return NextResponse.json({ profile, achievements });
  } catch (error) {
    console.error("Error fetching profile:", error);
    return NextResponse.json(
      { error: "Failed to fetch profile" },
      { status: 500 }
    );
  }
}

// PATCH /api/gamehub/profile - Update profile
export async function PATCH(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const {
      bio,
      bannerUrl,
      usernameSlug,
      socialLinks,
      isPublic,
      showStats,
      showActivity,
      featuredAchievements,
    } = body;

    const result = await updateProfile(session.user.id, {
      bio,
      bannerUrl,
      usernameSlug,
      socialLinks,
      isPublic,
      showStats,
      showActivity,
      featuredAchievements,
    });

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error updating profile:", error);
    return NextResponse.json(
      { error: "Failed to update profile" },
      { status: 500 }
    );
  }
}

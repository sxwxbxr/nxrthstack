import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";
import { likeActivity } from "@/lib/gamehub/activity";

type RouteParams = {
  params: Promise<{ activityId: string }>;
};

// POST /api/gamehub/activity/[activityId]/like - Toggle like
export async function POST(request: Request, { params }: RouteParams) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { activityId } = await params;
    const result = await likeActivity(session.user.id, activityId);

    return NextResponse.json(result);
  } catch (error) {
    console.error("Error toggling like:", error);
    return NextResponse.json(
      { error: "Failed to toggle like" },
      { status: 500 }
    );
  }
}

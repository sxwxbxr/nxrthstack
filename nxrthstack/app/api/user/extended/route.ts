import { NextResponse } from "next/server";
import { neonAuth } from "@neondatabase/auth/next/server";
import { getExtendedUser } from "@/lib/auth/server";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const { session, user } = await neonAuth();

    if (!session || !user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const extendedUser = await getExtendedUser(user.id);

    if (!extendedUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json(extendedUser);
  } catch (error) {
    console.error("Error fetching extended user:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

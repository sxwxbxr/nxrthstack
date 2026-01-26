import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db, r6Operators } from "@/lib/db";
import { eq } from "drizzle-orm";

export async function GET(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.isFriend && session?.user?.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const url = new URL(request.url);
    const role = url.searchParams.get("role"); // 'attacker' | 'defender'

    let operators;
    if (role === "attacker" || role === "defender") {
      operators = await db.query.r6Operators.findMany({
        where: eq(r6Operators.role, role),
      });
    } else {
      operators = await db.query.r6Operators.findMany({
        where: eq(r6Operators.isActive, true),
      });
    }

    return NextResponse.json({ operators });
  } catch (error) {
    console.error("Failed to fetch operators:", error);
    return NextResponse.json(
      { error: "Failed to fetch operators" },
      { status: 500 }
    );
  }
}

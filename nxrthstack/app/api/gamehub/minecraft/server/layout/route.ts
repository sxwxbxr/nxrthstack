import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { mcDashboardLayouts } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";

export async function GET(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const serverId = searchParams.get("serverId");
    const page = searchParams.get("page") || "overview";

    if (!serverId) {
      return NextResponse.json({ error: "serverId is required" }, { status: 400 });
    }

    const [layout] = await db
      .select()
      .from(mcDashboardLayouts)
      .where(
        and(
          eq(mcDashboardLayouts.userId, session.user.id),
          eq(mcDashboardLayouts.serverId, serverId),
          eq(mcDashboardLayouts.page, page)
        )
      )
      .limit(1);

    return NextResponse.json({ layout: layout?.layouts || null });
  } catch (error) {
    console.error("Error fetching layout:", error);
    return NextResponse.json({ error: "Failed to fetch layout" }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { serverId, page, layout } = await request.json();
    if (!serverId || !page || !layout) {
      return NextResponse.json(
        { error: "serverId, page, and layout are required" },
        { status: 400 }
      );
    }

    // Upsert layout
    const [existing] = await db
      .select({ id: mcDashboardLayouts.id })
      .from(mcDashboardLayouts)
      .where(
        and(
          eq(mcDashboardLayouts.userId, session.user.id),
          eq(mcDashboardLayouts.serverId, serverId),
          eq(mcDashboardLayouts.page, page)
        )
      )
      .limit(1);

    if (existing) {
      await db
        .update(mcDashboardLayouts)
        .set({ layouts: layout, updatedAt: new Date() })
        .where(eq(mcDashboardLayouts.id, existing.id));
    } else {
      await db.insert(mcDashboardLayouts).values({
        userId: session.user.id,
        serverId,
        page,
        layouts: layout,
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error saving layout:", error);
    return NextResponse.json({ error: "Failed to save layout" }, { status: 500 });
  }
}

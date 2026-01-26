import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db, gamehubAnnouncements } from "@/lib/db";
import { eq } from "drizzle-orm";
import { z } from "zod";

interface RouteParams {
  params: Promise<{ id: string }>;
}

const updateAnnouncementSchema = z.object({
  title: z.string().min(1).max(255).optional(),
  content: z.string().min(1).optional(),
  category: z.enum(["general", "r6", "minecraft"]).nullable().optional(),
  isPinned: z.boolean().optional(),
  isActive: z.boolean().optional(),
});

export async function GET(request: Request, { params }: RouteParams) {
  try {
    const session = await auth();
    if (!session?.user || session.user.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    const announcement = await db.query.gamehubAnnouncements.findFirst({
      where: eq(gamehubAnnouncements.id, id),
    });

    if (!announcement) {
      return NextResponse.json(
        { error: "Announcement not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ announcement });
  } catch (error) {
    console.error("Failed to fetch announcement:", error);
    return NextResponse.json(
      { error: "Failed to fetch announcement" },
      { status: 500 }
    );
  }
}

export async function PATCH(request: Request, { params }: RouteParams) {
  try {
    const session = await auth();
    if (!session?.user || session.user.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    const parsed = updateAnnouncementSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0].message },
        { status: 400 }
      );
    }

    const [updatedAnnouncement] = await db
      .update(gamehubAnnouncements)
      .set({
        ...parsed.data,
        updatedAt: new Date(),
      })
      .where(eq(gamehubAnnouncements.id, id))
      .returning();

    if (!updatedAnnouncement) {
      return NextResponse.json(
        { error: "Announcement not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ announcement: updatedAnnouncement });
  } catch (error) {
    console.error("Failed to update announcement:", error);
    return NextResponse.json(
      { error: "Failed to update announcement" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request, { params }: RouteParams) {
  try {
    const session = await auth();
    if (!session?.user || session.user.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    const [deletedAnnouncement] = await db
      .delete(gamehubAnnouncements)
      .where(eq(gamehubAnnouncements.id, id))
      .returning({ id: gamehubAnnouncements.id });

    if (!deletedAnnouncement) {
      return NextResponse.json(
        { error: "Announcement not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to delete announcement:", error);
    return NextResponse.json(
      { error: "Failed to delete announcement" },
      { status: 500 }
    );
  }
}

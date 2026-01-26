import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db, gamehubAnnouncements } from "@/lib/db";
import { desc } from "drizzle-orm";
import { z } from "zod";

const createAnnouncementSchema = z.object({
  title: z.string().min(1).max(255),
  content: z.string().min(1),
  category: z.enum(["general", "r6", "minecraft"]).nullable().optional(),
  isPinned: z.boolean().optional().default(false),
  isActive: z.boolean().optional().default(true),
});

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user || session.user.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const announcements = await db.query.gamehubAnnouncements.findMany({
      orderBy: [desc(gamehubAnnouncements.isPinned), desc(gamehubAnnouncements.createdAt)],
    });

    return NextResponse.json({ announcements });
  } catch (error) {
    console.error("Failed to fetch announcements:", error);
    return NextResponse.json(
      { error: "Failed to fetch announcements" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session?.user || session.user.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const parsed = createAnnouncementSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0].message },
        { status: 400 }
      );
    }

    const [announcement] = await db
      .insert(gamehubAnnouncements)
      .values({
        title: parsed.data.title,
        content: parsed.data.content,
        category: parsed.data.category || null,
        isPinned: parsed.data.isPinned,
        isActive: parsed.data.isActive,
      })
      .returning();

    return NextResponse.json({ announcement }, { status: 201 });
  } catch (error) {
    console.error("Failed to create announcement:", error);
    return NextResponse.json(
      { error: "Failed to create announcement" },
      { status: 500 }
    );
  }
}

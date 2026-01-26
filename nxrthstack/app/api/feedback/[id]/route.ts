import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db, featureRequests } from "@/lib/db";
import { eq, and } from "drizzle-orm";
import { z } from "zod";

interface RouteParams {
  params: Promise<{ id: string }>;
}

const updateRequestSchema = z.object({
  title: z.string().min(5).max(200).optional(),
  description: z.string().min(20).max(2000).optional(),
  category: z.enum(["gamehub", "shop", "dashboard", "general"]).optional(),
});

const adminUpdateSchema = z.object({
  status: z.enum(["pending", "approved", "in_progress", "completed", "rejected"]).optional(),
  priority: z.enum(["low", "medium", "high", "critical"]).optional().nullable(),
  adminNotes: z.string().max(1000).optional().nullable(),
});

// Update a feature request
export async function PATCH(request: Request, { params }: RouteParams) {
  try {
    const session = await auth();
    if (!session?.user?.isFriend && session?.user?.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    const isAdmin = session.user.role === "admin";

    // Get the existing request
    const existingRequest = await db.query.featureRequests.findFirst({
      where: eq(featureRequests.id, id),
    });

    if (!existingRequest) {
      return NextResponse.json({ error: "Request not found" }, { status: 404 });
    }

    // Admins can update status, priority, and admin notes
    if (isAdmin) {
      const parsed = adminUpdateSchema.safeParse(body);
      if (!parsed.success) {
        return NextResponse.json(
          { error: parsed.error.issues[0].message },
          { status: 400 }
        );
      }

      const [updated] = await db
        .update(featureRequests)
        .set({
          ...parsed.data,
          updatedAt: new Date(),
        })
        .where(eq(featureRequests.id, id))
        .returning();

      return NextResponse.json({ request: updated });
    }

    // Regular users can only update their own requests
    if (existingRequest.authorId !== session.user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Can only edit pending requests
    if (existingRequest.status !== "pending") {
      return NextResponse.json(
        { error: "Can only edit pending requests" },
        { status: 400 }
      );
    }

    const parsed = updateRequestSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0].message },
        { status: 400 }
      );
    }

    const [updated] = await db
      .update(featureRequests)
      .set({
        ...parsed.data,
        updatedAt: new Date(),
      })
      .where(eq(featureRequests.id, id))
      .returning();

    return NextResponse.json({ request: updated });
  } catch (error) {
    console.error("Failed to update feature request:", error);
    return NextResponse.json(
      { error: "Failed to update feature request" },
      { status: 500 }
    );
  }
}

// Delete a feature request
export async function DELETE(request: Request, { params }: RouteParams) {
  try {
    const session = await auth();
    if (!session?.user?.isFriend && session?.user?.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const isAdmin = session.user.role === "admin";

    // Get the existing request
    const existingRequest = await db.query.featureRequests.findFirst({
      where: eq(featureRequests.id, id),
    });

    if (!existingRequest) {
      return NextResponse.json({ error: "Request not found" }, { status: 404 });
    }

    // Admins can delete any request, users can only delete their own pending requests
    if (!isAdmin) {
      if (existingRequest.authorId !== session.user.id) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }
      if (existingRequest.status !== "pending") {
        return NextResponse.json(
          { error: "Can only delete pending requests" },
          { status: 400 }
        );
      }
    }

    await db.delete(featureRequests).where(eq(featureRequests.id, id));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to delete feature request:", error);
    return NextResponse.json(
      { error: "Failed to delete feature request" },
      { status: 500 }
    );
  }
}

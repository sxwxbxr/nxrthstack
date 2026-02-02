import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db, productImages } from "@/lib/db";
import { eq, and } from "drizzle-orm";

interface RouteParams {
  params: Promise<{ id: string; imageId: string }>;
}

// DELETE an image
export async function DELETE(request: Request, { params }: RouteParams) {
  try {
    const session = await auth();
    if (!session?.user || session.user.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id, imageId } = await params;

    // Get the image to check if it was primary
    const image = await db.query.productImages.findFirst({
      where: and(
        eq(productImages.id, imageId),
        eq(productImages.productId, id)
      ),
    });

    if (!image) {
      return NextResponse.json({ error: "Image not found" }, { status: 404 });
    }

    // Delete the image
    await db
      .delete(productImages)
      .where(
        and(
          eq(productImages.id, imageId),
          eq(productImages.productId, id)
        )
      );

    // If this was the primary image, make another one primary
    if (image.isPrimary) {
      const remainingImages = await db.query.productImages.findMany({
        where: eq(productImages.productId, id),
        orderBy: (images, { asc }) => [asc(images.sortOrder)],
        limit: 1,
      });

      if (remainingImages.length > 0) {
        await db
          .update(productImages)
          .set({ isPrimary: true })
          .where(eq(productImages.id, remainingImages[0].id));
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to delete image:", error);
    return NextResponse.json(
      { error: "Failed to delete image" },
      { status: 500 }
    );
  }
}

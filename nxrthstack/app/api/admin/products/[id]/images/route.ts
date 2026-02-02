import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db, productImages, products } from "@/lib/db";
import { eq, and, asc } from "drizzle-orm";
import { z } from "zod";

const addImageSchema = z.object({
  url: z.string().url(),
  altText: z.string().optional(),
  isPrimary: z.boolean().optional(),
});

const reorderSchema = z.object({
  imageIds: z.array(z.string().uuid()),
});

interface RouteParams {
  params: Promise<{ id: string }>;
}

// GET all images for a product
export async function GET(request: Request, { params }: RouteParams) {
  try {
    const session = await auth();
    if (!session?.user || session.user.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    const images = await db.query.productImages.findMany({
      where: eq(productImages.productId, id),
      orderBy: [asc(productImages.sortOrder)],
    });

    return NextResponse.json({ images });
  } catch (error) {
    console.error("Failed to fetch images:", error);
    return NextResponse.json(
      { error: "Failed to fetch images" },
      { status: 500 }
    );
  }
}

// POST add a new image
export async function POST(request: Request, { params }: RouteParams) {
  try {
    const session = await auth();
    if (!session?.user || session.user.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    const parsed = addImageSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0].message },
        { status: 400 }
      );
    }

    // Verify product exists
    const product = await db.query.products.findFirst({
      where: eq(products.id, id),
    });

    if (!product) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    // Get max sort order
    const existingImages = await db.query.productImages.findMany({
      where: eq(productImages.productId, id),
    });

    const maxOrder = existingImages.reduce((max, img) =>
      Math.max(max, img.sortOrder), -1
    );

    // If this should be primary, unset others first
    if (parsed.data.isPrimary) {
      await db
        .update(productImages)
        .set({ isPrimary: false })
        .where(eq(productImages.productId, id));
    }

    // If no images exist, make this one primary
    const shouldBePrimary = parsed.data.isPrimary ?? existingImages.length === 0;

    const [newImage] = await db
      .insert(productImages)
      .values({
        productId: id,
        url: parsed.data.url,
        altText: parsed.data.altText || null,
        sortOrder: maxOrder + 1,
        isPrimary: shouldBePrimary,
      })
      .returning();

    return NextResponse.json({ image: newImage }, { status: 201 });
  } catch (error) {
    console.error("Failed to add image:", error);
    return NextResponse.json(
      { error: "Failed to add image" },
      { status: 500 }
    );
  }
}

// PATCH reorder images or update an image
export async function PATCH(request: Request, { params }: RouteParams) {
  try {
    const session = await auth();
    if (!session?.user || session.user.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();

    // Check if this is a reorder request
    if (body.imageIds) {
      const parsed = reorderSchema.safeParse(body);
      if (!parsed.success) {
        return NextResponse.json(
          { error: parsed.error.issues[0].message },
          { status: 400 }
        );
      }

      // Update sort order for each image
      const updates = parsed.data.imageIds.map((imageId, index) =>
        db
          .update(productImages)
          .set({ sortOrder: index })
          .where(
            and(
              eq(productImages.id, imageId),
              eq(productImages.productId, id)
            )
          )
      );

      await Promise.all(updates);

      return NextResponse.json({ success: true });
    }

    // Otherwise, update a single image (set as primary)
    if (body.imageId && body.isPrimary !== undefined) {
      // Unset all other primaries first
      await db
        .update(productImages)
        .set({ isPrimary: false })
        .where(eq(productImages.productId, id));

      // Set the new primary
      if (body.isPrimary) {
        await db
          .update(productImages)
          .set({ isPrimary: true })
          .where(
            and(
              eq(productImages.id, body.imageId),
              eq(productImages.productId, id)
            )
          );
      }

      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  } catch (error) {
    console.error("Failed to update images:", error);
    return NextResponse.json(
      { error: "Failed to update images" },
      { status: 500 }
    );
  }
}

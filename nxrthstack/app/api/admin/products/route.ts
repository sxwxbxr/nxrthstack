import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db, products } from "@/lib/db";
import { desc, eq } from "drizzle-orm";
import { z } from "zod";

const createProductSchema = z.object({
  name: z.string().min(1),
  slug: z.string().min(1),
  description: z.string().optional(),
  shortDescription: z.string().optional(),
  productType: z.enum(["free", "paid", "subscription"]),
  availability: z.enum(["available", "coming_soon", "discontinued"]).optional(),
  imageUrl: z.string().url().optional().or(z.literal("")),
});

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user || session.user.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const allProducts = await db.query.products.findMany({
      orderBy: [desc(products.createdAt)],
      with: {
        prices: true,
      },
    });

    return NextResponse.json({ products: allProducts });
  } catch (error) {
    console.error("Failed to fetch products:", error);
    return NextResponse.json(
      { error: "Failed to fetch products" },
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
    const parsed = createProductSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0].message },
        { status: 400 }
      );
    }

    const { name, slug, description, shortDescription, productType, availability, imageUrl } =
      parsed.data;

    // Check if slug already exists
    const existingProduct = await db.query.products.findFirst({
      where: eq(products.slug, slug),
    });

    if (existingProduct) {
      return NextResponse.json(
        { error: "A product with this slug already exists" },
        { status: 400 }
      );
    }

    const [newProduct] = await db
      .insert(products)
      .values({
        name,
        slug,
        description: description || null,
        shortDescription: shortDescription || null,
        productType,
        availability: availability || "available",
        imageUrl: imageUrl || null,
        isActive: true,
      })
      .returning();

    return NextResponse.json({ product: newProduct }, { status: 201 });
  } catch (error) {
    console.error("Failed to create product:", error);
    return NextResponse.json(
      { error: "Failed to create product" },
      { status: 500 }
    );
  }
}

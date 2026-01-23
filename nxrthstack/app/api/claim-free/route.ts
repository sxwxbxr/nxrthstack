import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db, purchases, products } from "@/lib/db";
import { eq, and } from "drizzle-orm";

export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { productId } = await request.json();

    if (!productId) {
      return NextResponse.json(
        { error: "Product ID is required" },
        { status: 400 }
      );
    }

    // Verify the product exists and is free
    const product = await db.query.products.findFirst({
      where: and(eq(products.id, productId), eq(products.isActive, true)),
    });

    if (!product) {
      return NextResponse.json(
        { error: "Product not found" },
        { status: 404 }
      );
    }

    if (product.productType !== "free") {
      return NextResponse.json(
        { error: "This product is not free" },
        { status: 400 }
      );
    }

    // Check if user already claimed this product
    const existingPurchase = await db.query.purchases.findFirst({
      where: and(
        eq(purchases.userId, session.user.id),
        eq(purchases.productId, productId),
        eq(purchases.status, "completed")
      ),
    });

    if (existingPurchase) {
      return NextResponse.json(
        { error: "You already have this product", alreadyClaimed: true },
        { status: 400 }
      );
    }

    // Create a purchase record for the free product
    const [purchase] = await db
      .insert(purchases)
      .values({
        userId: session.user.id,
        productId: productId,
        priceId: null,
        amountCents: 0,
        currency: "USD",
        status: "completed",
        completedAt: new Date(),
      })
      .returning();

    return NextResponse.json({
      success: true,
      purchaseId: purchase.id,
      message: "Product added to your library",
    });
  } catch (error) {
    console.error("Failed to claim free product:", error);
    return NextResponse.json(
      { error: "Failed to claim product" },
      { status: 500 }
    );
  }
}

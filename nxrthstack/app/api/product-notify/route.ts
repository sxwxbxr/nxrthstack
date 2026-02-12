import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db, products, productNotifyRequests } from "@/lib/db";
import { eq, and } from "drizzle-orm";
import { z } from "zod";

const notifySchema = z.object({
  productId: z.string().uuid(),
  email: z.string().email(),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = notifySchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid email address" },
        { status: 400 }
      );
    }

    const { productId, email } = parsed.data;

    // Verify product exists and is coming_soon
    const product = await db.query.products.findFirst({
      where: and(
        eq(products.id, productId),
        eq(products.availability, "coming_soon")
      ),
    });

    if (!product) {
      return NextResponse.json(
        { error: "Product not found or not in Coming Soon status" },
        { status: 404 }
      );
    }

    // Check if already subscribed
    const existing = await db.query.productNotifyRequests.findFirst({
      where: and(
        eq(productNotifyRequests.productId, productId),
        eq(productNotifyRequests.email, email)
      ),
    });

    if (existing) {
      return NextResponse.json({ success: true, alreadySubscribed: true });
    }

    // Get user ID if authenticated
    const session = await auth();
    const userId = session?.user?.id || null;

    await db.insert(productNotifyRequests).values({
      productId,
      email,
      userId,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to create notify request:", error);
    return NextResponse.json(
      { error: "Failed to subscribe for notifications" },
      { status: 500 }
    );
  }
}

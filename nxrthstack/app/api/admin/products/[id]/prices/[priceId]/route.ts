import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db, productPrices } from "@/lib/db";
import { eq } from "drizzle-orm";
import { z } from "zod";

const updatePriceSchema = z.object({
  name: z.string().min(1).optional(),
  priceCents: z.number().min(0).optional(),
  billingPeriod: z.enum(["monthly", "annual", "custom"]).nullable().optional(),
  billingIntervalCount: z.number().min(1).optional(),
  features: z.array(z.string()).optional(),
  isActive: z.boolean().optional(),
});

interface RouteParams {
  params: Promise<{ id: string; priceId: string }>;
}

export async function PUT(request: Request, { params }: RouteParams) {
  try {
    const session = await auth();
    if (!session?.user || session.user.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { priceId } = await params;
    const body = await request.json();
    const parsed = updatePriceSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.errors[0].message },
        { status: 400 }
      );
    }

    const [updatedPrice] = await db
      .update(productPrices)
      .set(parsed.data)
      .where(eq(productPrices.id, priceId))
      .returning();

    if (!updatedPrice) {
      return NextResponse.json({ error: "Price not found" }, { status: 404 });
    }

    return NextResponse.json({ price: updatedPrice });
  } catch (error) {
    console.error("Failed to update price:", error);
    return NextResponse.json(
      { error: "Failed to update price" },
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

    const { priceId } = await params;

    const [deletedPrice] = await db
      .delete(productPrices)
      .where(eq(productPrices.id, priceId))
      .returning({ id: productPrices.id });

    if (!deletedPrice) {
      return NextResponse.json({ error: "Price not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to delete price:", error);
    return NextResponse.json(
      { error: "Failed to delete price" },
      { status: 500 }
    );
  }
}

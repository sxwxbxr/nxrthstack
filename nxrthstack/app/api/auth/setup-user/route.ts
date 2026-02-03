import { NextResponse } from "next/server";
import { z } from "zod";
import { db, users } from "@/lib/db";
import { eq } from "drizzle-orm";
import { stripe } from "@/lib/stripe";

const setupUserSchema = z.object({
  neonAuthUserId: z.string(),
  email: z.string().email(),
  name: z.string().min(1),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = setupUserSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0].message },
        { status: 400 }
      );
    }

    const { neonAuthUserId, email, name } = parsed.data;
    const normalizedEmail = email.toLowerCase();

    // Check if user already exists by email
    const existingUser = await db.query.users.findFirst({
      where: eq(users.email, normalizedEmail),
    });

    if (existingUser) {
      // User exists - maybe they're logging in after being migrated
      // Just ensure the neonAuthUserId is set
      if (!existingUser.neonAuthUserId) {
        await db
          .update(users)
          .set({
            neonAuthUserId,
            updatedAt: new Date(),
          })
          .where(eq(users.id, existingUser.id));
      }

      return NextResponse.json({
        success: true,
        userId: existingUser.id,
        isExisting: true,
      });
    }

    // Create Stripe customer for new user
    let stripeCustomerId: string | null = null;
    try {
      const customer = await stripe.customers.create({
        email: normalizedEmail,
        name,
      });
      stripeCustomerId = customer.id;
    } catch (stripeError) {
      console.error("Stripe customer creation failed:", stripeError);
      // Continue without Stripe customer - can be created later
    }

    // Create new local user record
    const [newUser] = await db
      .insert(users)
      .values({
        neonAuthUserId,
        email: normalizedEmail,
        name,
        role: "customer",
        isFriend: false,
        gamehubOnboardingComplete: false,
        stripeCustomerId,
      })
      .returning({ id: users.id });

    return NextResponse.json({
      success: true,
      userId: newUser.id,
      isExisting: false,
    });
  } catch (error) {
    console.error("User setup error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

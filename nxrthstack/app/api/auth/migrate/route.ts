import { NextResponse } from "next/server";
import { z } from "zod";
import {
  getExtendedUserByEmail,
  verifyLegacyPassword,
  linkNeonAuthUser,
} from "@/lib/auth/server";

const migrateSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = migrateSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid email or password format" },
        { status: 400 }
      );
    }

    const { email, password } = parsed.data;

    // Check if user exists
    const existingUser = await getExtendedUserByEmail(email);

    if (!existingUser) {
      // User doesn't exist at all - they should register instead
      return NextResponse.json(
        { status: "new_user", message: "No account found" },
        { status: 200 }
      );
    }

    // Check if user is already migrated
    if (existingUser.neonAuthUserId) {
      // Already migrated - proceed directly with Neon Auth login
      return NextResponse.json(
        { status: "already_migrated", message: "Account already migrated" },
        { status: 200 }
      );
    }

    // User has legacy password - verify it
    const { valid, user } = await verifyLegacyPassword(email, password);

    if (!valid || !user) {
      return NextResponse.json(
        { error: "Invalid email or password" },
        { status: 401 }
      );
    }

    // Legacy user with valid password - needs migration
    // Return the user info so the frontend can create Neon Auth account
    // and then call back to link the accounts
    return NextResponse.json({
      status: "needs_migration",
      userId: user.id,
      email: user.email,
      name: user.name,
    });
  } catch (error) {
    console.error("Migration check error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// Link accounts after Neon Auth account is created
export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { localUserId, neonAuthUserId } = body;

    if (!localUserId || !neonAuthUserId) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    await linkNeonAuthUser(localUserId, neonAuthUserId);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Account linking error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

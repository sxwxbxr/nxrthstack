import { NextResponse } from "next/server";
import { authServer } from "@/lib/auth/server";
import { z } from "zod";

const updatePasswordSchema = z.object({
  currentPassword: z.string().min(1, "Current password is required"),
  newPassword: z.string().min(8, "Password must be at least 8 characters"),
});

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const parsed = updatePasswordSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0].message },
        { status: 400 }
      );
    }

    const { currentPassword, newPassword } = parsed.data;

    // Use Neon Auth to change password
    const result = await authServer.changePassword({
      currentPassword,
      newPassword,
    });

    if (result.error) {
      return NextResponse.json(
        { error: result.error.message || "Failed to change password" },
        { status: result.error.status || 400 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Password update error:", error);
    return NextResponse.json(
      { error: "Failed to update password" },
      { status: 500 }
    );
  }
}

import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

const DISCORD_CLIENT_ID = process.env.DISCORD_CLIENT_ID;
const DISCORD_CLIENT_SECRET = process.env.DISCORD_CLIENT_SECRET;
const DISCORD_REDIRECT_URI = `${process.env.NEXTAUTH_URL}/api/auth/discord/callback`;

interface DiscordUser {
  id: string;
  username: string;
  avatar: string | null;
  discriminator: string;
  global_name: string | null;
}

export async function GET(request: Request) {
  try {
    const session = await auth();
    const url = new URL(request.url);
    const code = url.searchParams.get("code");
    const state = url.searchParams.get("state");
    const error = url.searchParams.get("error");

    // Handle user cancellation or error
    if (error) {
      return NextResponse.redirect(
        new URL("/dashboard/settings?discord=cancelled", process.env.NEXTAUTH_URL!)
      );
    }

    if (!code || !state) {
      return NextResponse.redirect(
        new URL("/dashboard/settings?discord=error", process.env.NEXTAUTH_URL!)
      );
    }

    // Verify state and get user ID
    let stateData: { userId: string };
    try {
      stateData = JSON.parse(Buffer.from(state, "base64").toString());
    } catch {
      return NextResponse.redirect(
        new URL("/dashboard/settings?discord=invalid_state", process.env.NEXTAUTH_URL!)
      );
    }

    // Verify the user is still logged in
    if (!session?.user?.id || session.user.id !== stateData.userId) {
      return NextResponse.redirect(
        new URL("/login", process.env.NEXTAUTH_URL!)
      );
    }

    // Exchange code for access token
    const tokenResponse = await fetch("https://discord.com/api/oauth2/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        client_id: DISCORD_CLIENT_ID!,
        client_secret: DISCORD_CLIENT_SECRET!,
        grant_type: "authorization_code",
        code,
        redirect_uri: DISCORD_REDIRECT_URI!,
      }),
    });

    if (!tokenResponse.ok) {
      console.error("Discord token error:", await tokenResponse.text());
      return NextResponse.redirect(
        new URL("/dashboard/settings?discord=token_error", process.env.NEXTAUTH_URL!)
      );
    }

    const tokenData = await tokenResponse.json();

    // Fetch Discord user info
    const userResponse = await fetch("https://discord.com/api/users/@me", {
      headers: {
        Authorization: `Bearer ${tokenData.access_token}`,
      },
    });

    if (!userResponse.ok) {
      console.error("Discord user error:", await userResponse.text());
      return NextResponse.redirect(
        new URL("/dashboard/settings?discord=user_error", process.env.NEXTAUTH_URL!)
      );
    }

    const discordUser: DiscordUser = await userResponse.json();

    // Check if this Discord account is already linked to another user
    const [existingUser] = await db
      .select()
      .from(users)
      .where(eq(users.discordId, discordUser.id))
      .limit(1);

    if (existingUser && existingUser.id !== session.user.id) {
      return NextResponse.redirect(
        new URL("/dashboard/settings?discord=already_linked", process.env.NEXTAUTH_URL!)
      );
    }

    // Update user with Discord info
    const displayName = discordUser.global_name || discordUser.username;
    await db
      .update(users)
      .set({
        discordId: discordUser.id,
        discordUsername: displayName,
        discordAvatar: discordUser.avatar
          ? `https://cdn.discordapp.com/avatars/${discordUser.id}/${discordUser.avatar}.png`
          : null,
        discordConnectedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(users.id, session.user.id));

    return NextResponse.redirect(
      new URL("/dashboard/settings?discord=success", process.env.NEXTAUTH_URL!)
    );
  } catch (error) {
    console.error("Discord callback error:", error);
    return NextResponse.redirect(
      new URL("/dashboard/settings?discord=error", process.env.NEXTAUTH_URL!)
    );
  }
}

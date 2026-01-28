import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";

const DISCORD_CLIENT_ID = process.env.DISCORD_CLIENT_ID;
const DISCORD_REDIRECT_URI = `${process.env.NEXTAUTH_URL}/api/auth/discord/callback`;

export async function GET() {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.redirect(new URL("/login", process.env.NEXTAUTH_URL));
    }

    if (!DISCORD_CLIENT_ID) {
      return NextResponse.json(
        { error: "Discord integration not configured" },
        { status: 500 }
      );
    }

    // Discord OAuth URL with required scopes
    const scopes = ["identify"].join("%20");
    const state = Buffer.from(JSON.stringify({ userId: session.user.id })).toString("base64");

    const discordAuthUrl = new URL("https://discord.com/api/oauth2/authorize");
    discordAuthUrl.searchParams.set("client_id", DISCORD_CLIENT_ID);
    discordAuthUrl.searchParams.set("redirect_uri", DISCORD_REDIRECT_URI!);
    discordAuthUrl.searchParams.set("response_type", "code");
    discordAuthUrl.searchParams.set("scope", scopes);
    discordAuthUrl.searchParams.set("state", state);

    return NextResponse.redirect(discordAuthUrl.toString());
  } catch (error) {
    console.error("Discord OAuth error:", error);
    return NextResponse.json(
      { error: "Failed to initiate Discord OAuth" },
      { status: 500 }
    );
  }
}

import { NextResponse } from "next/server";
import { getSessionWithUser } from "@/lib/auth/server";

const NAS_STORAGE_URL = process.env.NAS_STORAGE_URL;
const NAS_API_KEY = process.env.NAS_API_KEY;

export async function POST() {
  try {
    const { user } = await getSessionWithUser();

    if (!user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!user.isFriend && user.role !== "admin") {
      return NextResponse.json(
        { error: "GameHub access required" },
        { status: 403 }
      );
    }

    if (!NAS_STORAGE_URL || !NAS_API_KEY) {
      return NextResponse.json(
        { error: "Storage not configured" },
        { status: 500 }
      );
    }

    // Request upload token from NAS server
    const response = await fetch(`${NAS_STORAGE_URL}/token`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-API-Key": NAS_API_KEY,
      },
      body: JSON.stringify({
        folder: "clips",
        maxSize: 500 * 1024 * 1024, // 500MB
        allowedTypes: [
          "video/mp4",
          "video/webm",
          "video/quicktime",
          "video/x-msvideo",
          "video/x-matroska",
        ],
        expiresIn: 3600, // 1 hour
      }),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: "Failed to get upload token" }));
      return NextResponse.json(
        { error: error.error || "Failed to get upload token" },
        { status: response.status }
      );
    }

    const data = await response.json();

    return NextResponse.json({
      token: data.token,
      uploadUrl: data.uploadUrl,
      expiresIn: data.expiresIn,
    });
  } catch (error) {
    console.error("Presign error:", error);
    return NextResponse.json(
      { error: "Failed to generate upload token" },
      { status: 500 }
    );
  }
}

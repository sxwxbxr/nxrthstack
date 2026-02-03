import { NextResponse } from "next/server";
import { getSessionWithUser } from "@/lib/auth/server";

const NAS_STORAGE_URL = process.env.NAS_STORAGE_URL;
const NAS_API_KEY = process.env.NAS_API_KEY;

export async function POST(request: Request) {
  try {
    const { user } = await getSessionWithUser();

    // Only authenticated users with GameHub access can upload clips
    if (!user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if user has GameHub access (is a friend)
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

    // Get the form data from the request
    const formData = await request.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    // Validate file type
    const allowedTypes = [
      "video/mp4",
      "video/webm",
      "video/quicktime",
      "video/x-msvideo",
      "video/x-matroska",
    ];

    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: "Invalid file type. Allowed: MP4, WebM, MOV, AVI, MKV" },
        { status: 400 }
      );
    }

    // Validate file size (500MB max)
    const maxSize = 500 * 1024 * 1024;
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: "File too large. Maximum size is 500MB" },
        { status: 400 }
      );
    }

    // Create form data for NAS server
    const nasFormData = new FormData();
    nasFormData.append("file", file);

    // Upload to NAS server
    const response = await fetch(`${NAS_STORAGE_URL}/upload?folder=clips`, {
      method: "POST",
      headers: {
        "X-API-Key": NAS_API_KEY,
      },
      body: nasFormData,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: "Upload failed" }));
      console.error("NAS upload error:", error);
      return NextResponse.json(
        { error: error.error || "Failed to upload to storage" },
        { status: response.status }
      );
    }

    const result = await response.json();

    return NextResponse.json({
      success: true,
      url: result.url,
      filename: result.filename,
      size: result.size,
    });
  } catch (error) {
    console.error("Upload error:", error);
    return NextResponse.json(
      { error: "Failed to upload file" },
      { status: 500 }
    );
  }
}

import { NextResponse } from "next/server";
import { getSessionWithUser } from "@/lib/auth/server";

const NAS_STORAGE_URL = process.env.NAS_STORAGE_URL;
const NAS_API_KEY = process.env.NAS_API_KEY;

export async function POST(request: Request) {
  try {
    const { user } = await getSessionWithUser();
    if (!user || user.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!NAS_STORAGE_URL || !NAS_API_KEY) {
      return NextResponse.json(
        { error: "Storage not configured" },
        { status: 500 }
      );
    }

    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const folder = (formData.get("folder") as string) || "products";

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    // Create form data for NAS server
    const nasFormData = new FormData();
    nasFormData.append("file", file);

    // Upload to NAS server
    const response = await fetch(`${NAS_STORAGE_URL}/upload?folder=${folder}`, {
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
      url: result.url,
      fileKey: result.url,
      filename: result.filename,
      size: result.size,
    });
  } catch (error) {
    console.error("Failed to upload file:", error);
    return NextResponse.json(
      { error: "Failed to upload file" },
      { status: 500 }
    );
  }
}

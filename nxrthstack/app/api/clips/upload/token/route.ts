import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { handleUpload, type HandleUploadBody } from "@vercel/blob/client";

export async function POST(request: Request) {
  const session = await auth();

  // Only authenticated users with GameHub access can upload clips
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Check if user has GameHub access (is a friend)
  if (!session.user.isFriend && session.user.role !== "admin") {
    return NextResponse.json(
      { error: "GameHub access required" },
      { status: 403 }
    );
  }

  const body = (await request.json()) as HandleUploadBody;

  try {
    const jsonResponse = await handleUpload({
      body,
      request,
      onBeforeGenerateToken: async () => {
        return {
          allowedContentTypes: [
            "video/mp4",
            "video/webm",
            "video/quicktime", // .mov
            "video/x-msvideo", // .avi
            "video/x-matroska", // .mkv
          ],
          maximumSizeInBytes: 100 * 1024 * 1024, // 100MB max for clips
        };
      },
      onUploadCompleted: async ({ blob }) => {
        console.log("Clip upload completed:", blob.url);
      },
    });

    return NextResponse.json(jsonResponse);
  } catch (error) {
    console.error("Failed to generate clip upload token:", error);
    return NextResponse.json(
      { error: "Failed to generate upload token" },
      { status: 500 }
    );
  }
}

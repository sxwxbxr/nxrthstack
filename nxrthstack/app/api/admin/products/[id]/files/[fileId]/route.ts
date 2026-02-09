import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db, productFiles } from "@/lib/db";
import { eq } from "drizzle-orm";
const NAS_STORAGE_URL = process.env.NAS_STORAGE_URL;
const NAS_API_KEY = process.env.NAS_API_KEY;

interface RouteParams {
  params: Promise<{ id: string; fileId: string }>;
}

export async function DELETE(request: Request, { params }: RouteParams) {
  try {
    const session = await auth();
    if (!session?.user || session.user.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { fileId } = await params;

    // Get the file to delete from storage
    const file = await db.query.productFiles.findFirst({
      where: eq(productFiles.id, fileId),
    });

    if (!file) {
      return NextResponse.json({ error: "File not found" }, { status: 404 });
    }

    // Delete from NAS storage
    try {
      if (NAS_STORAGE_URL && NAS_API_KEY) {
        const fileUrl = new URL(file.fileKey);
        const pathParts = fileUrl.pathname.replace("/files/", "").split("/");
        const filename = pathParts.pop();
        const folder = pathParts.join("/");

        await fetch(
          `${NAS_STORAGE_URL}/files/${filename}${folder ? `?folder=${encodeURIComponent(folder)}` : ""}`,
          {
            method: "DELETE",
            headers: { "X-API-Key": NAS_API_KEY },
          }
        );
      }
    } catch (storageError) {
      console.error("Failed to delete from NAS storage:", storageError);
      // Continue to delete database record even if storage deletion fails
    }

    // Delete from database
    const [deletedFile] = await db
      .delete(productFiles)
      .where(eq(productFiles.id, fileId))
      .returning({ id: productFiles.id });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to delete file:", error);
    return NextResponse.json(
      { error: "Failed to delete file" },
      { status: 500 }
    );
  }
}

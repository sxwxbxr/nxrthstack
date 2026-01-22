import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db, productFiles } from "@/lib/db";
import { eq } from "drizzle-orm";
import { del } from "@vercel/blob";

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

    // Get the file to delete from blob storage
    const file = await db.query.productFiles.findFirst({
      where: eq(productFiles.id, fileId),
    });

    if (!file) {
      return NextResponse.json({ error: "File not found" }, { status: 404 });
    }

    // Delete from Vercel Blob
    try {
      await del(file.fileKey);
    } catch (blobError) {
      console.error("Failed to delete from blob storage:", blobError);
      // Continue to delete database record even if blob deletion fails
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

import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db, productFiles } from "@/lib/db";
import { eq } from "drizzle-orm";
import { z } from "zod";

const createFileSchema = z.object({
  name: z.string().min(1),
  priceId: z.string().uuid().nullable().optional(),
  fileKey: z.string().min(1),
  fileSizeBytes: z.number().optional(),
  fileType: z.string().optional(),
});

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(request: Request, { params }: RouteParams) {
  try {
    const session = await auth();
    if (!session?.user || session.user.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    const files = await db.query.productFiles.findMany({
      where: eq(productFiles.productId, id),
    });

    return NextResponse.json({ files });
  } catch (error) {
    console.error("Failed to fetch files:", error);
    return NextResponse.json(
      { error: "Failed to fetch files" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request, { params }: RouteParams) {
  try {
    const session = await auth();
    if (!session?.user || session.user.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: productId } = await params;
    const body = await request.json();
    const parsed = createFileSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.errors[0].message },
        { status: 400 }
      );
    }

    const { name, priceId, fileKey, fileSizeBytes, fileType } = parsed.data;

    const [newFile] = await db
      .insert(productFiles)
      .values({
        productId,
        name,
        priceId: priceId || null,
        fileKey,
        fileSizeBytes: fileSizeBytes || null,
        fileType: fileType || null,
      })
      .returning();

    return NextResponse.json({ file: newFile }, { status: 201 });
  } catch (error) {
    console.error("Failed to create file:", error);
    return NextResponse.json(
      { error: "Failed to create file" },
      { status: 500 }
    );
  }
}

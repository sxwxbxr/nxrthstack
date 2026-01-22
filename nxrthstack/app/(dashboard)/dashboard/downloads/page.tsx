import { auth } from "@/lib/auth";
import { db, purchases, subscriptions, productFiles } from "@/lib/db";
import { eq, and, or, inArray } from "drizzle-orm";
import { Icons } from "@/components/icons";
import { FadeIn } from "@/components/ui/fade-in";
import { DownloadButton } from "@/components/dashboard/download-button";

export const metadata = {
  title: "Downloads | Dashboard - NxrthStack",
};

async function getUserDownloads(userId: string) {
  // Get all user's purchased/subscribed product IDs
  const [userPurchases, userSubscriptions] = await Promise.all([
    db.query.purchases.findMany({
      where: and(eq(purchases.userId, userId), eq(purchases.status, "completed")),
      columns: { productId: true, priceId: true },
    }),
    db.query.subscriptions.findMany({
      where: and(
        eq(subscriptions.userId, userId),
        eq(subscriptions.status, "active")
      ),
      columns: { productId: true, priceId: true },
    }),
  ]);

  const productIds = [
    ...new Set([
      ...userPurchases.map((p) => p.productId),
      ...userSubscriptions.map((s) => s.productId),
    ]),
  ].filter((id): id is string => id !== null);

  if (productIds.length === 0) {
    return [];
  }

  // Get all files for these products
  const files = await db.query.productFiles.findMany({
    where: inArray(productFiles.productId, productIds),
    with: {
      product: true,
      price: true,
    },
  });

  return files;
}

export default async function DownloadsPage() {
  const session = await auth();
  if (!session?.user) return null;

  const files = await getUserDownloads(session.user.id);

  // Group files by product
  const filesByProduct = files.reduce(
    (acc, file) => {
      const productId = file.productId;
      if (!acc[productId]) {
        acc[productId] = {
          product: file.product,
          files: [],
        };
      }
      acc[productId].files.push(file);
      return acc;
    },
    {} as Record<string, { product: typeof files[0]["product"]; files: typeof files }>
  );

  return (
    <div>
      <FadeIn>
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground">Downloads</h1>
          <p className="mt-1 text-muted-foreground">
            Download your purchased software
          </p>
        </div>
      </FadeIn>

      {files.length === 0 ? (
        <FadeIn delay={0.1}>
          <div className="rounded-xl border border-dashed border-border p-16 text-center">
            <Icons.Download className="mx-auto h-12 w-12 text-muted-foreground" />
            <h3 className="mt-4 text-lg font-medium text-foreground">
              No downloads available
            </h3>
            <p className="mt-2 text-muted-foreground">
              Purchase products to access downloads
            </p>
            <a
              href="/shop"
              className="mt-6 inline-block rounded-lg bg-primary px-6 py-2.5 text-sm font-medium text-primary-foreground"
            >
              Browse Shop
            </a>
          </div>
        </FadeIn>
      ) : (
        <div className="space-y-8">
          {Object.entries(filesByProduct).map(([productId, { product, files }], index) => (
            <FadeIn key={productId} delay={index * 0.1}>
              <div className="rounded-xl border border-border bg-card overflow-hidden">
                <div className="border-b border-border bg-muted/50 p-4">
                  <div className="flex items-center gap-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-background">
                      {product?.imageUrl ? (
                        <img
                          src={product.imageUrl}
                          alt={product.name}
                          className="h-full w-full rounded-lg object-cover"
                        />
                      ) : (
                        <Icons.Package className="h-6 w-6 text-muted-foreground" />
                      )}
                    </div>
                    <div>
                      <h3 className="font-semibold text-foreground">
                        {product?.name || "Unknown Product"}
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        {files.length} file{files.length !== 1 ? "s" : ""} available
                      </p>
                    </div>
                  </div>
                </div>

                <div className="divide-y divide-border">
                  {files.map((file) => (
                    <div
                      key={file.id}
                      className="flex items-center justify-between p-4"
                    >
                      <div className="flex items-center gap-4">
                        <div className="rounded-lg bg-muted p-2">
                          <Icons.FileText className="h-5 w-5 text-muted-foreground" />
                        </div>
                        <div>
                          <p className="font-medium text-foreground">
                            {file.name}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {file.fileSizeBytes
                              ? formatFileSize(file.fileSizeBytes)
                              : "Unknown size"}
                            {file.price && ` • ${file.price.name}`}
                          </p>
                        </div>
                      </div>
                      <DownloadButton fileId={file.id} fileName={file.name} />
                    </div>
                  ))}
                </div>
              </div>
            </FadeIn>
          ))}
        </div>
      )}
    </div>
  );
}

function formatFileSize(bytes: number): string {
  const units = ["B", "KB", "MB", "GB"];
  let size = bytes;
  let unitIndex = 0;
  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024;
    unitIndex++;
  }
  return `${size.toFixed(1)} ${units[unitIndex]}`;
}

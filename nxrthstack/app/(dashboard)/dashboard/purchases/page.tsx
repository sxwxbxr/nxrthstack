import { auth } from "@/lib/auth";
import { db, purchases } from "@/lib/db";
import { eq, and, desc } from "drizzle-orm";
import { Icons } from "@/components/icons";
import { FadeIn } from "@/components/ui/fade-in";

export const metadata = {
  title: "Purchases | Dashboard - NxrthStack",
};

async function getUserPurchases(userId: string) {
  return db.query.purchases.findMany({
    where: and(eq(purchases.userId, userId), eq(purchases.status, "completed")),
    orderBy: [desc(purchases.createdAt)],
    with: {
      product: true,
      price: true,
    },
  });
}

export default async function PurchasesPage() {
  const session = await auth();
  if (!session?.user) return null;

  const userPurchases = await getUserPurchases(session.user.id);

  return (
    <div>
      <FadeIn>
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground">Purchases</h1>
          <p className="mt-1 text-muted-foreground">
            View your purchase history and license keys
          </p>
        </div>
      </FadeIn>

      {userPurchases.length === 0 ? (
        <FadeIn delay={0.1}>
          <div className="rounded-xl border border-dashed border-border p-16 text-center">
            <Icons.ShoppingBag className="mx-auto h-12 w-12 text-muted-foreground" />
            <h3 className="mt-4 text-lg font-medium text-foreground">
              No purchases yet
            </h3>
            <p className="mt-2 text-muted-foreground">
              Your purchased products will appear here
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
        <FadeIn delay={0.1}>
          <div className="space-y-4">
            {userPurchases.map((purchase) => (
              <div
                key={purchase.id}
                className="rounded-xl border border-border bg-card p-6"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-4">
                    <div className="flex h-14 w-14 items-center justify-center rounded-lg bg-muted">
                      {purchase.product?.imageUrl ? (
                        <img
                          src={purchase.product.imageUrl}
                          alt={purchase.product.name}
                          className="h-full w-full rounded-lg object-cover"
                        />
                      ) : (
                        <Icons.Package className="h-7 w-7 text-muted-foreground" />
                      )}
                    </div>
                    <div>
                      <h3 className="font-semibold text-foreground">
                        {purchase.product?.name || "Unknown Product"}
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        {purchase.price?.name || "Standard"} •{" "}
                        {new Date(purchase.createdAt).toLocaleDateString(
                          "en-US",
                          {
                            year: "numeric",
                            month: "long",
                            day: "numeric",
                          }
                        )}
                      </p>
                      <p className="mt-1 text-sm font-medium text-foreground">
                        ${(purchase.amountCents / 100).toFixed(2)}{" "}
                        {purchase.currency.toUpperCase()}
                      </p>
                    </div>
                  </div>
                  <span className="rounded-full bg-green-500/10 px-3 py-1 text-xs font-medium text-green-500">
                    Completed
                  </span>
                </div>

                {/* License Key */}
                {purchase.licenseKey && (
                  <div className="mt-4 rounded-lg bg-muted p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs font-medium text-muted-foreground">
                          LICENSE KEY
                        </p>
                        <p className="mt-1 font-mono text-sm text-foreground">
                          {purchase.licenseKey}
                        </p>
                      </div>
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(purchase.licenseKey!);
                        }}
                        className="rounded-lg p-2 text-muted-foreground hover:bg-background hover:text-foreground"
                        title="Copy license key"
                      >
                        <Icons.Copy className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                )}

                {/* Actions */}
                <div className="mt-4 flex gap-3">
                  <a
                    href="/dashboard/downloads"
                    className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
                  >
                    <Icons.Download className="h-4 w-4" />
                    Download
                  </a>
                  {purchase.product?.slug && (
                    <a
                      href={`/shop/${purchase.product.slug}`}
                      className="inline-flex items-center gap-2 rounded-lg bg-muted px-4 py-2 text-sm font-medium text-foreground hover:bg-muted/80"
                    >
                      View Product
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>
        </FadeIn>
      )}
    </div>
  );
}

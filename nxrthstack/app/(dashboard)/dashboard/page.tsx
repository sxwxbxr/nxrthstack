import { auth } from "@/lib/auth";
import { db, purchases, subscriptions } from "@/lib/db";
import { eq, and, desc } from "drizzle-orm";
import { Icons } from "@/components/icons";
import Link from "next/link";
import { FadeIn } from "@/components/ui/fade-in";

export const metadata = {
  title: "Dashboard | NxrthStack",
};

async function getUserData(userId: string) {
  const [userPurchases, userSubscriptions] = await Promise.all([
    db.query.purchases.findMany({
      where: and(
        eq(purchases.userId, userId),
        eq(purchases.status, "completed")
      ),
      orderBy: [desc(purchases.createdAt)],
      with: {
        product: true,
        price: true,
      },
      limit: 5,
    }),
    db.query.subscriptions.findMany({
      where: and(
        eq(subscriptions.userId, userId),
        eq(subscriptions.status, "active")
      ),
      with: {
        product: true,
        price: true,
      },
    }),
  ]);

  return { purchases: userPurchases, subscriptions: userSubscriptions };
}

export default async function DashboardPage() {
  const session = await auth();
  if (!session?.user) return null;

  const { purchases: userPurchases, subscriptions: userSubscriptions } =
    await getUserData(session.user.id);

  return (
    <div>
      <FadeIn>
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground">
            Welcome back{session.user.name ? `, ${session.user.name}` : ""}!
          </h1>
          <p className="mt-1 text-muted-foreground">
            Manage your purchases and downloads
          </p>
        </div>
      </FadeIn>

      {/* Quick Stats */}
      <FadeIn delay={0.1}>
        <div className="grid gap-6 md:grid-cols-3">
          <div className="rounded-xl border border-border bg-card p-6">
            <div className="flex items-center gap-4">
              <div className="rounded-lg bg-primary/10 p-3">
                <Icons.ShoppingBag className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">
                  {userPurchases.length}
                </p>
                <p className="text-sm text-muted-foreground">Total Purchases</p>
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-border bg-card p-6">
            <div className="flex items-center gap-4">
              <div className="rounded-lg bg-purple-500/10 p-3">
                <Icons.Calendar className="h-6 w-6 text-purple-500" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">
                  {userSubscriptions.length}
                </p>
                <p className="text-sm text-muted-foreground">
                  Active Subscriptions
                </p>
              </div>
            </div>
          </div>

          <Link href="/shop" className="block">
            <div className="rounded-xl border border-border bg-card p-6 transition-colors hover:border-primary/50">
              <div className="flex items-center gap-4">
                <div className="rounded-lg bg-green-500/10 p-3">
                  <Icons.Store className="h-6 w-6 text-green-500" />
                </div>
                <div>
                  <p className="font-medium text-foreground">Browse Shop</p>
                  <p className="text-sm text-muted-foreground">
                    Discover more products
                  </p>
                </div>
              </div>
            </div>
          </Link>
        </div>
      </FadeIn>

      {/* Recent Purchases */}
      <FadeIn delay={0.2}>
        <div className="mt-8">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-foreground">
              Recent Purchases
            </h2>
            <Link
              href="/dashboard/purchases"
              className="text-sm text-primary hover:underline"
            >
              View all
            </Link>
          </div>

          {userPurchases.length === 0 ? (
            <div className="mt-4 rounded-xl border border-dashed border-border p-8 text-center">
              <Icons.ShoppingBag className="mx-auto h-10 w-10 text-muted-foreground" />
              <p className="mt-2 text-muted-foreground">No purchases yet</p>
              <Link
                href="/shop"
                className="mt-4 inline-block rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
              >
                Browse Shop
              </Link>
            </div>
          ) : (
            <div className="mt-4 space-y-3">
              {userPurchases.map((purchase) => (
                <div
                  key={purchase.id}
                  className="flex items-center justify-between rounded-xl border border-border bg-card p-4"
                >
                  <div className="flex items-center gap-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-muted">
                      <Icons.Package className="h-6 w-6 text-muted-foreground" />
                    </div>
                    <div>
                      <p className="font-medium text-foreground">
                        {purchase.product?.name || "Unknown Product"}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {purchase.price?.name} •{" "}
                        {new Date(purchase.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <Link
                    href="/dashboard/downloads"
                    className="rounded-lg bg-muted px-3 py-1.5 text-sm font-medium text-foreground hover:bg-muted/80"
                  >
                    Download
                  </Link>
                </div>
              ))}
            </div>
          )}
        </div>
      </FadeIn>

      {/* Active Subscriptions */}
      {userSubscriptions.length > 0 && (
        <FadeIn delay={0.3}>
          <div className="mt-8">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-foreground">
                Active Subscriptions
              </h2>
              <Link
                href="/dashboard/subscriptions"
                className="text-sm text-primary hover:underline"
              >
                Manage
              </Link>
            </div>

            <div className="mt-4 space-y-3">
              {userSubscriptions.map((sub) => (
                <div
                  key={sub.id}
                  className="flex items-center justify-between rounded-xl border border-border bg-card p-4"
                >
                  <div className="flex items-center gap-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-purple-500/10">
                      <Icons.Calendar className="h-6 w-6 text-purple-500" />
                    </div>
                    <div>
                      <p className="font-medium text-foreground">
                        {sub.product?.name || "Unknown Product"}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {sub.price?.name} • Renews{" "}
                        {sub.currentPeriodEnd
                          ? new Date(sub.currentPeriodEnd).toLocaleDateString()
                          : "Soon"}
                      </p>
                    </div>
                  </div>
                  <span className="rounded-full bg-green-500/10 px-3 py-1 text-xs font-medium text-green-500">
                    Active
                  </span>
                </div>
              ))}
            </div>
          </div>
        </FadeIn>
      )}
    </div>
  );
}

import { db, purchases, subscriptions } from "@/lib/db";
import { desc } from "drizzle-orm";
import { Icons } from "@/components/icons";
import { FadeIn } from "@/components/ui/fade-in";

export const metadata = {
  title: "Orders | Admin - NxrthStack",
};

async function getOrders() {
  const [allPurchases, allSubscriptions] = await Promise.all([
    db.query.purchases.findMany({
      orderBy: [desc(purchases.createdAt)],
      with: {
        user: true,
        product: true,
        price: true,
      },
    }),
    db.query.subscriptions.findMany({
      orderBy: [desc(subscriptions.createdAt)],
      with: {
        user: true,
        product: true,
        price: true,
      },
    }),
  ]);

  return { purchases: allPurchases, subscriptions: allSubscriptions };
}

export default async function OrdersPage() {
  const { purchases: allPurchases, subscriptions: allSubscriptions } =
    await getOrders();

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "completed":
      case "active":
        return "bg-green-500/10 text-green-500";
      case "pending":
        return "bg-yellow-500/10 text-yellow-500";
      case "failed":
      case "canceled":
        return "bg-red-500/10 text-red-500";
      case "refunded":
        return "bg-muted text-muted-foreground";
      default:
        return "bg-muted text-muted-foreground";
    }
  };

  return (
    <div>
      <FadeIn>
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground">Orders</h1>
          <p className="mt-1 text-muted-foreground">
            View and manage customer orders
          </p>
        </div>
      </FadeIn>

      {/* One-Time Purchases */}
      <FadeIn delay={0.1}>
        <div className="mb-8">
          <h2 className="text-lg font-semibold text-foreground mb-4">
            One-Time Purchases ({allPurchases.length})
          </h2>
          {allPurchases.length === 0 ? (
            <div className="rounded-xl border border-dashed border-border p-8 text-center">
              <p className="text-muted-foreground">No purchases yet</p>
            </div>
          ) : (
            <div className="rounded-xl border border-border bg-card overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border bg-muted/50">
                    <th className="px-6 py-4 text-left text-sm font-medium text-muted-foreground">
                      Customer
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-medium text-muted-foreground">
                      Product
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-medium text-muted-foreground">
                      Amount
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-medium text-muted-foreground">
                      Status
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-medium text-muted-foreground">
                      Date
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {allPurchases.map((purchase) => (
                    <tr
                      key={purchase.id}
                      className="border-b border-border last:border-0"
                    >
                      <td className="px-6 py-4">
                        <div>
                          <p className="font-medium text-foreground">
                            {purchase.user?.name || "Unknown"}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {purchase.user?.email}
                          </p>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div>
                          <p className="text-foreground">
                            {purchase.product?.name || "Unknown"}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {purchase.price?.name}
                          </p>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-foreground">
                        ${(purchase.amountCents / 100).toFixed(2)}
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${getStatusBadge(
                            purchase.status
                          )}`}
                        >
                          {purchase.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-muted-foreground">
                        {new Date(purchase.createdAt).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </FadeIn>

      {/* Subscriptions */}
      <FadeIn delay={0.2}>
        <div>
          <h2 className="text-lg font-semibold text-foreground mb-4">
            Subscriptions ({allSubscriptions.length})
          </h2>
          {allSubscriptions.length === 0 ? (
            <div className="rounded-xl border border-dashed border-border p-8 text-center">
              <p className="text-muted-foreground">No subscriptions yet</p>
            </div>
          ) : (
            <div className="rounded-xl border border-border bg-card overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border bg-muted/50">
                    <th className="px-6 py-4 text-left text-sm font-medium text-muted-foreground">
                      Customer
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-medium text-muted-foreground">
                      Product
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-medium text-muted-foreground">
                      Plan
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-medium text-muted-foreground">
                      Status
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-medium text-muted-foreground">
                      Next Billing
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {allSubscriptions.map((sub) => (
                    <tr
                      key={sub.id}
                      className="border-b border-border last:border-0"
                    >
                      <td className="px-6 py-4">
                        <div>
                          <p className="font-medium text-foreground">
                            {sub.user?.name || "Unknown"}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {sub.user?.email}
                          </p>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-foreground">
                        {sub.product?.name || "Unknown"}
                      </td>
                      <td className="px-6 py-4">
                        <div>
                          <p className="text-foreground">{sub.price?.name}</p>
                          <p className="text-sm text-muted-foreground">
                            ${sub.price ? (sub.price.priceCents / 100).toFixed(2) : "0"}/
                            {sub.price?.billingPeriod === "annual" ? "yr" : "mo"}
                          </p>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${getStatusBadge(
                            sub.status
                          )}`}
                        >
                          {sub.cancelAtPeriodEnd ? "Canceling" : sub.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-muted-foreground">
                        {sub.currentPeriodEnd
                          ? new Date(sub.currentPeriodEnd).toLocaleDateString()
                          : "N/A"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </FadeIn>
    </div>
  );
}

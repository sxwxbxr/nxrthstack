import { db, products, purchases, subscriptions, users } from "@/lib/db";
import { eq, count, sum, and, gte } from "drizzle-orm";
import { StatsCard } from "@/components/admin/stats-card";
import { Icons } from "@/components/icons";

export const metadata = {
  title: "Admin Dashboard | NxrthStack",
};

async function getStats() {
  const now = new Date();
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

  const [
    totalProducts,
    totalCustomers,
    totalRevenue,
    recentOrders,
  ] = await Promise.all([
    db.select({ count: count() }).from(products).where(eq(products.isActive, true)),
    db.select({ count: count() }).from(users).where(eq(users.role, "customer")),
    db.select({ total: sum(purchases.amountCents) }).from(purchases).where(eq(purchases.status, "completed")),
    db.select({ count: count() }).from(purchases).where(
      and(
        eq(purchases.status, "completed"),
        gte(purchases.createdAt, thirtyDaysAgo)
      )
    ),
  ]);

  return {
    totalProducts: totalProducts[0]?.count ?? 0,
    totalCustomers: totalCustomers[0]?.count ?? 0,
    totalRevenue: Number(totalRevenue[0]?.total ?? 0) / 100,
    recentOrders: recentOrders[0]?.count ?? 0,
  };
}

export default async function AdminDashboardPage() {
  const stats = await getStats();

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground">Dashboard</h1>
        <p className="mt-1 text-muted-foreground">
          Overview of your shop performance
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <StatsCard
          title="Total Revenue"
          value={`$${stats.totalRevenue.toLocaleString()}`}
          description="All time"
          icon={Icons.DollarSign}
        />
        <StatsCard
          title="Orders (30 days)"
          value={stats.recentOrders}
          description="Last 30 days"
          icon={Icons.ShoppingBag}
        />
        <StatsCard
          title="Active Products"
          value={stats.totalProducts}
          icon={Icons.Package}
        />
        <StatsCard
          title="Customers"
          value={stats.totalCustomers}
          icon={Icons.Users}
        />
      </div>

      <div className="mt-8 rounded-xl border border-border bg-card p-6">
        <h2 className="text-lg font-semibold text-foreground">
          Quick Actions
        </h2>
        <div className="mt-4 grid gap-4 md:grid-cols-3">
          <a
            href="/admin/products/new"
            className="flex items-center gap-3 rounded-lg border border-border p-4 transition-colors hover:bg-accent"
          >
            <div className="rounded-lg bg-primary/10 p-2">
              <Icons.Plus className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="font-medium text-foreground">Add Product</p>
              <p className="text-sm text-muted-foreground">
                Create a new product listing
              </p>
            </div>
          </a>
          <a
            href="/admin/orders"
            className="flex items-center gap-3 rounded-lg border border-border p-4 transition-colors hover:bg-accent"
          >
            <div className="rounded-lg bg-primary/10 p-2">
              <Icons.ShoppingBag className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="font-medium text-foreground">View Orders</p>
              <p className="text-sm text-muted-foreground">
                Manage customer orders
              </p>
            </div>
          </a>
          <a
            href="/shop"
            target="_blank"
            className="flex items-center gap-3 rounded-lg border border-border p-4 transition-colors hover:bg-accent"
          >
            <div className="rounded-lg bg-primary/10 p-2">
              <Icons.ExternalLink className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="font-medium text-foreground">View Shop</p>
              <p className="text-sm text-muted-foreground">
                See how customers see your shop
              </p>
            </div>
          </a>
        </div>
      </div>
    </div>
  );
}

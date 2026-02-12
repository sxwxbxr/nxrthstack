import { db, users, purchases, subscriptions } from "@/lib/db";
import { eq, desc, count } from "drizzle-orm";
import { Icons } from "@/components/icons";
import { FadeIn } from "@/components/ui/fade-in";
import { FriendToggle } from "@/components/admin/friend-toggle";

export const metadata = {
  title: "Customers | Admin - NxrthStack",
};

async function getCustomers() {
  const customers = await db.query.users.findMany({
    where: eq(users.role, "customer"),
    orderBy: [desc(users.createdAt)],
  });

  // Get purchase and subscription counts for each customer
  const customersWithStats = await Promise.all(
    customers.map(async (customer) => {
      const [purchaseCount, subscriptionCount] = await Promise.all([
        db
          .select({ count: count() })
          .from(purchases)
          .where(eq(purchases.userId, customer.id)),
        db
          .select({ count: count() })
          .from(subscriptions)
          .where(eq(subscriptions.userId, customer.id)),
      ]);

      return {
        ...customer,
        purchaseCount: purchaseCount[0]?.count ?? 0,
        subscriptionCount: subscriptionCount[0]?.count ?? 0,
      };
    })
  );

  return customersWithStats;
}

export default async function CustomersPage() {
  const customers = await getCustomers();

  return (
    <div>
      <FadeIn>
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground">Customers</h1>
          <p className="mt-1 text-muted-foreground">
            View and manage your customers
          </p>
        </div>
      </FadeIn>

      {customers.length === 0 ? (
        <FadeIn delay={0.1}>
          <div className="rounded-xl border border-dashed border-border p-16 text-center">
            <Icons.Users className="mx-auto h-12 w-12 text-muted-foreground" />
            <h3 className="mt-4 text-lg font-medium text-foreground">
              No customers yet
            </h3>
            <p className="mt-2 text-muted-foreground">
              Customers will appear here after they register
            </p>
          </div>
        </FadeIn>
      ) : (
        <FadeIn delay={0.1}>
          <div className="rounded-xl border border-border bg-card overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border bg-muted/50">
                  <th className="px-6 py-4 text-left text-sm font-medium text-muted-foreground">
                    Customer
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-medium text-muted-foreground">
                    Purchases
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-medium text-muted-foreground">
                    Subscriptions
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-medium text-muted-foreground">
                    Joined
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-medium text-muted-foreground">
                    Status
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-medium text-muted-foreground">
                    Friend
                  </th>
                </tr>
              </thead>
              <tbody>
                {customers.map((customer) => (
                  <tr
                    key={customer.id}
                    className="border-b border-border last:border-0"
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                          <Icons.User className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                          <p className="font-medium text-foreground">
                            {customer.name || "No name"}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {customer.email}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-foreground">
                      {customer.purchaseCount}
                    </td>
                    <td className="px-6 py-4 text-foreground">
                      {customer.subscriptionCount}
                    </td>
                    <td className="px-6 py-4 text-muted-foreground">
                      {new Date(customer.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${
                          customer.emailVerified
                            ? "bg-green-500/10 text-green-500"
                            : "bg-yellow-500/10 text-yellow-500"
                        }`}
                      >
                        {customer.emailVerified ? "Verified" : "Unverified"}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <FriendToggle
                        userId={customer.id}
                        initialValue={customer.isFriend}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </FadeIn>
      )}
    </div>
  );
}

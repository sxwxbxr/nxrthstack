import { auth } from "@/lib/auth";
import { db, subscriptions } from "@/lib/db";
import { eq, desc } from "drizzle-orm";
import { Icons } from "@/components/icons";
import { FadeIn } from "@/components/ui/fade-in";
import { ManageSubscriptionButton } from "@/components/dashboard/manage-subscription-button";

export const metadata = {
  title: "Subscriptions | Dashboard - NxrthStack",
};

async function getUserSubscriptions(userId: string) {
  return db.query.subscriptions.findMany({
    where: eq(subscriptions.userId, userId),
    orderBy: [desc(subscriptions.createdAt)],
    with: {
      product: true,
      price: true,
    },
  });
}

export default async function SubscriptionsPage() {
  const session = await auth();
  if (!session?.user) return null;

  const userSubscriptions = await getUserSubscriptions(session.user.id);

  const getStatusBadge = (status: string, cancelAtPeriodEnd: boolean) => {
    if (cancelAtPeriodEnd) {
      return { label: "Canceling", className: "bg-yellow-500/10 text-yellow-500" };
    }
    switch (status) {
      case "active":
        return { label: "Active", className: "bg-green-500/10 text-green-500" };
      case "past_due":
        return { label: "Past Due", className: "bg-red-500/10 text-red-500" };
      case "canceled":
        return { label: "Canceled", className: "bg-muted text-muted-foreground" };
      case "paused":
        return { label: "Paused", className: "bg-yellow-500/10 text-yellow-500" };
      default:
        return { label: status, className: "bg-muted text-muted-foreground" };
    }
  };

  return (
    <div>
      <FadeIn>
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground">Subscriptions</h1>
          <p className="mt-1 text-muted-foreground">
            Manage your active subscriptions
          </p>
        </div>
      </FadeIn>

      {userSubscriptions.length === 0 ? (
        <FadeIn delay={0.1}>
          <div className="rounded-xl border border-dashed border-border p-16 text-center">
            <Icons.Calendar className="mx-auto h-12 w-12 text-muted-foreground" />
            <h3 className="mt-4 text-lg font-medium text-foreground">
              No subscriptions
            </h3>
            <p className="mt-2 text-muted-foreground">
              You don't have any active subscriptions
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
        <div className="space-y-4">
          {userSubscriptions.map((subscription, index) => {
            const badge = getStatusBadge(
              subscription.status,
              subscription.cancelAtPeriodEnd
            );

            return (
              <FadeIn key={subscription.id} delay={index * 0.1}>
                <div className="rounded-xl border border-border bg-card p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-4">
                      <div className="flex h-14 w-14 items-center justify-center rounded-lg bg-purple-500/10">
                        {subscription.product?.imageUrl ? (
                          <img
                            src={subscription.product.imageUrl}
                            alt={subscription.product.name}
                            className="h-full w-full rounded-lg object-cover"
                          />
                        ) : (
                          <Icons.Calendar className="h-7 w-7 text-purple-500" />
                        )}
                      </div>
                      <div>
                        <h3 className="font-semibold text-foreground">
                          {subscription.product?.name || "Unknown Product"}
                        </h3>
                        <p className="text-sm text-muted-foreground">
                          {subscription.price?.name || "Standard"} •{" "}
                          {subscription.price?.billingPeriod === "annual"
                            ? "Yearly"
                            : "Monthly"}
                        </p>
                        <p className="mt-1 text-lg font-bold text-foreground">
                          $
                          {subscription.price
                            ? (subscription.price.priceCents / 100).toFixed(2)
                            : "0.00"}
                          <span className="text-sm font-normal text-muted-foreground">
                            /
                            {subscription.price?.billingPeriod === "annual"
                              ? "year"
                              : "month"}
                          </span>
                        </p>
                      </div>
                    </div>
                    <span
                      className={`rounded-full px-3 py-1 text-xs font-medium ${badge.className}`}
                    >
                      {badge.label}
                    </span>
                  </div>

                  {/* Billing Info */}
                  <div className="mt-4 grid gap-4 rounded-lg bg-muted p-4 sm:grid-cols-2">
                    <div>
                      <p className="text-xs font-medium text-muted-foreground">
                        CURRENT PERIOD
                      </p>
                      <p className="mt-1 text-sm text-foreground">
                        {subscription.currentPeriodStart
                          ? new Date(
                              subscription.currentPeriodStart
                            ).toLocaleDateString()
                          : "N/A"}{" "}
                        -{" "}
                        {subscription.currentPeriodEnd
                          ? new Date(
                              subscription.currentPeriodEnd
                            ).toLocaleDateString()
                          : "N/A"}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs font-medium text-muted-foreground">
                        {subscription.cancelAtPeriodEnd
                          ? "ACCESS ENDS"
                          : "NEXT BILLING"}
                      </p>
                      <p className="mt-1 text-sm text-foreground">
                        {subscription.currentPeriodEnd
                          ? new Date(
                              subscription.currentPeriodEnd
                            ).toLocaleDateString("en-US", {
                              year: "numeric",
                              month: "long",
                              day: "numeric",
                            })
                          : "N/A"}
                      </p>
                    </div>
                  </div>

                  {/* Cancel Notice */}
                  {subscription.cancelAtPeriodEnd && (
                    <div className="mt-4 flex items-center gap-2 rounded-lg bg-yellow-500/10 p-3 text-sm text-yellow-500">
                      <Icons.AlertCircle className="h-4 w-4 shrink-0" />
                      <p>
                        Your subscription will end on{" "}
                        {subscription.currentPeriodEnd
                          ? new Date(
                              subscription.currentPeriodEnd
                            ).toLocaleDateString()
                          : "the end of the current period"}
                        . You'll continue to have access until then.
                      </p>
                    </div>
                  )}

                  {/* Actions */}
                  {subscription.status === "active" && (
                    <div className="mt-4">
                      <ManageSubscriptionButton />
                    </div>
                  )}
                </div>
              </FadeIn>
            );
          })}
        </div>
      )}
    </div>
  );
}

import { auth } from "@/lib/auth";
import { db, users } from "@/lib/db";
import { eq } from "drizzle-orm";
import { FadeIn } from "@/components/ui/fade-in";
import { SettingsForm } from "./settings-form";

export const metadata = {
  title: "Settings | NxrthStack",
};

async function getUserDetails(userId: string) {
  const user = await db.query.users.findFirst({
    where: eq(users.id, userId),
  });
  return user;
}

export default async function SettingsPage() {
  const session = await auth();
  if (!session?.user) return null;

  const user = await getUserDetails(session.user.id);
  if (!user) return null;

  return (
    <div>
      <FadeIn>
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground">Settings</h1>
          <p className="mt-1 text-muted-foreground">
            Manage your account settings and preferences
          </p>
        </div>
      </FadeIn>

      <div className="space-y-8">
        <FadeIn delay={0.1}>
          <SettingsForm
            user={{
              id: user.id,
              name: user.name || "",
              email: user.email,
              createdAt: user.createdAt,
            }}
          />
        </FadeIn>

        <FadeIn delay={0.2}>
          <div className="rounded-xl border border-border bg-card p-6">
            <h2 className="text-lg font-semibold text-foreground">
              Account Information
            </h2>
            <div className="mt-4 space-y-4">
              <div className="flex items-center justify-between border-b border-border pb-4">
                <div>
                  <p className="text-sm font-medium text-foreground">
                    Account Type
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Your current account role
                  </p>
                </div>
                <span className="rounded-full bg-primary/10 px-3 py-1 text-sm font-medium text-primary capitalize">
                  {user.role}
                </span>
              </div>
              <div className="flex items-center justify-between border-b border-border pb-4">
                <div>
                  <p className="text-sm font-medium text-foreground">
                    Member Since
                  </p>
                  <p className="text-sm text-muted-foreground">
                    When you joined NxrthStack
                  </p>
                </div>
                <span className="text-sm text-foreground">
                  {new Date(user.createdAt).toLocaleDateString("en-US", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                </span>
              </div>
              {user.stripeCustomerId && (
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-foreground">
                      Payment Account
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Connected to Stripe
                    </p>
                  </div>
                  <span className="rounded-full bg-green-500/10 px-3 py-1 text-xs font-medium text-green-500">
                    Connected
                  </span>
                </div>
              )}
            </div>
          </div>
        </FadeIn>

        <FadeIn delay={0.3}>
          <div className="rounded-xl border border-destructive/50 bg-card p-6">
            <h2 className="text-lg font-semibold text-destructive">
              Danger Zone
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Irreversible and destructive actions
            </p>
            <div className="mt-4">
              <button
                disabled
                className="rounded-lg border border-destructive/50 px-4 py-2 text-sm font-medium text-destructive opacity-50 cursor-not-allowed"
              >
                Delete Account
              </button>
              <p className="mt-2 text-xs text-muted-foreground">
                Account deletion is not yet available. Contact support if needed.
              </p>
            </div>
          </div>
        </FadeIn>
      </div>
    </div>
  );
}

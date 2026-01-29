import { auth } from "@/lib/auth";
import { FadeIn } from "@/components/ui/fade-in";
import { NotificationPreferences } from "@/components/notifications";
import Link from "next/link";
import { Icons } from "@/components/icons";

export const metadata = {
  title: "Notification Settings | NxrthStack",
};

export default async function NotificationSettingsPage() {
  const session = await auth();
  if (!session?.user) return null;

  return (
    <div>
      <FadeIn>
        <div className="mb-8">
          <Link
            href="/dashboard/settings"
            className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors mb-4"
          >
            <Icons.ChevronLeft className="h-4 w-4" />
            Back to Settings
          </Link>
          <h1 className="text-3xl font-bold text-foreground">
            Notification Settings
          </h1>
          <p className="mt-1 text-muted-foreground">
            Manage how and when you receive notifications
          </p>
        </div>
      </FadeIn>

      <FadeIn delay={0.1}>
        <div className="rounded-xl border border-border bg-card p-6">
          <NotificationPreferences />
        </div>
      </FadeIn>
    </div>
  );
}

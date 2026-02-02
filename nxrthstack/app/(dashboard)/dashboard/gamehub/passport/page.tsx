import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getOrCreateProfile, getUserAchievements } from "@/lib/gamehub/profiles";
import { FadeIn } from "@/components/ui/fade-in";
import { GradientText } from "@/components/ui/gradient-text";
import { PassportEditor } from "@/components/gamehub/passport-editor";
import { Icons } from "@/components/icons";
import Link from "next/link";

export const metadata = {
  title: "Gaming Passport | GameHub - NxrthStack",
};

export default async function PassportPage() {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/login");
  }

  const [profile, achievements] = await Promise.all([
    getOrCreateProfile(session.user.id),
    getUserAchievements(session.user.id),
  ]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <FadeIn>
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
              <Link
                href="/dashboard/gamehub"
                className="hover:text-foreground transition-colors"
              >
                GameHub
              </Link>
              <Icons.ChevronRight className="h-4 w-4" />
              <span className="text-foreground">Gaming Passport</span>
            </div>
            <h1 className="text-3xl font-bold">
              <GradientText>Gaming Passport</GradientText>
            </h1>
            <p className="text-muted-foreground mt-1">
              Customize your public gaming profile
            </p>
          </div>
          {profile.usernameSlug && (
            <Link
              href={`/u/${profile.usernameSlug}`}
              target="_blank"
              className="flex items-center gap-2 px-4 py-2 rounded-lg border border-border hover:bg-muted transition-colors text-sm"
            >
              <Icons.ExternalLink className="h-4 w-4" />
              View Public Profile
            </Link>
          )}
        </div>
      </FadeIn>

      {/* Profile URL */}
      <FadeIn delay={0.1}>
        <div className="rounded-xl border border-primary/30 bg-primary/5 p-4">
          <div className="flex items-center gap-3">
            <Icons.Link className="h-5 w-5 text-primary" />
            <div className="flex-1">
              <p className="text-sm text-muted-foreground">Your profile URL</p>
              <p className="font-mono text-foreground">
                {typeof window !== "undefined" ? window.location.origin : "https://nxrthstack.vercel.app"}
                /u/{profile.usernameSlug || "your-username"}
              </p>
            </div>
            <button
              onClick={() => {
                navigator.clipboard.writeText(
                  `${window.location.origin}/u/${profile.usernameSlug}`
                );
              }}
              className="p-2 rounded-lg hover:bg-primary/10 transition-colors"
              title="Copy URL"
            >
              <Icons.Copy className="h-4 w-4 text-primary" />
            </button>
          </div>
        </div>
      </FadeIn>

      {/* Editor */}
      <FadeIn delay={0.2}>
        <PassportEditor
          initialProfile={profile}
          achievements={achievements}
          userName={session.user.name || session.user.email || "User"}
          userAvatar={null}
        />
      </FadeIn>
    </div>
  );
}

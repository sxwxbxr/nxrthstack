import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getOrCreateProfile, getUserAchievements } from "@/lib/gamehub/profiles";
import { FadeIn } from "@/components/ui/fade-in";
import { GradientText } from "@/components/ui/gradient-text";
import { PassportEditor } from "@/components/gamehub/passport-editor";
import { CopyProfileUrl } from "@/components/gamehub/copy-profile-url";
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
        <CopyProfileUrl usernameSlug={profile.usernameSlug} />
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

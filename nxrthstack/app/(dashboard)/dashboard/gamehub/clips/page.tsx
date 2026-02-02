import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { FadeIn } from "@/components/ui/fade-in";
import { GradientText } from "@/components/ui/gradient-text";
import { Icons } from "@/components/icons";
import Link from "next/link";
import { ClipGallery } from "@/components/gamehub/clip-gallery";

export const metadata = {
  title: "Clip Gallery | GameHub - NxrthStack",
};

export default async function ClipsPage() {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/login");
  }

  if (!session.user.isFriend && session.user.role !== "admin") {
    redirect("/dashboard/gamehub");
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <FadeIn>
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
              <Link
                href="/dashboard/gamehub"
                className="hover:text-foreground transition-colors"
              >
                GameHub
              </Link>
              <Icons.ChevronRight className="h-4 w-4" />
              <span className="text-foreground">Clip Gallery</span>
            </div>
            <h1 className="text-3xl font-bold">
              <GradientText>Clip Gallery</GradientText>
            </h1>
            <p className="text-muted-foreground mt-1">
              Share and discover epic gaming moments
            </p>
          </div>
          <Link
            href="/dashboard/gamehub/clips/upload"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 text-sm font-medium transition-colors"
          >
            <Icons.Upload className="h-4 w-4" />
            Upload Clip
          </Link>
        </div>
      </FadeIn>

      {/* Gallery */}
      <FadeIn delay={0.1}>
        <ClipGallery currentUserId={session.user.id} />
      </FadeIn>
    </div>
  );
}

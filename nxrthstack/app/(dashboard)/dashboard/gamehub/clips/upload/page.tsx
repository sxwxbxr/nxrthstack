import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { FadeIn } from "@/components/ui/fade-in";
import { GradientText } from "@/components/ui/gradient-text";
import { Icons } from "@/components/icons";
import Link from "next/link";
import { ClipUploadForm } from "@/components/gamehub/clip-upload-form";

export const metadata = {
  title: "Upload Clip | GameHub - NxrthStack",
};

export default async function UploadClipPage() {
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
        <div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
            <Link
              href="/dashboard/gamehub"
              className="hover:text-foreground transition-colors"
            >
              GameHub
            </Link>
            <Icons.ChevronRight className="h-4 w-4" />
            <Link
              href="/dashboard/gamehub/clips"
              className="hover:text-foreground transition-colors"
            >
              Clip Gallery
            </Link>
            <Icons.ChevronRight className="h-4 w-4" />
            <span className="text-foreground">Upload</span>
          </div>
          <h1 className="text-3xl font-bold">
            <GradientText>Upload Clip</GradientText>
          </h1>
          <p className="text-muted-foreground mt-1">
            Share your best gaming moments with the community
          </p>
        </div>
      </FadeIn>

      {/* Upload Form */}
      <FadeIn delay={0.1}>
        <ClipUploadForm />
      </FadeIn>
    </div>
  );
}

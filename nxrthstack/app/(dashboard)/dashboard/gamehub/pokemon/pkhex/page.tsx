import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Icons } from "@/components/icons";
import { FadeIn } from "@/components/ui/fade-in";
import { GradientText } from "@/components/ui/gradient-text";
import { PKHeXEditorClient } from "@/components/gamehub/pkhex-editor-client";

export const metadata = {
  title: "PKHeX Editor | Pokemon - NxrthStack",
  description: "Full-featured Pokemon save editor powered by PKHeX",
};

export default async function PKHeXEditorPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <FadeIn>
        <Link
          href="/dashboard/gamehub/pokemon"
          className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-4"
        >
          <Icons.ChevronRight className="h-4 w-4 mr-1 rotate-180" />
          Back to Pokemon
        </Link>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">
              <GradientText>PKHeX Editor</GradientText>
            </h1>
            <p className="mt-1 text-muted-foreground">
              Full-featured Pokemon save editor powered by PKHeX - supports all generations
            </p>
          </div>
          <a
            href="https://github.com/kwsch/PKHeX"
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1"
          >
            <Icons.Github className="h-3 w-3" />
            PKHeX by kwsch
          </a>
        </div>
      </FadeIn>

      {/* PKHeX Editor */}
      <FadeIn delay={0.1}>
        <PKHeXEditorClient />
      </FadeIn>
    </div>
  );
}

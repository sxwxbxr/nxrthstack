import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { FadeIn } from "@/components/ui/fade-in";
import { GradientText } from "@/components/ui/gradient-text";
import { Icons } from "@/components/icons";
import { R6CalloutMap } from "@/components/gamehub/r6-callout-map";

export const metadata = {
  title: "Callout Maps | R6 Siege - GameHub",
  description: "Interactive callout maps for Rainbow Six Siege",
};

export default async function CalloutMapsPage() {
  const session = await auth();

  if (!session?.user?.isFriend && session?.user?.role !== "admin") {
    redirect("/dashboard/gamehub");
  }

  return (
    <div className="space-y-8">
      <FadeIn>
        <div className="flex items-center gap-4 mb-2">
          <Link
            href="/dashboard/gamehub/r6"
            className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
          >
            <Icons.ChevronLeft className="w-4 h-4" />
            Back to R6
          </Link>
        </div>
        <div>
          <h1 className="text-3xl font-bold text-foreground">
            <GradientText>Callout Maps</GradientText>
          </h1>
          <p className="mt-2 text-muted-foreground">
            Interactive maps with all the callouts you need to communicate effectively with your team.
          </p>
        </div>
      </FadeIn>

      <FadeIn delay={0.1}>
        <R6CalloutMap />
      </FadeIn>
    </div>
  );
}

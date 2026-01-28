import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Icons } from "@/components/icons";
import { FadeIn } from "@/components/ui/fade-in";
import { GradientText } from "@/components/ui/gradient-text";
import { OverlayConfigurator } from "@/components/gamehub/overlay-configurator";

export const metadata = {
  title: "Stream Overlays | GameHub - NxrthStack",
  description: "Create customizable overlays for your stream",
};

export default async function OverlaysPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <FadeIn>
        <Link
          href="/dashboard/gamehub"
          className="inline-flex items-center text-sm text-foreground/60 hover:text-foreground mb-4"
        >
          <Icons.ChevronRight className="h-4 w-4 mr-1 rotate-180" />
          Back to GameHub
        </Link>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">
              <GradientText>Stream Overlays</GradientText>
            </h1>
            <p className="mt-1 text-foreground/60">
              Create customizable overlays for OBS and other streaming software
            </p>
          </div>
          <div className="flex items-center gap-2 text-purple-500">
            <Icons.Tv className="h-6 w-6" />
          </div>
        </div>
      </FadeIn>

      {/* Overlay Configurator */}
      <FadeIn delay={0.1}>
        <OverlayConfigurator />
      </FadeIn>
    </div>
  );
}

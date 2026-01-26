import { Icons } from "@/components/icons";
import { FadeIn } from "@/components/ui/fade-in";
import { GradientText } from "@/components/ui/gradient-text";

export const metadata = {
  title: "Minecraft | GameHub - NxrthStack",
};

export default function MinecraftPage() {
  return (
    <div className="space-y-8">
      <FadeIn>
        <div className="text-center">
          <h1 className="text-4xl font-bold">
            <GradientText>Minecraft</GradientText>
          </h1>
          <p className="mt-2 text-muted-foreground">
            Tools and utilities for Minecraft
          </p>
        </div>
      </FadeIn>

      <FadeIn delay={0.1}>
        <div className="rounded-xl border border-dashed border-border p-16 text-center">
          <Icons.Package className="mx-auto h-16 w-16 text-muted-foreground" />
          <h2 className="mt-6 text-2xl font-semibold text-foreground">
            Coming Soon
          </h2>
          <p className="mt-4 text-muted-foreground max-w-md mx-auto">
            Minecraft tools and utilities are currently in development. Check
            back later for server management, world tools, and more!
          </p>
        </div>
      </FadeIn>
    </div>
  );
}

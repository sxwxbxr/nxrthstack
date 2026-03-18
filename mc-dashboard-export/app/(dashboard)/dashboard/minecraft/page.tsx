import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Icons } from "@/components/icons";
import { FadeIn } from "@/components/ui/fade-in";
import { GradientText } from "@/components/ui/gradient-text";
import { MinecraftServersClient } from "@/components/minecraft/minecraft-servers-client";

export const metadata = {
  title: "Minecraft | GameHub - NxrthStack",
};

export const dynamic = "force-dynamic";

export default async function MinecraftPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <FadeIn>
        <Link
          href="/dashboard/gamehub"
          className="inline-flex items-center text-sm text-foreground/60 hover:text-foreground mb-4"
        >
          <Icons.ChevronRight className="h-4 w-4 mr-1 rotate-180" />
          Back to GameHub
        </Link>
        <div className="text-center">
          <h1 className="text-4xl font-bold">
            <GradientText>Minecraft Servers</GradientText>
          </h1>
          <p className="mt-2 text-foreground/60 max-w-2xl mx-auto">
            Manage and monitor your Minecraft servers. Enter an access code to
            unlock a server dashboard.
          </p>
        </div>
      </FadeIn>

      {/* Server list + access code (client component) */}
      <FadeIn delay={0.1}>
        <MinecraftServersClient />
      </FadeIn>
    </div>
  );
}

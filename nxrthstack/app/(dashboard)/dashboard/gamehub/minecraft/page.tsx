import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Icons } from "@/components/icons";
import { FadeIn } from "@/components/ui/fade-in";
import { GradientText } from "@/components/ui/gradient-text";
import { MinecraftServerChecker } from "@/components/gamehub/minecraft-server-checker";

export const metadata = {
  title: "Minecraft | GameHub - NxrthStack",
};

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
          className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-4"
        >
          <Icons.ChevronRight className="h-4 w-4 mr-1 rotate-180" />
          Back to GameHub
        </Link>
        <div className="text-center">
          <h1 className="text-4xl font-bold">
            <GradientText>Minecraft</GradientText>
          </h1>
          <p className="mt-2 text-muted-foreground max-w-2xl mx-auto">
            Tools and utilities for Minecraft. Check server status, monitor
            player counts, and more.
          </p>
        </div>
      </FadeIn>

      {/* Server Status Checker */}
      <FadeIn delay={0.1}>
        <div className="max-w-3xl mx-auto">
          <MinecraftServerChecker />
        </div>
      </FadeIn>

      {/* Coming Soon Features */}
      <FadeIn delay={0.2}>
        <div className="max-w-3xl mx-auto">
          <h2 className="text-xl font-semibold text-foreground mb-4">
            Coming Soon
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="rounded-xl border border-dashed border-border p-6">
              <div className="flex items-center gap-3 mb-2">
                <Icons.Users className="h-5 w-5 text-muted-foreground" />
                <h3 className="font-medium text-foreground">
                  Server Management
                </h3>
              </div>
              <p className="text-sm text-muted-foreground">
                Manage your own Minecraft servers with easy-to-use controls
              </p>
            </div>
            <div className="rounded-xl border border-dashed border-border p-6">
              <div className="flex items-center gap-3 mb-2">
                <Icons.Globe className="h-5 w-5 text-muted-foreground" />
                <h3 className="font-medium text-foreground">World Tools</h3>
              </div>
              <p className="text-sm text-muted-foreground">
                View and edit your Minecraft world saves and backups
              </p>
            </div>
            <div className="rounded-xl border border-dashed border-border p-6">
              <div className="flex items-center gap-3 mb-2">
                <Icons.FileText className="h-5 w-5 text-muted-foreground" />
                <h3 className="font-medium text-foreground">
                  Plugin Directory
                </h3>
              </div>
              <p className="text-sm text-muted-foreground">
                Browse and discover popular server plugins and mods
              </p>
            </div>
            <div className="rounded-xl border border-dashed border-border p-6">
              <div className="flex items-center gap-3 mb-2">
                <Icons.TrendingUp className="h-5 w-5 text-muted-foreground" />
                <h3 className="font-medium text-foreground">
                  Server Analytics
                </h3>
              </div>
              <p className="text-sm text-muted-foreground">
                Track player activity and server performance over time
              </p>
            </div>
          </div>
        </div>
      </FadeIn>
    </div>
  );
}

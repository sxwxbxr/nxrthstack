import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { FadeIn } from "@/components/ui/fade-in";
import { GradientText } from "@/components/ui/gradient-text";
import { Icons } from "@/components/icons";
import { StratRoulette } from "@/components/gamehub/strat-roulette";

export const metadata = {
  title: "Strat Roulette | R6 Siege - GameHub",
  description: "Random strategy generator for Rainbow Six Siege matches",
};

export default async function StratRoulettePage() {
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
            <GradientText>Strat Roulette</GradientText>
          </h1>
          <p className="mt-2 text-muted-foreground">
            Spin the wheel for random strategies and challenges. Perfect for casual matches or when you want to spice things up!
          </p>
        </div>
      </FadeIn>

      <FadeIn delay={0.1}>
        <StratRoulette />
      </FadeIn>
    </div>
  );
}

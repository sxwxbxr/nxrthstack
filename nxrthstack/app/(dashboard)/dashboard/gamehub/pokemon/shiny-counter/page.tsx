import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Icons } from "@/components/icons";
import { FadeIn } from "@/components/ui/fade-in";
import { GradientText } from "@/components/ui/gradient-text";
import { ShinyCounter } from "@/components/gamehub/shiny-counter";

export const metadata = {
  title: "Shiny Counter | Pokemon - NxrthStack",
};

export default async function ShinyCounterPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <FadeIn>
        <Link
          href="/dashboard/gamehub/pokemon"
          className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-4"
        >
          <Icons.ChevronRight className="h-4 w-4 mr-1 rotate-180" />
          Back to Pokemon
        </Link>
        <div className="text-center">
          <h1 className="text-4xl font-bold">
            <GradientText>Shiny Counter</GradientText>
          </h1>
          <p className="mt-2 text-muted-foreground max-w-2xl mx-auto">
            Track your shiny hunts across any Pokemon game. Monitor encounters,
            calculate probabilities, and keep a record of all your shinies.
          </p>
        </div>
      </FadeIn>

      {/* Shiny Counter Component */}
      <FadeIn delay={0.1}>
        <div className="max-w-2xl mx-auto">
          <ShinyCounter />
        </div>
      </FadeIn>

      {/* Tips */}
      <FadeIn delay={0.2}>
        <div className="max-w-2xl mx-auto rounded-xl border border-border bg-card p-6">
          <h3 className="font-semibold text-foreground mb-4 flex items-center gap-2">
            <Icons.Info className="h-5 w-5 text-primary" />
            Hunting Tips
          </h3>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li className="flex items-start gap-2">
              <Icons.Sparkles className="h-4 w-4 text-yellow-500 mt-0.5 flex-shrink-0" />
              <span>
                The Shiny Charm increases your odds significantly - get it by
                completing the Pokedex!
              </span>
            </li>
            <li className="flex items-start gap-2">
              <Icons.Sparkles className="h-4 w-4 text-yellow-500 mt-0.5 flex-shrink-0" />
              <span>
                Masuda Method (breeding with foreign Pokemon) is one of the most
                reliable methods.
              </span>
            </li>
            <li className="flex items-start gap-2">
              <Icons.Sparkles className="h-4 w-4 text-yellow-500 mt-0.5 flex-shrink-0" />
              <span>
                Chain methods (Poke Radar, SOS, etc.) can dramatically improve
                odds as your chain grows.
              </span>
            </li>
            <li className="flex items-start gap-2">
              <Icons.Sparkles className="h-4 w-4 text-yellow-500 mt-0.5 flex-shrink-0" />
              <span>
                Your data is saved locally in your browser - no account needed!
              </span>
            </li>
          </ul>
        </div>
      </FadeIn>
    </div>
  );
}

import { FadeIn } from "@/components/ui/fade-in";
import { GradientText } from "@/components/ui/gradient-text";
import { OperatorRandomizer } from "@/components/gamehub/operator-randomizer";
import Link from "next/link";
import { Icons } from "@/components/icons";

export const metadata = {
  title: "Operator Randomizer | Rainbow Six Siege - NxrthStack",
};

export default function RandomizerPage() {
  return (
    <div className="space-y-8">
      {/* Header */}
      <FadeIn>
        <Link
          href="/dashboard/gamehub/r6"
          className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-4"
        >
          <Icons.ChevronRight className="h-4 w-4 mr-1 rotate-180" />
          Back to R6 Siege
        </Link>
        <h1 className="text-3xl font-bold">
          Operator <GradientText>Randomizer</GradientText>
        </h1>
        <p className="mt-2 text-muted-foreground">
          Randomize your operator and loadout for fun challenges
        </p>
      </FadeIn>

      {/* Randomizer */}
      <FadeIn delay={0.1}>
        <OperatorRandomizer />
      </FadeIn>
    </div>
  );
}

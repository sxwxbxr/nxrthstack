import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Icons } from "@/components/icons";
import { FadeIn } from "@/components/ui/fade-in";
import { GradientText } from "@/components/ui/gradient-text";
import { IVCalculatorClient } from "@/components/gamehub/iv-calculator-client";

export const metadata = {
  title: "IV Calculator | Pokemon - NxrthStack",
  description: "Calculate Pokemon IVs from observed stats",
};

export default async function IVCalculatorPage() {
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
              <GradientText>IV Calculator</GradientText>
            </h1>
            <p className="mt-1 text-muted-foreground">
              Calculate your Pokemon's Individual Values from observed stats
            </p>
          </div>
        </div>
      </FadeIn>

      {/* Calculator */}
      <FadeIn delay={0.1}>
        <IVCalculatorClient />
      </FadeIn>
    </div>
  );
}

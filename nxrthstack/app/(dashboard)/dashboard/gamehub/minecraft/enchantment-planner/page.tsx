import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Icons } from "@/components/icons";
import { FadeIn } from "@/components/ui/fade-in";
import { GradientText } from "@/components/ui/gradient-text";
import { EnchantmentPlannerClient } from "@/components/gamehub/enchantment-planner-client";

export const metadata = {
  title: "Enchantment Planner | Minecraft - NxrthStack",
  description: "Plan optimal enchantment combinations for your Minecraft items",
};

export default async function EnchantmentPlannerPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <FadeIn>
        <Link
          href="/dashboard/gamehub/minecraft"
          className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-4"
        >
          <Icons.ChevronRight className="h-4 w-4 mr-1 rotate-180" />
          Back to Minecraft
        </Link>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">
              <GradientText>Enchantment Planner</GradientText>
            </h1>
            <p className="mt-1 text-muted-foreground">
              Plan optimal enchantment combinations and calculate anvil costs
            </p>
          </div>
        </div>
      </FadeIn>

      {/* Planner */}
      <FadeIn delay={0.1}>
        <EnchantmentPlannerClient />
      </FadeIn>
    </div>
  );
}

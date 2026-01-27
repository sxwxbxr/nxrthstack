import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Icons } from "@/components/icons";
import { FadeIn } from "@/components/ui/fade-in";
import { GradientText } from "@/components/ui/gradient-text";
import { CreateTournamentForm } from "@/components/gamehub/create-tournament-form";

export const metadata = {
  title: "Create Tournament | R6 Siege - NxrthStack",
};

export default async function CreateTournamentPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  if (!session.user.isFriend && session.user.role !== "admin") {
    redirect("/dashboard/gamehub");
  }

  return (
    <div className="space-y-8 max-w-2xl mx-auto">
      {/* Header */}
      <FadeIn>
        <Link
          href="/dashboard/gamehub/r6/tournaments"
          className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-4"
        >
          <Icons.ChevronRight className="h-4 w-4 mr-1 rotate-180" />
          Back to Tournaments
        </Link>
        <div className="text-center">
          <h1 className="text-4xl font-bold">
            <GradientText>Create Tournament</GradientText>
          </h1>
          <p className="mt-2 text-muted-foreground">
            Set up a new bracket tournament for your friends
          </p>
        </div>
      </FadeIn>

      {/* Create Form */}
      <FadeIn delay={0.1}>
        <CreateTournamentForm />
      </FadeIn>
    </div>
  );
}

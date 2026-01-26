import { FadeIn } from "@/components/ui/fade-in";
import { GradientText } from "@/components/ui/gradient-text";
import { CreateLobbyForm } from "@/components/gamehub/create-lobby-form";
import Link from "next/link";
import { Icons } from "@/components/icons";

export const metadata = {
  title: "Create Lobby | 1v1 Tracker - NxrthStack",
};

export default function CreateLobbyPage() {
  return (
    <div className="max-w-2xl mx-auto space-y-8">
      {/* Header */}
      <FadeIn>
        <Link
          href="/dashboard/gamehub/r6/1v1"
          className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-4"
        >
          <Icons.ChevronRight className="h-4 w-4 mr-1 rotate-180" />
          Back to 1v1 Tracker
        </Link>
        <h1 className="text-3xl font-bold">
          Create <GradientText>1v1 Lobby</GradientText>
        </h1>
        <p className="mt-2 text-muted-foreground">
          Set up a new lobby to track your 1v1 matches
        </p>
      </FadeIn>

      {/* Form */}
      <FadeIn delay={0.1}>
        <CreateLobbyForm />
      </FadeIn>
    </div>
  );
}

import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { FadeIn } from "@/components/ui/fade-in";
import { GradientText } from "@/components/ui/gradient-text";
import { FeedbackClient } from "@/components/feedback/feedback-client";

export const metadata = {
  title: "Feedback | GameHub - NxrthStack",
  description: "Submit feature ideas and bug reports for GameHub",
};

export default async function FeedbackPage() {
  const session = await auth();

  if (!session?.user?.isFriend && session?.user?.role !== "admin") {
    redirect("/dashboard/gamehub");
  }

  return (
    <div className="space-y-8">
      <FadeIn>
        <div>
          <h1 className="text-3xl font-bold text-foreground">
            <GradientText>Feedback</GradientText>
          </h1>
          <p className="mt-2 text-muted-foreground">
            Submit feature ideas or report bugs. Vote on submissions to help prioritize development.
          </p>
        </div>
      </FadeIn>

      <FadeIn delay={0.1}>
        <FeedbackClient
          userId={session.user.id}
          isAdmin={session.user.role === "admin"}
        />
      </FadeIn>
    </div>
  );
}

import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Icons } from "@/components/icons";
import { FadeIn } from "@/components/ui/fade-in";
import { GradientText } from "@/components/ui/gradient-text";
import { SaveEditorClient } from "@/components/gamehub/save-editor-client";

export const metadata = {
  title: "Save Editor | Pokemon - NxrthStack",
};

export default async function SaveEditorPage() {
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
        <div>
          <h1 className="text-3xl font-bold">
            <GradientText>Save Editor</GradientText>
          </h1>
          <p className="mt-1 text-muted-foreground">
            Edit your Pokemon save files - trainer data, party, inventory, and more
          </p>
        </div>
      </FadeIn>

      {/* Save Editor */}
      <FadeIn delay={0.1}>
        <SaveEditorClient />
      </FadeIn>
    </div>
  );
}

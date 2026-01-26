import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { GameHubNav } from "@/components/gamehub/gamehub-nav";

export default async function GameHubLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  // Protect GameHub - only accessible to friends or admins
  if (!session?.user?.isFriend && session?.user?.role !== "admin") {
    redirect("/dashboard");
  }

  return (
    <div className="space-y-6">
      <GameHubNav />
      {children}
    </div>
  );
}

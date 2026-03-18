import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { McServerShell } from "@/components/minecraft/mc-server-shell";

export const dynamic = "force-dynamic";

export default async function McServerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/login");
  }

  return (
    <McServerShell userId={session.user.id}>{children}</McServerShell>
  );
}

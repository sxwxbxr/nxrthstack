import { redirect } from "next/navigation";
import { getSessionWithUser } from "@/lib/auth/server";
import { AdminSidebar } from "@/components/admin/admin-sidebar";

export const dynamic = "force-dynamic";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user } = await getSessionWithUser();

  if (!user) {
    redirect("/login");
  }

  if (user.role !== "admin") {
    redirect("/dashboard");
  }

  return (
    <div className="dark min-h-screen bg-background">
      <AdminSidebar />
      <main className="pl-64">
        <div className="p-8">{children}</div>
      </main>
    </div>
  );
}

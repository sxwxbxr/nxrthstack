import { redirect } from "next/navigation";
import { getSessionWithUser } from "@/lib/auth/server";
import { AdminSidebar } from "@/components/admin/admin-sidebar";
import { MobileSidebarProvider, MobileMenuButton } from "@/components/ui/mobile-sidebar";

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
      <MobileSidebarProvider>
        <AdminSidebar />
        <main className="md:pl-64">
          {/* Mobile header */}
          <div className="fixed top-0 right-0 left-0 md:left-64 z-30 flex h-14 md:h-16 items-center justify-between border-b border-border bg-background/80 px-4 md:px-8 backdrop-blur-sm md:hidden">
            <MobileMenuButton />
            <span className="text-sm font-medium text-foreground">Admin</span>
            <div className="w-9" />
          </div>
          <div className="pt-14 md:pt-0 p-4 md:p-8">{children}</div>
        </main>
      </MobileSidebarProvider>
    </div>
  );
}

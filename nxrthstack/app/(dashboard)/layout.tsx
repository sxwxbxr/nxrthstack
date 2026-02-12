import { DashboardNav } from "@/components/dashboard/dashboard-nav";
import { NotificationBell } from "@/components/notifications";
import { MobileSidebarProvider, MobileMenuButton } from "@/components/ui/mobile-sidebar";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="dark min-h-screen bg-background">
      <MobileSidebarProvider>
        <DashboardNav />
        <main className="md:pl-64">
          {/* Header */}
          <div className="fixed top-0 right-0 left-0 md:left-64 z-30 flex h-14 md:h-16 items-center justify-between md:justify-end border-b border-border bg-background/80 px-4 md:px-8 backdrop-blur-sm">
            <MobileMenuButton />
            <NotificationBell />
          </div>
          <div className="pt-14 md:pt-16 p-4 md:p-8">{children}</div>
        </main>
      </MobileSidebarProvider>
    </div>
  );
}

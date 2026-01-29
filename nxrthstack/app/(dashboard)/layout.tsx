import { DashboardNav } from "@/components/dashboard/dashboard-nav";
import { NotificationBell } from "@/components/notifications";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="dark min-h-screen bg-background">
      <DashboardNav />
      <main className="pl-64">
        <div className="fixed top-0 right-0 left-64 z-30 flex h-16 items-center justify-end border-b border-border bg-background/80 px-8 backdrop-blur-sm">
          <NotificationBell />
        </div>
        <div className="pt-16 p-8">{children}</div>
      </main>
    </div>
  );
}

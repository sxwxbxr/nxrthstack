import { DashboardNav } from "@/components/dashboard/dashboard-nav";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="dark min-h-screen bg-background">
      <DashboardNav />
      <main className="pl-64">
        <div className="p-8">{children}</div>
      </main>
    </div>
  );
}

import { TacticsNav } from "@/components/gamehub/tactics/tactics-nav";

export const metadata = {
  title: "Tactics | GameHub - NxrthStack",
};

export default function TacticsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-6">
      <TacticsNav />
      {children}
    </div>
  );
}

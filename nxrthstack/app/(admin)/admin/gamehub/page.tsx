import { db, gamehubAnnouncements } from "@/lib/db";
import { desc } from "drizzle-orm";
import { Icons } from "@/components/icons";
import { FadeIn } from "@/components/ui/fade-in";
import { AnnouncementsManager } from "@/components/admin/announcements-manager";

export const metadata = {
  title: "GameHub | Admin - NxrthStack",
};

async function getAnnouncements() {
  return db.query.gamehubAnnouncements.findMany({
    orderBy: [desc(gamehubAnnouncements.isPinned), desc(gamehubAnnouncements.createdAt)],
  });
}

export default async function AdminGameHubPage() {
  const announcements = await getAnnouncements();

  return (
    <div>
      <FadeIn>
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground">GameHub</h1>
          <p className="mt-1 text-muted-foreground">
            Manage announcements and GameHub settings
          </p>
        </div>
      </FadeIn>

      {/* Stats */}
      <FadeIn delay={0.1}>
        <div className="grid grid-cols-3 gap-4 mb-8">
          <div className="rounded-xl border border-border bg-card p-6">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                <Icons.Info className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">
                  {announcements.length}
                </p>
                <p className="text-sm text-muted-foreground">Announcements</p>
              </div>
            </div>
          </div>
          <div className="rounded-xl border border-border bg-card p-6">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-yellow-500/10">
                <Icons.TrendingUp className="h-5 w-5 text-yellow-500" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">
                  {announcements.filter((a) => a.isPinned).length}
                </p>
                <p className="text-sm text-muted-foreground">Pinned</p>
              </div>
            </div>
          </div>
          <div className="rounded-xl border border-border bg-card p-6">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-500/10">
                <Icons.Check className="h-5 w-5 text-green-500" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">
                  {announcements.filter((a) => a.isActive).length}
                </p>
                <p className="text-sm text-muted-foreground">Active</p>
              </div>
            </div>
          </div>
        </div>
      </FadeIn>

      {/* Announcements Manager */}
      <FadeIn delay={0.2}>
        <AnnouncementsManager initialAnnouncements={announcements} />
      </FadeIn>
    </div>
  );
}

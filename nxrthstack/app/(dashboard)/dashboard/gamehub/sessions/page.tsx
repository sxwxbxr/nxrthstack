import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Icons } from "@/components/icons";
import { FadeIn } from "@/components/ui/fade-in";
import { GradientText } from "@/components/ui/gradient-text";
import { SessionCalendar } from "@/components/gamehub/session-calendar";
import { db, gamingSessions, users } from "@/lib/db";
import { eq, gte, and } from "drizzle-orm";

export const metadata = {
  title: "Session Scheduler | GameHub - NxrthStack",
};

async function getCalendarEntries(userId: string) {
  // Get sessions from the past week to 2 weeks in the future
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - 7);

  const endDate = new Date();
  endDate.setDate(endDate.getDate() + 14);

  try {
    const sessions = await db
      .select({
        id: gamingSessions.id,
        title: gamingSessions.title,
        game: gamingSessions.game,
        scheduledAt: gamingSessions.scheduledAt,
        durationMinutes: gamingSessions.durationMinutes,
        hostId: gamingSessions.hostId,
        userName: users.name,
        userAvatar: users.discordAvatar,
      })
      .from(gamingSessions)
      .innerJoin(users, eq(gamingSessions.hostId, users.id))
      .where(
        and(
          gte(gamingSessions.scheduledAt, startDate),
          eq(gamingSessions.status, "scheduled")
        )
      );

    return sessions.map((session) => ({
      id: session.id,
      title: session.title,
      game: session.game,
      startTime: session.scheduledAt,
      endTime: new Date(session.scheduledAt.getTime() + (session.durationMinutes || 60) * 60000),
      userId: session.hostId,
      userName: session.userName,
      userAvatar: session.userAvatar,
    }));
  } catch (error) {
    console.error("Failed to load calendar entries:", error);
    return [];
  }
}

export default async function SessionsPage() {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/login");
  }

  const entries = await getCalendarEntries(session.user.id);

  return (
    <div className="h-[calc(100vh-8rem)] flex flex-col">
      {/* Header */}
      <FadeIn>
        <div className="mb-4">
          <Link
            href="/dashboard/gamehub"
            className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-2"
          >
            <Icons.ChevronRight className="h-4 w-4 mr-1 rotate-180" />
            Back to GameHub
          </Link>
          <h1 className="text-3xl font-bold">
            <GradientText>Session Scheduler</GradientText>
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            See when friends are playing and schedule your gaming time
          </p>
        </div>
      </FadeIn>

      {/* Legend */}
      <FadeIn delay={0.1}>
        <div className="flex flex-wrap gap-3 mb-4 text-xs">
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded bg-orange-500" />
            <span className="text-muted-foreground">R6 Siege</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded bg-green-500" />
            <span className="text-muted-foreground">Minecraft</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded bg-yellow-500" />
            <span className="text-muted-foreground">Pokemon</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded bg-red-500" />
            <span className="text-muted-foreground">Valorant</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded bg-blue-500" />
            <span className="text-muted-foreground">CS2</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded bg-purple-500" />
            <span className="text-muted-foreground">Other</span>
          </div>
        </div>
      </FadeIn>

      {/* Calendar */}
      <FadeIn delay={0.2} className="flex-1 min-h-0">
        <SessionCalendar
          entries={entries}
          currentUserId={session.user.id}
          currentUserName={session.user.name || null}
        />
      </FadeIn>
    </div>
  );
}

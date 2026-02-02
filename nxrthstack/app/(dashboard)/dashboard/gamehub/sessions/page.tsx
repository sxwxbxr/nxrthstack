import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Icons } from "@/components/icons";
import { FadeIn, StaggerContainer, StaggerItem } from "@/components/ui/fade-in";
import { GradientText } from "@/components/ui/gradient-text";
import { getUpcomingSessions, getUserSessions, GAME_OPTIONS } from "@/lib/gamehub/sessions";
import { SessionCard } from "@/components/gamehub/session-card";
import { CreateSessionButton } from "@/components/gamehub/create-session-button";

export const metadata = {
  title: "Session Scheduler | GameHub - NxrthStack",
};

export default async function SessionsPage() {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/login");
  }

  const [upcomingSessions, userSessions] = await Promise.all([
    getUpcomingSessions(session.user.id, 10),
    getUserSessions(session.user.id),
  ]);

  const myHostedSessions = userSessions.hosting;
  const myAttendingSessions = userSessions.attending;

  return (
    <div className="space-y-8">
      {/* Header */}
      <FadeIn>
        <Link
          href="/dashboard/gamehub"
          className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-4"
        >
          <Icons.ChevronRight className="h-4 w-4 mr-1 rotate-180" />
          Back to GameHub
        </Link>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold">
              <GradientText>Session Scheduler</GradientText>
            </h1>
            <p className="mt-2 text-muted-foreground">
              Plan gaming sessions with friends
            </p>
          </div>
          <CreateSessionButton />
        </div>
      </FadeIn>

      {/* My Hosted Sessions */}
      {myHostedSessions.length > 0 && (
        <FadeIn delay={0.1}>
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
              <Icons.Crown className="h-5 w-5 text-yellow-500" />
              Sessions You&apos;re Hosting
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {myHostedSessions.map((gamingSession) => (
                <SessionCard
                  key={gamingSession.id}
                  session={{
                    ...gamingSession,
                    host: {
                      id: session.user.id!,
                      name: session.user.name ?? null,
                      discordUsername: null,
                      discordAvatar: null,
                    },
                    rsvpCounts: { going: 0, maybe: 0, not_going: 0, pending: 0 },
                  }}
                  isHost
                />
              ))}
            </div>
          </div>
        </FadeIn>
      )}

      {/* Sessions I'm Attending */}
      {myAttendingSessions.length > 0 && (
        <FadeIn delay={0.15}>
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
              <Icons.Calendar className="h-5 w-5 text-green-500" />
              Sessions You&apos;re Attending
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {myAttendingSessions.map((gamingSession) => (
                <SessionCard
                  key={gamingSession.id}
                  session={{
                    ...gamingSession,
                    host: {
                      id: gamingSession.hostId,
                      name: null,
                      discordUsername: null,
                      discordAvatar: null,
                    },
                    rsvpCounts: { going: 0, maybe: 0, not_going: 0, pending: 0 },
                    userRsvp: "going",
                  }}
                />
              ))}
            </div>
          </div>
        </FadeIn>
      )}

      {/* Upcoming Public Sessions */}
      <FadeIn delay={0.2}>
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
            <Icons.Users className="h-5 w-5 text-primary" />
            Upcoming Sessions
          </h2>

          {upcomingSessions.length > 0 ? (
            <StaggerContainer className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {upcomingSessions.map((gamingSession) => (
                <StaggerItem key={gamingSession.id}>
                  <SessionCard
                    session={gamingSession}
                    isHost={gamingSession.host.id === session.user.id}
                    currentUserId={session.user.id}
                  />
                </StaggerItem>
              ))}
            </StaggerContainer>
          ) : (
            <div className="rounded-xl border border-dashed border-border p-12 text-center">
              <Icons.Calendar className="mx-auto h-12 w-12 text-muted-foreground/50" />
              <h3 className="mt-4 text-lg font-medium text-foreground">
                No upcoming sessions
              </h3>
              <p className="mt-2 text-muted-foreground">
                Be the first to schedule a gaming session!
              </p>
              <div className="mt-4">
                <CreateSessionButton />
              </div>
            </div>
          )}
        </div>
      </FadeIn>

      {/* Game Filter Quick Links */}
      <FadeIn delay={0.25}>
        <div className="rounded-xl border border-border bg-card/50 p-6">
          <h3 className="text-sm font-medium text-muted-foreground mb-4">
            Filter by Game
          </h3>
          <div className="flex flex-wrap gap-2">
            {GAME_OPTIONS.map((game) => (
              <Link
                key={game.value}
                href={`/dashboard/gamehub/sessions?game=${game.value}`}
                className="px-3 py-1.5 text-sm rounded-full bg-muted hover:bg-primary/20 hover:text-primary transition-colors"
              >
                {game.label}
              </Link>
            ))}
          </div>
        </div>
      </FadeIn>
    </div>
  );
}

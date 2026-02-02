import { notFound } from "next/navigation";
import { getPublicProfile, trackProfileView } from "@/lib/gamehub/profiles";
import { auth } from "@/lib/auth";
import { Icons } from "@/components/icons";
import Link from "next/link";

type PageProps = {
  params: Promise<{ username: string }>;
};

export async function generateMetadata({ params }: PageProps) {
  const { username } = await params;
  const profile = await getPublicProfile(username);

  if (!profile) {
    return { title: "Profile Not Found - NxrthStack" };
  }

  const displayName =
    profile.user.discordUsername || profile.user.name || profile.user.email;

  return {
    title: `${displayName} | Gaming Passport - NxrthStack`,
    description: profile.bio || `${displayName}'s gaming profile on NxrthStack`,
  };
}

export default async function PublicProfilePage({ params }: PageProps) {
  const { username } = await params;
  const profile = await getPublicProfile(username);

  if (!profile) {
    notFound();
  }

  // Track view
  const session = await auth();
  await trackProfileView(profile.id, session?.user?.id);

  const displayName =
    profile.user.discordUsername || profile.user.name || profile.user.email;

  return (
    <div className="min-h-screen bg-background">
      {/* Banner */}
      <div className="relative h-48 md:h-64 bg-gradient-to-r from-primary/20 to-purple-500/20">
        {profile.bannerUrl && (
          <img
            src={profile.bannerUrl}
            alt="Banner"
            className="w-full h-full object-cover"
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-background to-transparent" />
      </div>

      <div className="max-w-4xl mx-auto px-4 pb-12">
        {/* Profile Header */}
        <div className="relative -mt-16 md:-mt-20 mb-8">
          <div className="flex flex-col md:flex-row md:items-end gap-4">
            {/* Avatar */}
            {profile.user.discordAvatar ? (
              <img
                src={profile.user.discordAvatar}
                alt={displayName}
                className="h-32 w-32 rounded-full border-4 border-background"
              />
            ) : (
              <div className="h-32 w-32 rounded-full border-4 border-background bg-primary/20 flex items-center justify-center text-4xl font-bold text-primary">
                {displayName[0].toUpperCase()}
              </div>
            )}

            <div className="flex-1 pb-2">
              <h1 className="text-3xl font-bold text-foreground">{displayName}</h1>
              <p className="text-muted-foreground">@{profile.usernameSlug}</p>
              {profile.bio && (
                <p className="mt-2 text-foreground/80">{profile.bio}</p>
              )}
            </div>

            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Icons.Eye className="h-4 w-4" />
              <span>{profile.viewCount} views</span>
            </div>
          </div>
        </div>

        {/* Stats */}
        {profile.showStats && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <StatCard
              label="Achievement Points"
              value={profile.stats.achievementPoints}
              icon={Icons.Trophy}
              color="text-yellow-500"
            />
            <StatCard
              label="Achievements"
              value={profile.stats.achievementCount}
              icon={Icons.Award}
              color="text-purple-500"
            />
            <StatCard
              label="Rivalry Wins"
              value={profile.stats.rivalryWins}
              icon={Icons.Swords}
              color="text-red-500"
            />
            <StatCard
              label="R6 1v1 Wins"
              value={profile.stats.r6Wins}
              icon={Icons.Target}
              color="text-blue-500"
            />
          </div>
        )}

        {/* Featured Achievements */}
        {profile.achievements.length > 0 && (
          <div className="rounded-xl border border-border bg-card p-6 mb-8">
            <h2 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
              <Icons.Star className="h-5 w-5 text-yellow-500" />
              Achievements
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {profile.achievements.map((achievement) => (
                <div
                  key={achievement.id}
                  className="flex items-center gap-3 p-3 rounded-lg bg-muted/50"
                >
                  <div
                    className={`flex h-10 w-10 items-center justify-center rounded-full ${getRarityColor(
                      achievement.rarity
                    )}`}
                  >
                    {achievement.icon ? (
                      <span className="text-lg">{achievement.icon}</span>
                    ) : (
                      <Icons.Award className="h-5 w-5" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-foreground text-sm truncate">
                      {achievement.name}
                    </p>
                    <p className="text-xs text-muted-foreground capitalize">
                      {achievement.rarity}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Social Links */}
        {Object.keys(profile.socialLinks).length > 0 && (
          <div className="rounded-xl border border-border bg-card p-6 mb-8">
            <h2 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
              <Icons.Link className="h-5 w-5 text-primary" />
              Links
            </h2>
            <div className="flex flex-wrap gap-3">
              {Object.entries(profile.socialLinks).map(([key, value]) => (
                <a
                  key={key}
                  href={value}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 px-4 py-2 rounded-lg bg-muted hover:bg-muted/80 transition-colors"
                >
                  <Icons.ExternalLink className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm text-foreground capitalize">{key}</span>
                </a>
              ))}
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="text-center">
          <Link
            href="/"
            className="text-sm text-muted-foreground hover:text-primary transition-colors"
          >
            Powered by NxrthStack GameHub
          </Link>
        </div>
      </div>
    </div>
  );
}

function StatCard({
  label,
  value,
  icon: Icon,
  color,
}: {
  label: string;
  value: number;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
}) {
  return (
    <div className="rounded-xl border border-border bg-card p-4 text-center">
      <Icon className={`h-6 w-6 mx-auto mb-2 ${color}`} />
      <p className="text-2xl font-bold text-foreground">{value.toLocaleString()}</p>
      <p className="text-sm text-muted-foreground">{label}</p>
    </div>
  );
}

function getRarityColor(rarity: string | null): string {
  switch (rarity) {
    case "legendary":
      return "bg-orange-500/20 text-orange-500";
    case "epic":
      return "bg-purple-500/20 text-purple-500";
    case "rare":
      return "bg-blue-500/20 text-blue-500";
    case "uncommon":
      return "bg-green-500/20 text-green-500";
    default:
      return "bg-muted text-muted-foreground";
  }
}

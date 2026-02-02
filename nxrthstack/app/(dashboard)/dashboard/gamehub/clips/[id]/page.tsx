import { auth } from "@/lib/auth";
import { redirect, notFound } from "next/navigation";
import { db, clips, users, clipLikes, clipComments } from "@/lib/db";
import { eq, and, sql, desc } from "drizzle-orm";
import { FadeIn } from "@/components/ui/fade-in";
import { Icons } from "@/components/icons";
import Link from "next/link";
import { ClipPlayer } from "@/components/gamehub/clip-player";
import { ClipComments } from "@/components/gamehub/clip-comments";

interface ClipPageProps {
  params: Promise<{ id: string }>;
}

async function getClip(id: string, userId?: string) {
  const clipData = await db
    .select({
      id: clips.id,
      title: clips.title,
      description: clips.description,
      game: clips.game,
      category: clips.category,
      blobUrl: clips.blobUrl,
      thumbnailUrl: clips.thumbnailUrl,
      durationSeconds: clips.durationSeconds,
      viewCount: clips.viewCount,
      isFeatured: clips.isFeatured,
      isPublic: clips.isPublic,
      createdAt: clips.createdAt,
      userId: clips.userId,
      userName: users.name,
      userDiscordAvatar: users.discordAvatar,
      likeCount: sql<number>`(SELECT COUNT(*) FROM clip_likes WHERE clip_id = ${clips.id})`.as("like_count"),
      commentCount: sql<number>`(SELECT COUNT(*) FROM clip_comments WHERE clip_id = ${clips.id})`.as("comment_count"),
    })
    .from(clips)
    .leftJoin(users, eq(clips.userId, users.id))
    .where(eq(clips.id, id))
    .limit(1);

  if (clipData.length === 0) {
    return null;
  }

  const clip = clipData[0];

  // Check if current user has liked this clip
  let hasLiked = false;
  if (userId) {
    const like = await db.query.clipLikes.findFirst({
      where: and(
        eq(clipLikes.clipId, id),
        eq(clipLikes.userId, userId)
      ),
    });
    hasLiked = !!like;
  }

  // Get initial comments
  const comments = await db
    .select({
      id: clipComments.id,
      content: clipComments.content,
      createdAt: clipComments.createdAt,
      userId: clipComments.userId,
      userName: users.name,
      userDiscordAvatar: users.discordAvatar,
    })
    .from(clipComments)
    .leftJoin(users, eq(clipComments.userId, users.id))
    .where(eq(clipComments.clipId, id))
    .orderBy(desc(clipComments.createdAt))
    .limit(20);

  // Increment view count
  await db
    .update(clips)
    .set({ viewCount: sql`${clips.viewCount} + 1` })
    .where(eq(clips.id, id));

  return { ...clip, hasLiked, comments };
}

export async function generateMetadata({ params }: ClipPageProps) {
  const { id } = await params;
  const clip = await getClip(id);

  if (!clip) {
    return { title: "Clip Not Found" };
  }

  return {
    title: `${clip.title} | Clip Gallery - NxrthStack`,
    description: clip.description || `Watch ${clip.title} on NxrthStack`,
  };
}

export default async function ClipPage({ params }: ClipPageProps) {
  const { id } = await params;
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/login");
  }

  if (!session.user.isFriend && session.user.role !== "admin") {
    redirect("/dashboard/gamehub");
  }

  const clip = await getClip(id, session.user.id);

  if (!clip) {
    notFound();
  }

  // Check if clip is private and user is not the owner
  if (!clip.isPublic && clip.userId !== session.user.id) {
    notFound();
  }

  const isOwner = clip.userId === session.user.id;

  const gameColors: Record<string, string> = {
    r6: "text-orange-500",
    minecraft: "text-green-500",
    pokemon: "text-yellow-500",
    valorant: "text-red-500",
    other: "text-primary",
  };

  const categoryLabels: Record<string, string> = {
    funny: "Funny",
    clutch: "Clutch",
    fail: "Fail",
    tutorial: "Tutorial",
    highlight: "Highlight",
  };

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <FadeIn>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Link
            href="/dashboard/gamehub"
            className="hover:text-foreground transition-colors"
          >
            GameHub
          </Link>
          <Icons.ChevronRight className="h-4 w-4" />
          <Link
            href="/dashboard/gamehub/clips"
            className="hover:text-foreground transition-colors"
          >
            Clip Gallery
          </Link>
          <Icons.ChevronRight className="h-4 w-4" />
          <span className="text-foreground truncate max-w-[200px]">
            {clip.title}
          </span>
        </div>
      </FadeIn>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Video Player */}
        <div className="lg:col-span-2 space-y-4">
          <FadeIn>
            <ClipPlayer
              clipId={clip.id}
              blobUrl={clip.blobUrl}
              thumbnailUrl={clip.thumbnailUrl}
              title={clip.title}
              initialLiked={clip.hasLiked}
              initialLikeCount={clip.likeCount}
              isOwner={isOwner}
            />
          </FadeIn>

          {/* Clip Info */}
          <FadeIn delay={0.1}>
            <div className="rounded-xl border border-border bg-card p-6">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h1 className="text-2xl font-bold text-foreground">
                    {clip.title}
                  </h1>
                  <div className="flex items-center gap-3 mt-2 text-sm text-muted-foreground">
                    <span
                      className={`font-medium ${gameColors[clip.game] || gameColors.other}`}
                    >
                      {clip.game.toUpperCase()}
                    </span>
                    {clip.category && (
                      <>
                        <span>-</span>
                        <span>{categoryLabels[clip.category] || clip.category}</span>
                      </>
                    )}
                    <span>-</span>
                    <span>{clip.viewCount.toLocaleString()} views</span>
                    <span>-</span>
                    <span>
                      {new Date(clip.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>
                {clip.isFeatured && (
                  <div className="flex items-center gap-1 px-2 py-1 rounded-full bg-yellow-500/10 text-yellow-500 text-xs font-medium">
                    <Icons.Star className="h-3 w-3" />
                    Featured
                  </div>
                )}
              </div>

              {clip.description && (
                <p className="mt-4 text-foreground whitespace-pre-wrap">
                  {clip.description}
                </p>
              )}

              {/* Creator Info */}
              <div className="mt-6 pt-4 border-t border-border">
                <div className="flex items-center gap-3">
                  {clip.userDiscordAvatar ? (
                    <img
                      src={clip.userDiscordAvatar}
                      alt={clip.userName || "User"}
                      className="h-10 w-10 rounded-full"
                    />
                  ) : (
                    <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                      <Icons.User className="h-5 w-5 text-primary" />
                    </div>
                  )}
                  <div>
                    <p className="font-medium text-foreground">
                      {clip.userName || "Anonymous"}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Uploaded on {new Date(clip.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </FadeIn>
        </div>

        {/* Comments Sidebar */}
        <div>
          <FadeIn delay={0.2}>
            <ClipComments
              clipId={clip.id}
              initialComments={clip.comments}
              commentCount={clip.commentCount}
              currentUserId={session.user.id}
            />
          </FadeIn>
        </div>
      </div>
    </div>
  );
}

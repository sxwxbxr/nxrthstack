import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getFriends, getPendingRequests, getSentRequests } from "@/lib/gamehub/friends";
import { FadeIn } from "@/components/ui/fade-in";
import { GradientText } from "@/components/ui/gradient-text";
import { FriendList } from "@/components/gamehub/friend-list";
import { AddFriendButton } from "@/components/gamehub/add-friend-button";
import { Icons } from "@/components/icons";
import Link from "next/link";

export const metadata = {
  title: "Friends | GameHub - NxrthStack",
};

export default async function FriendsPage() {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/login");
  }

  const [friends, pending, sent] = await Promise.all([
    getFriends(session.user.id),
    getPendingRequests(session.user.id),
    getSentRequests(session.user.id),
  ]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <FadeIn>
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
              <Link
                href="/dashboard/gamehub"
                className="hover:text-foreground transition-colors"
              >
                GameHub
              </Link>
              <Icons.ChevronRight className="h-4 w-4" />
              <span className="text-foreground">Friends</span>
            </div>
            <h1 className="text-3xl font-bold">
              <GradientText>Friends</GradientText>
            </h1>
            <p className="text-muted-foreground mt-1">
              Connect with other GameHub users
            </p>
          </div>
          <AddFriendButton />
        </div>
      </FadeIn>

      {/* Pending Requests Alert */}
      {pending.length > 0 && (
        <FadeIn delay={0.1}>
          <div className="flex items-center gap-3 p-4 rounded-xl border border-primary/30 bg-primary/5">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/20">
              <Icons.Bell className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="font-medium text-foreground">
                You have {pending.length} pending friend request
                {pending.length !== 1 ? "s" : ""}
              </p>
              <p className="text-sm text-muted-foreground">
                Check the Requests tab to respond
              </p>
            </div>
          </div>
        </FadeIn>
      )}

      {/* Friends List */}
      <FadeIn delay={0.2}>
        <div className="rounded-xl border border-border bg-card p-6">
          <FriendList
            initialFriends={friends}
            initialPending={pending}
            initialSent={sent}
          />
        </div>
      </FadeIn>
    </div>
  );
}

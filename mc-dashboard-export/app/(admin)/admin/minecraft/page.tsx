import { FadeIn } from "@/components/ui/fade-in";
import { db } from "@/lib/db";
import { mcServers } from "@/lib/db/schema";
import { McAdminClient } from "@/components/admin/mc-admin-client";

export const metadata = {
  title: "Minecraft Admin | NxrthStack",
};

export const dynamic = "force-dynamic";

export default async function AdminMinecraftPage() {
  const servers = await db
    .select({ id: mcServers.id, name: mcServers.name })
    .from(mcServers);

  return (
    <div>
      <FadeIn>
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground">
            Minecraft Admin
          </h1>
          <p className="mt-1 text-muted-foreground">
            Manage access codes, user permissions, and servers.
          </p>
        </div>
      </FadeIn>

      <McAdminClient servers={servers} />
    </div>
  );
}

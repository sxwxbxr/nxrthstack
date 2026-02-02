import { Events, ActivityType } from "discord.js";
import type { ExtendedClient } from "../client.js";

export const name = Events.ClientReady;
export const once = true;

export async function execute(client: ExtendedClient) {
  console.log(`[Bot] Logged in as ${client.user?.tag}`);
  console.log(`[Bot] Serving ${client.guilds.cache.size} guild(s)`);

  // Set bot activity status
  client.user?.setActivity({
    name: "gaming sessions",
    type: ActivityType.Watching,
  });
}

import { Events, type Interaction } from "discord.js";
import type { ExtendedClient } from "../client.js";

export const name = Events.InteractionCreate;

export async function execute(interaction: Interaction) {
  // Handle slash commands
  if (interaction.isChatInputCommand()) {
    const client = interaction.client as ExtendedClient;
    const command = client.commands.get(interaction.commandName);

    if (!command) {
      console.error(`[Commands] No command matching ${interaction.commandName} was found.`);
      return;
    }

    try {
      await command.execute(interaction);
    } catch (error) {
      console.error(`[Commands] Error executing ${interaction.commandName}:`, error);

      const errorMessage = {
        content: "There was an error executing this command.",
        ephemeral: true,
      };

      if (interaction.replied || interaction.deferred) {
        await interaction.followUp(errorMessage);
      } else {
        await interaction.reply(errorMessage);
      }
    }
  }

  // Handle button interactions
  if (interaction.isButton()) {
    const [action, ...args] = interaction.customId.split(":");

    try {
      switch (action) {
        case "session_join":
          // Handle session join button
          await interaction.reply({
            content: "Use `/session join` with the session ID to RSVP.",
            ephemeral: true,
          });
          break;

        case "rivalry_accept":
          // Handle rivalry accept button
          await interaction.reply({
            content: "Use `/rivalry accept` to accept this challenge.",
            ephemeral: true,
          });
          break;

        default:
          await interaction.reply({
            content: "Unknown action.",
            ephemeral: true,
          });
      }
    } catch (error) {
      console.error(`[Buttons] Error handling button ${action}:`, error);
    }
  }
}

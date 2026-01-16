import { Interaction } from "discord.js"; 
import * as helpCommand from "../commands/help";
import * as pingCommand from "../commands/ping";

export default async (interaction: Interaction) => {
  if (!interaction.isChatInputCommand()) return;
  try {
    if (interaction.commandName === "help") {
      await helpCommand.execute(interaction);
    } else if (interaction.commandName === "ping") {
      await pingCommand.execute(interaction);
    }
  } catch (error) {
    console.error(error);
    if (interaction.replied || interaction.deferred) {
        await interaction.followUp({ content: 'An unexpected error occurred!', ephemeral: true });
    } else {
        await interaction.reply({ content: 'An unexpected error occurred!', ephemeral: true });
    }
  }
};
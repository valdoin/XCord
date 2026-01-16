import { EmbedBuilder, ChatInputCommandInteraction } from 'discord.js';

export const execute = async (interaction: ChatInputCommandInteraction) => {
  const pingEmbed = new EmbedBuilder()
    .setColor('#000000')
    .setTitle('XCord')
    .setDescription(`**Latency:** ${Date.now() - interaction.createdTimestamp}ms`);
  interaction.reply({ embeds: [pingEmbed] });
};
import { EmbedBuilder, ChatInputCommandInteraction } from 'discord.js';

export const execute = async (interaction: ChatInputCommandInteraction) => {
  const helpEmbed = new EmbedBuilder()
    .setColor('#000000')
    .setTitle('How to Use')
    .setDescription('Simply send a Twitter URL in any channel, and it will fetch and display the tweet information and media.')
    .addFields(
      { name: 'Note', value: 'If the bot seems to ignore your messages, it might not have sufficient permissions in the channel. The bot needs **READ MESSAGE HISTORY**, **SEND MESSAGES**, **ATTACH FILES** AND **EMBED LINKS** permissions to function correctly.' },
      { name: 'Support', value: 'If you believe the bot should be working but isn\'t, head to the [support server](https://discord.gg/5YGJvZ2fh3).' }
    );
    
  await interaction.reply({ embeds: [helpEmbed] });
};
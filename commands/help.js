const { EmbedBuilder } = require('discord.js');

module.exports = {
  execute(interaction) {
    const botName = interaction.client.user.username;
    const botAvatar = interaction.client.user.displayAvatarURL();

    const helpEmbed = new EmbedBuilder()
      .setColor('Blue')
      .setDescription('**How do I fetch images from a Twitter/X link?**\n> Simply paste a Twitter/X URL in any channel, and it will fetch and display the posts information and media.\n\n**Why is XCord not fetching media?**\n> This will happen if XCord does not have sufficient permissions in the channel. The bot requires both `ReadMessageHistory` and `SendMessages` permissions to function correctly.') 
      .setAuthor({ name: `${botName} Help`, iconURL: botAvatar })
      .addFields(
        { 
          name: 'Important links', 
          value: '[Support](https://discord.gg/5YGJvZ2fh3)\n[Invite](https://discord.com/oauth2/authorize?client_id=1257966131101302854)\n[Website](https://x.com/)' 
        }
      );
    
    interaction.reply({ embeds: [helpEmbed] });
  }
};

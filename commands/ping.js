const { EmbedBuilder } = require('discord.js');

module.exports = {
  execute(interaction) {
    const pingEmbed = new EmbedBuilder()
      .setColor('#000000')
      .setTitle('XCord')
      .setDescription(`**Latency:** ${Date.now() - interaction.createdTimestamp}ms`)
    interaction.reply({ embeds: [pingEmbed] });
  }
};
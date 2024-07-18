const { EmbedBuilder } = require('discord.js');

module.exports = {
  execute(interaction) {
    const reportedUser = interaction.options.getUser('user');
    const issueDescription = interaction.options.getString('issue');

    const reportEmbed = new EmbedBuilder()
      .setColor('#FF0000')
      .setTitle('New Report')
      .setDescription('A new issue has been reported.')
      .addFields(
        { name: 'Reported User', value: reportedUser ? reportedUser.tag : 'N/A', inline: true },
        { name: 'Issue Description', value: issueDescription, inline: false },
        { name: 'Reported By', value: interaction.user.tag, inline: true },
      )
      .setTimestamp();

    const reportChannelId = '1262469793152241684'; 
    const reportChannel = interaction.client.channels.cache.get(reportChannelId);

    if (reportChannel) {
      reportChannel.send({ embeds: [reportEmbed] });
      interaction.reply({ content: 'Thank you for your report. Our team will review it shortly.', ephemeral: true });
    } else {
      interaction.reply({ content: 'Error: Report channel not found.', ephemeral: true });
    }
  }
};

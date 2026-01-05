const { Events, EmbedBuilder, PermissionsBitField } = require('discord.js');
const helpCommand = require('../commands/help');

async function handleOnJoin(guild) {
  const channel = guild.systemChannel || 
    guild.channels.cache.find((channel) => channel.type === "GUILD_TEXT");

  if (channel) {
    const botMember = guild.members.me || guild.members.cache.get(guild.client.user.id);
    const requiredPermissions = [
      PermissionsBitField.Flags.SendMessages,
      PermissionsBitField.Flags.ReadMessageHistory,
      PermissionsBitField.Flags.EmbedLinks,
      PermissionsBitField.Flags.ViewChannel
    ];

    if (botMember && channel.permissionsFor(botMember).has(requiredPermissions)) {
      const fakeInteraction = {
        commandName: "help",
        reply: async (message) => {
          try {
            await channel.send(message);
          } catch (error) {
            if (error.code === 50001) {
              console.error('Missing Access: Cannot send message to the channel due to lack of permissions.');
            } else {
              console.error('Failed to send message:', error);
            }
          }
        },
      };
      try {
        await helpCommand.execute(fakeInteraction);
      } catch (error) {
        console.error('Error executing help command:', error);
      }
    } else {
      console.error('Missing SEND_MESSAGES, READ_MESSAGE_HISTORY or EMBED_LINKS permission in the system channel.');
    }
  } else {
    console.error('No suitable channel found to send the welcome message.');
  }

  try {
    const owner = await guild.fetchOwner();
    const embed = new EmbedBuilder()
      .setTitle(`Hello ${owner.user.username}!`)
      .setDescription(`Thanks for inviting me to your server **${guild.name}**!`)
      .addFields({ name: 'Note', value: "Consider using **/help** if I don't react to your messages." })
      .setColor("#000000")
      .setTimestamp();

    try {
      await owner.send({ embeds: [embed] });
      console.log(`Message sent to owner ${owner.user.tag} of server ${guild.name}`);
    } catch (error) {
      if (error.code === 50007) {
        console.log(`Cannot send message to user ${owner.user.tag}. They might have DMs disabled.`);
      } else if (error.code === 50001) {
        console.error('Missing Access: Cannot send DM to the owner due to lack of permissions.');
      } else {
        console.error(`Failed to send message to owner ${owner.user.tag}:`, error);
      }
    }
  } catch (error) {
    console.error('Failed to fetch the guild owner:', error);
  }
}

module.exports = handleOnJoin;
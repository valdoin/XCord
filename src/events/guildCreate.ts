import { Guild, EmbedBuilder, PermissionsBitField, ChannelType, TextChannel, ChatInputCommandInteraction } from 'discord.js';
import * as helpCommand from '../commands/help';

export default async function handleOnJoin(guild: Guild) {
  const channel = (guild.systemChannel || 
    guild.channels.cache.find((channel) => channel.type === ChannelType.GuildText)) as TextChannel;

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
        reply: async (payload: any) => {
          try {
            await channel.send(payload);
          } catch (error: any) {
            if (error.code === 50001) {
              console.error('Missing Access: Cannot send message to the channel.');
            } else {
              console.error('Failed to send message:', error);
            }
          }
        },
      } as unknown as ChatInputCommandInteraction;

      try {
        await helpCommand.execute(fakeInteraction);
      } catch (error) {
        console.error('Error executing help command:', error);
      }
    } else {
      console.error('Missing permissions in the system channel.');
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
      console.log(`Message sent to owner ${owner.user.tag}`);
    } catch (error: any) {
      if (error.code === 50007) {
        console.log(`Cannot send message to owner (DMs disabled).`);
      } else {
        console.error(`Failed to send message to owner:`, error);
      }
    }
  } catch (error) {
    console.error('Failed to fetch the guild owner:', error);
  }
}
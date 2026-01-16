import { Client, ActivityType } from "discord.js";

export default async (client: Client) => {
  console.log(`Logged in as ${client.user?.tag}`);
  // refresh presence
  const updatePresence = () => {
    client.user?.setPresence({
      activities: [
        {
          name: `${client.guilds.cache.size} servers • /help`,
          type: ActivityType.Watching,
        },
      ],
    });
  };

  updatePresence();
  setInterval(updatePresence, 60000);

  // register slash commands
  if (client.application) {
    await client.application.commands.create({
      name: "help",
      description: '❓| Useful info & links',
    });

    await client.application.commands.create({
      name: "ping",
      description: '🏓| Check the bot\'s status',
    });
  }
};
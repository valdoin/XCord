const {
  Client,
  GatewayIntentBits,
  ActivityType,
  Events
} = require("discord.js");
const express = require("express");
require("dotenv").config();
const tweetRoute = require("./router.js");
const handleMessage = require("./events/messageEvent");
const handleOnJoin = require("./events/onJoinEvent");
const helpCommand = require("./commands/help");
const pingCommand = require("./commands/ping");
const reportCommand = require("./commands/report");

// Discord bot intents
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.DirectMessages,
  ],
});

const app = express();
const port = 3000;

app.use("/", tweetRoute);

app.listen(port, () => {
  console.log(`Listening on port ${port}`);
});

// on ready + setting up the available commands
client.once("clientReady", async () => {
  console.log(`Logged in as ${client.user.tag}`);
  client.user.setPresence({
    activities: [
      {
        name: `${client.guilds.cache.size} servers`,
        type: ActivityType.Watching,
      },
    ],
  });
  
  await client.application.commands.create({
    name: "help",
    description: '❓| Useful info & links',
  });

  await client.application.commands.create({
    name: "ping",
    description: '🏓| Check the bot\'s status',
  });
});

// when joining a new discord
client.on(Events.GuildCreate, handleOnJoin);

// refresh activity status
setInterval(() => {
  client.user.setPresence({
    activities: [
      {
        name: `${client.guilds.cache.size} servers • /help`,
        type: ActivityType.Watching,
      },
    ],
  });
}, 60000);

// react to /help and /ping commands
client.on("interactionCreate", async (interaction) => {
  if (!interaction.isCommand()) return;

  if (interaction.commandName === "help") {
    helpCommand.execute(interaction);
  } else if (interaction.commandName === "ping") {
    pingCommand.execute(interaction);
  }
});

// react to twitter urls
client.on("messageCreate", handleMessage);

client.login(process.env.DISCORD_TOKEN);

import "dotenv/config";
import { Client, GatewayIntentBits, Events } from "discord.js";
import * as server from "./server";
import handleMessage from "./events/messageCreate";
import handleOnJoin from "./events/guildCreate";
import handleInteraction from "./events/interactionCreate"; 
import handleReady from "./events/ready"; 

server.start();

// discord bot intents
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.DirectMessages,
  ],
});

// on ready
client.once(Events.ClientReady, handleReady);

// when joining a new server
client.on(Events.GuildCreate, handleOnJoin);

// setting up slash commands
client.on(Events.InteractionCreate, handleInteraction);

// react to twitter urls
client.on(Events.MessageCreate, handleMessage);

client.login(process.env.DISCORD_TOKEN);
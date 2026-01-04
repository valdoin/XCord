[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](./LICENSE)

# XCord

XCord is a Discord bot that interacts with Twitter posts without using its official API which is crap and overpriced.

## Features

- Downloads and shares medias from a given Twitter URL (photos, videos, GIFs) in the Discord channel.
- Automatically handles quoted tweets and shares their medias as well.

## Prerequisites

If you want to install it for personnal use (fork the project then ask for a pull request if you want to expand some features), ensure you have met the following requirements:

- Node.js installed on your computer.
- A Discord bot token. You can get one by creating a bot on the [Discord Developer Portal](https://discord.com/developers/applications).

## Installation and usage

1. Clone the repository : 
    
    	git clone https://github.com/valdoin/XCord
    	cd xcord

2. Install the dependencies : 
    	
        npm install

3. Create a .env file in the root directory which contains your Discord bot token :

        DISCORD_TOKEN=[your_discord_token]

4. Start the express server :

        node index.js

5. Invite the bot to your Discord server then send a Twitter URL in any channel and it will fetch and display the tweet medias.

## Legal Information
 
[LICENSE](./LICENSE)  
[TERMS OF SERVICE](./TOS.md)  
[PRIVACY POLICY](./PRIVACY%20POLICY.md)

Hosted on [Hetzner](https://www.hetzner.com/). 
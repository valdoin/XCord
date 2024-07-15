const { downloadMedia } = require("../utils/downloadMediaUtil.js");
const { convertMp4ToGif } = require("../utils/convertMp4ToGifUtil.js");
const { PermissionsBitField } = require('discord.js');

const MAX_BITRATE = 2176000;  // bits per second
const COOLDOWN_DURATION = 5000;  // 5 seconds cooldown per user
const lastMessageTimestamps = new Map();

async function handleMessage(message) {
  if (message.author.bot) return;

  // check bot permissions
  if (!message.channel.permissionsFor(message.client.user).has([PermissionsBitField.Flags.SendMessages, PermissionsBitField.Flags.ReadMessageHistory, PermissionsBitField.Flags.AttachFiles,])) {
    console.error('Missing SEND_MESSAGES, READ_MESSAGE_HISTORY OR ATTACH_FILES permission in this channel.');
    return;
  }

  if (message.content.includes("x.com") || message.content.includes("twitter.com")) {
    console.log("A link has been sent!");

    // clean up the cooldown map
    const now = Date.now();
    for (const [key, timestamp] of lastMessageTimestamps.entries()) {
      if (now - timestamp > COOLDOWN_DURATION) {
        lastMessageTimestamps.delete(key);
      }
    }

    // check for cooldown
    const lastTimestamp = lastMessageTimestamps.get(message.author.id);
    if (lastTimestamp && now - lastTimestamp < COOLDOWN_DURATION) {
      const remainingTime = ((COOLDOWN_DURATION - (now - lastTimestamp)) / 1000).toFixed(1);
      console.log("User on cooldown. Message ignored.")
      await message.channel.send(`<@${message.author.id}> You are on cooldown (${remainingTime} seconds remaining). Please wait before sending another link if you want the bot to be working.`);
      return;
    }

    // set the cooldown timestamp
    lastMessageTimestamps.set(message.author.id, now);
   	
    // indicate that the bot is processing the request
    message.channel.sendTyping();
      
    const tweetURL = message.content.split(' ').find(url => (url.includes('x.com') && url.includes('/status/')) || (url.includes('twitter.com') && url.includes('/status/')));
    if (!tweetURL) {
      console.log("No tweet found for this link.");
      return;
    }

    console.log(`Tweet URL: ${tweetURL}`);

    const tweetID = tweetURL.split('/').pop().split('?')[0];
    try {
      const response = await fetch(`http://localhost:3000/${tweetID}`);
      const tweetData = await response.json();
      const mediaUrls = [];
      const gifUrls = [];
      const mediaEntities = tweetData.data.tweetResult.result.legacy.extended_entities?.media || [];

      for (const media of mediaEntities) {
        if (media.type === "photo") {
          mediaUrls.push(media.media_url_https);
        } else if (media.type === "video" || media.type === "animated_gif") {
          const variants = media.video_info.variants;
          const suitableVariants = variants.filter(variant => variant.bitrate <= MAX_BITRATE);
          if (suitableVariants.length > 0) {
            const highestBitrateVariant = suitableVariants.reduce((prev, current) => {
              return prev.bitrate > current.bitrate ? prev : current;
            });
            const mediaUrl = highestBitrateVariant.url;
            if (media.type === "animated_gif") {
              gifUrls.push(mediaUrl);  
            } else if (mediaUrl.endsWith(".mp4")) {
              mediaUrls.push(mediaUrl);
            } else {
              mediaUrls.push(mediaUrl.slice(0, -7));  
            }
          } else {
            console.log("No suitable video variant found within the bitrate limit.");
          }
        }
      }

      const quotedStatus = tweetData.data.tweetResult.result.quoted_status_result;
      if (quotedStatus) {
        const quotedTweetText = quotedStatus.result.legacy.full_text;
        if (quotedTweetText) {
          const textWithoutLink = quotedTweetText.split("http")[0].trim();
          await message.channel.send("**Quoted tweet text:** " + '"' + textWithoutLink + '"');
        }
        const quotedMediaEntities = quotedStatus.result.legacy.extended_entities?.media || [];
        for (const media of quotedMediaEntities) {
          if (media.type === "photo") {
            mediaUrls.push(media.media_url_https);
          } else if (media.type === "video" || media.type === "animated_gif") {
            const variants = media.video_info.variants;
            const suitableVariants = variants.filter(variant => variant.bitrate <= MAX_BITRATE);
            if (suitableVariants.length > 0) {
              const highestBitrateVariant = suitableVariants.reduce((prev, current) => {
                return prev.bitrate > current.bitrate ? prev : current;
              });
              const mediaUrl = highestBitrateVariant.url;
              if (media.type === "animated_gif") {
                gifUrls.push(mediaUrl);  
              } else if (mediaUrl.endsWith(".mp4")) {
                mediaUrls.push(mediaUrl);
              } else {
                mediaUrls.push(mediaUrl.slice(0, -7));  
              }
            } else {
              console.log("No suitable quoted video variant found within the bitrate limit.");
            }
          }
        }
      }

      const allUploadFiles = [];

      if (mediaUrls.length > 0) {
        const uploadFiles = await downloadMedia(mediaUrls);
        if (uploadFiles.length > 0) {
          allUploadFiles.push(...uploadFiles);
        }
      }

      if (gifUrls.length > 0) {
        const gifFiles = await convertMp4ToGif(gifUrls);
        if (gifFiles.length > 0) {
          allUploadFiles.push(...gifFiles);
        }
      }

      if (allUploadFiles.length > 0) {
        await message.channel.send({ content: "**Tweet media(s):**", files: allUploadFiles });
      }

    } catch (error) {
      console.error(error);
      await message.channel.send(`Error extracting media. This might happen if Discord can't preview your tweet or if the file is too large to upload.`);
    }
  }
}

module.exports = handleMessage;
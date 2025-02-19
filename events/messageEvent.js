const { downloadMedia } = require("../utils/downloadMediaUtil.js");
const { convertMp4ToGif } = require("../utils/convertMp4ToGifUtil.js");
const { PermissionsBitField } = require('discord.js');
const fs = require('fs');

const MAX_BITRATE = 2176000;  // bits per second
const COOLDOWN_DURATION = 5000;  // 5 seconds cooldown per user
const lastMessageTimestamps = new Map();

async function handleMessage(message) {
  if (message.author.bot) return;

  // Check bot permissions
  const botPermissions = message.channel.permissionsFor(message.guild?.members.me);
  if (!botPermissions.has([PermissionsBitField.Flags.SendMessages, PermissionsBitField.Flags.ReadMessageHistory, PermissionsBitField.Flags.AttachFiles, PermissionsBitField.Flags.EmbedLinks])) {
    console.error('Missing SEND_MESSAGES, READ_MESSAGE_HISTORY, ATTACH_FILES OR EMBED_LINKS permission in this channel.');
    return;
  }

  if (message.content.includes("x.com") || message.content.includes("twitter.com")) {
    console.log("A link has been sent!");

    // Clean up the cooldown map
    const now = Date.now();
    for (const [key, timestamp] of lastMessageTimestamps.entries()) {
      if (now - timestamp > COOLDOWN_DURATION) {
        lastMessageTimestamps.delete(key);
      }
    }

    // Check for cooldown
    const lastTimestamp = lastMessageTimestamps.get(message.author.id);
    if (lastTimestamp && now - lastTimestamp < COOLDOWN_DURATION) {
      const remainingTime = ((COOLDOWN_DURATION - (now - lastTimestamp)) / 1000).toFixed(1);
      console.log("User on cooldown. Message ignored.");
      await message.reply(`You are on cooldown (${remainingTime} seconds remaining). Please wait before sending another link if you want the bot to be working.`);
      return;
    }

    // Set the cooldown timestamp
    lastMessageTimestamps.set(message.author.id, now);

    const normalizedContent = message.content.replace(/\s+/g, ' ');
    const tweetURL = normalizedContent.split(' ').find(url => (url.includes('x.com') && url.includes('/status/')) || (url.includes('twitter.com') && url.includes('/status/')));
    if (!tweetURL) {
      console.log("No tweet found for this link.");
      return;
    }

    console.log(`Tweet URL: ${tweetURL}`);

    const tweetID = tweetURL.split('/').pop().split('?')[0];
    try {
      const response = await fetch(`http://localhost:3000/${tweetID}`);
      const tweetData = await response.json();

      // Safely accessing extended_entities
      const mediaEntities = tweetData.data?.tweetResult?.result?.legacy?.extended_entities?.media || [];
      const quotedStatus = tweetData.data?.tweetResult?.result?.quoted_status_result;

      if (mediaEntities.length > 0 || quotedStatus) {
        message.channel.sendTyping();
      }

      const mediaUrls = [];
      const gifUrls = [];

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

      let quotedTweetText;
      let textWithoutLink;
      if (quotedStatus) {
        quotedTweetText = quotedStatus.result.legacy.full_text;
        if (quotedTweetText) {
          textWithoutLink = quotedTweetText.split("http")[0].trim();
        }
        const quotedMediaEntities = quotedStatus.result.legacy?.extended_entities?.media || [];
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
      const oversizedMediaUrls = [];

      if (mediaUrls.length > 0) {
        const { uploadFiles, oversizedMediaUrls: oversized } = await downloadMedia(mediaUrls);
        if (uploadFiles.length > 0) {
          allUploadFiles.push(...uploadFiles);
        }
        if (oversized.length > 0) {
          oversizedMediaUrls.push(...oversized);
        }
      }

      if (gifUrls.length > 0) {
        const gifFiles = await convertMp4ToGif(gifUrls);
        if (gifFiles.length > 0) {
          allUploadFiles.push(...gifFiles);
        }
      }

      if (allUploadFiles.length === 0 && oversizedMediaUrls.length === 0) {
        if (textWithoutLink) {
          await message.reply({ content: `**• Quoted tweet text:** "${textWithoutLink}"` });
        }
      }

      if (allUploadFiles.length > 0 || oversizedMediaUrls.length > 0) {
        let content = "";

        if (textWithoutLink) {
          content += `**• Quoted tweet text:** "${textWithoutLink}"\n`;
        }

        if (allUploadFiles.length > 0 && oversizedMediaUrls.length > 0) {
          content += `• **Tweet media(s):**\n${oversizedMediaUrls.join('\n')}`;
          await message.reply({ content, files: allUploadFiles });
          return;
        }

        if (allUploadFiles.length > 0) {
          content += "• **Tweet media(s):**";
          await message.reply({ content, files: allUploadFiles });
          return;
        }

        if (oversizedMediaUrls.length > 0) {
          content += `• **Tweet media(s):**\n${oversizedMediaUrls.join('\n')}`;
          await message.reply({ content });
        }
      }

    } catch (error) {
      console.error(error);
      await message.reply(`Error extracting media. This might happen for NSFW tweets.`);
    }
  }
}

module.exports = handleMessage;
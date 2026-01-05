const { downloadMedia } = require("../utils/downloadMediaUtil.js");
const { convertMp4ToGif } = require("../utils/convertMp4ToGifUtil.js");
const { PermissionsBitField } = require('discord.js');

const MAX_BITRATE = 2176000;
const COOLDOWN_DURATION = 5000;
const lastMessageTimestamps = new Map();

function extractMediaFromData(legacyData, mediaUrls, gifUrls) {
    if (!legacyData) return;
    
    const mediaEntities = legacyData.extended_entities?.media || [];
    
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
            }
        }
    }
}

async function handleMessage(message) {
    if (message.author.bot) return;

    const botPermissions = message.channel.permissionsFor(message.guild?.members.me);
    if (!botPermissions.has([PermissionsBitField.Flags.SendMessages, PermissionsBitField.Flags.ReadMessageHistory, PermissionsBitField.Flags.AttachFiles, PermissionsBitField.Flags.EmbedLinks])) {
        return;
    }

    if (message.content.includes("x.com") || message.content.includes("twitter.com")) {
        const now = Date.now();
        for (const [key, timestamp] of lastMessageTimestamps.entries()) {
            if (now - timestamp > COOLDOWN_DURATION) {
                lastMessageTimestamps.delete(key);
            }
        }

        const lastTimestamp = lastMessageTimestamps.get(message.author.id);
        if (lastTimestamp && now - lastTimestamp < COOLDOWN_DURATION) {
            const remainingTime = ((COOLDOWN_DURATION - (now - lastTimestamp)) / 1000).toFixed(1);
            await message.reply(`You are on cooldown (${remainingTime}s).`);
            return;
        }

        lastMessageTimestamps.set(message.author.id, now);
        const normalizedContent = message.content.replace(/\s+/g, ' ');
        const tweetURL = normalizedContent.split(' ').find(url => (url.includes('x.com') && url.includes('/status/')) || (url.includes('twitter.com') && url.includes('/status/')));
        
        if (!tweetURL) return;

        const tweetID = tweetURL.split('/').pop().split('?')[0];
        
        try {
            const response = await fetch(`http://localhost:3000/${tweetID}`);
            const tweetData = await response.json();

            const result = tweetData.data?.tweetResult?.result;
            if (!result) return;

            message.channel.sendTyping();

            const mediaUrls = [];
            const gifUrls = [];

            extractMediaFromData(result.legacy, mediaUrls, gifUrls);

            let textWithoutLink;
            const quotedStatus = result.quoted_status_result;
            
            if (quotedStatus) {
                extractMediaFromData(quotedStatus.result.legacy, mediaUrls, gifUrls);
                
                const quotedText = quotedStatus.result.legacy.full_text;
                if (quotedText) {
                    textWithoutLink = quotedText.split("http")[0].trim();
                }
            }

            const allUploadFiles = [];
            const oversizedMediaUrls = [];

            if (mediaUrls.length > 0) {
                const { uploadFiles, oversizedMediaUrls: oversized } = await downloadMedia(mediaUrls);
                if (uploadFiles.length > 0) allUploadFiles.push(...uploadFiles);
                if (oversized.length > 0) oversizedMediaUrls.push(...oversized);
            }

            if (gifUrls.length > 0) {
                const gifFiles = await convertMp4ToGif(gifUrls);
                if (gifFiles.length > 0) allUploadFiles.push(...gifFiles);
            }

            const messagePayload = {
                content: "",
                files: allUploadFiles,
                allowedMentions: { repliedUser: false },
                failIfNotExists: false 
            };

            if (textWithoutLink) {
                messagePayload.content += `**• Quoted:** "${textWithoutLink}"\n`;
            }

            if (oversizedMediaUrls.length > 0) {
                messagePayload.content += `\n**• Oversized / Links:**\n${oversizedMediaUrls.join('\n')}`;
            }

            if (messagePayload.content === "" && allUploadFiles.length === 0) {
                return;
            }

            try {
                await message.reply(messagePayload);
            } catch (err) {
                if (messagePayload.content) {
                    messagePayload.content = `<@${message.author.id}> ` + messagePayload.content;
                } else {
                    messagePayload.content = `<@${message.author.id}>`;
                }
                await message.channel.send(messagePayload);
            }

        } catch (error) {
            console.error("Handler error:", error.message);
        }
    }
}

module.exports = handleMessage;
const { downloadMedia } = require("../utils/downloadMediaUtil.js");
const { convertMp4ToGif } = require("../utils/convertMp4ToGifUtil.js");
const { PermissionsBitField } = require("discord.js");

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
            const suitableVariants = variants.filter(
                (variant) => variant.bitrate <= MAX_BITRATE
            );

            if (suitableVariants.length > 0) {
                const highestBitrateVariant = suitableVariants.reduce(
                    (prev, current) => {
                        return prev.bitrate > current.bitrate ? prev : current;
                    }
                );

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

async function processMediaList(mediaUrls, gifUrls) {
    const uploadFiles = [];
    const oversizedMediaUrls = [];

    if (mediaUrls.length > 0) {
        const { uploadFiles: dlFiles, oversizedMediaUrls: dlOversized } =
            await downloadMedia(mediaUrls);
        if (dlFiles.length > 0) uploadFiles.push(...dlFiles);
        if (dlOversized.length > 0) oversizedMediaUrls.push(...dlOversized);
    }

    if (gifUrls.length > 0) {
        const gifFiles = await convertMp4ToGif(gifUrls);
        if (gifFiles.length > 0) uploadFiles.push(...gifFiles);
    }

    return { uploadFiles, oversizedMediaUrls };
}

async function handleMessage(message) {
    if (message.author.bot) return;

    const botPermissions = message.channel.permissionsFor(
        message.guild?.members.me
    );
    if (
        !botPermissions.has([
            PermissionsBitField.Flags.SendMessages,
            PermissionsBitField.Flags.ReadMessageHistory,
            PermissionsBitField.Flags.AttachFiles,
            PermissionsBitField.Flags.EmbedLinks,
        ])
    ) {
        return;
    }

    if (
        message.content.includes("x.com") ||
        message.content.includes("twitter.com")
    ) {
        console.log(`[Link Detected] from ${message.author.tag}`);

        const now = Date.now();
        for (const [key, timestamp] of lastMessageTimestamps.entries()) {
            if (now - timestamp > COOLDOWN_DURATION) {
                lastMessageTimestamps.delete(key);
            }
        }

        const lastTimestamp = lastMessageTimestamps.get(message.author.id);
        if (lastTimestamp && now - lastTimestamp < COOLDOWN_DURATION) {
            console.log(`[Cooldown] User ${message.author.tag} ignored`);
            return;
        }

        lastMessageTimestamps.set(message.author.id, now);
        const normalizedContent = message.content.replace(/\s+/g, " ");
        const tweetURL = normalizedContent
            .split(" ")
            .find(
                (url) =>
                    (url.includes("x.com") && url.includes("/status/")) ||
                    (url.includes("twitter.com") && url.includes("/status/"))
            );

        if (!tweetURL) return;

        console.log(`[Processing] ${tweetURL}`);
        const tweetID = tweetURL.split("/").pop().split("?")[0];

        try {
            const response = await fetch(`http://localhost:3000/${tweetID}`);
            const tweetData = await response.json();

            const result = tweetData.data?.tweetResult?.result;
            if (!result) {
                console.log("[Error] Tweet result not found in JSON");
                return;
            }

            message.channel.sendTyping();

            const mainMediaUrls = [];
            const mainGifUrls = [];
            extractMediaFromData(result.legacy, mainMediaUrls, mainGifUrls);

            const quotedMediaUrls = [];
            const quotedGifUrls = [];
            let textWithoutLink;
            const quotedStatus = result.quoted_status_result;

            if (quotedStatus) {
                extractMediaFromData(
                    quotedStatus.result.legacy,
                    quotedMediaUrls,
                    quotedGifUrls
                );

                const quotedText = quotedStatus.result.legacy.full_text;
                if (quotedText) {
                    textWithoutLink = quotedText.split("http")[0].trim();
                }
            }

            console.log(
                `[Media Found] Main: ${mainMediaUrls.length + mainGifUrls.length
                } | Quoted: ${quotedMediaUrls.length + quotedGifUrls.length}`
            );

            const mainResult = await processMediaList(mainMediaUrls, mainGifUrls);
            const quotedResult = await processMediaList(
                quotedMediaUrls,
                quotedGifUrls
            );

            const allUploadFiles = [
                ...mainResult.uploadFiles,
                ...quotedResult.uploadFiles,
            ];

            const messagePayload = {
                content: "",
                files: allUploadFiles,
                allowedMentions: { repliedUser: false },
                failIfNotExists: false,
            };

            if (textWithoutLink) {
                messagePayload.content += `**• Quoted:** "${textWithoutLink}"\n`;
            }

            const hasMainMedia =
                mainResult.uploadFiles.length > 0 ||
                mainResult.oversizedMediaUrls.length > 0;
            const hasQuotedMedia =
                quotedResult.uploadFiles.length > 0 ||
                quotedResult.oversizedMediaUrls.length > 0;

            if (hasMainMedia && hasQuotedMedia) {
                if (messagePayload.content !== "") messagePayload.content += `\n`;
                messagePayload.content += `**• Tweet media(s):**\n`;

                if (mainResult.oversizedMediaUrls.length > 0) {
                    messagePayload.content += `${mainResult.oversizedMediaUrls.join(
                        "\n"
                    )}\n`;
                }
                if (quotedResult.oversizedMediaUrls.length > 0) {
                    messagePayload.content += `${quotedResult.oversizedMediaUrls.join(
                        "\n"
                    )}\n`;
                }
            } else {
                if (hasQuotedMedia) {
                    if (messagePayload.content !== "")
                        messagePayload.content += `\n`;
                    messagePayload.content += `**• Quoted media(s):**\n`;
                    if (quotedResult.oversizedMediaUrls.length > 0) {
                        messagePayload.content += `${quotedResult.oversizedMediaUrls.join(
                            "\n"
                        )}\n`;
                    }
                }

                if (hasMainMedia) {
                    if (messagePayload.content !== "")
                        messagePayload.content += `\n`;
                    messagePayload.content += `**• Tweet media(s):**\n`;
                    if (mainResult.oversizedMediaUrls.length > 0) {
                        messagePayload.content += `${mainResult.oversizedMediaUrls.join(
                            "\n"
                        )}\n`;
                    }
                }
            }

            messagePayload.content = messagePayload.content.trim();

            if (messagePayload.content === "" && allUploadFiles.length === 0) {
                console.log("[Skipped] Nothing to send");
                return;
            }

            console.log(`[Sending] ${allUploadFiles.length} files + content`);

            try {
                await message.reply(messagePayload);
            } catch (err) {
                console.warn(`[Reply Failed] ${err.code}, trying fallback...`);
                if (messagePayload.content) {
                    messagePayload.content =
                        `<@${message.author.id}> ` + messagePayload.content;
                } else {
                    messagePayload.content = `<@${message.author.id}>`;
                }
                await message.channel.send(messagePayload);
            }
        } catch (error) {
            console.error("[Handler Error]", error.message);
        }
    }
}

module.exports = handleMessage;
const { AttachmentBuilder } = require("discord.js");

const MAX_UPLOAD_SIZE = 25 * 1024 * 1024;

async function downloadMedia(mediaUrls) {
  const uploadFiles = [];
  const oversizedMediaUrls = [];

  for (const mediaUrl of mediaUrls) {
    const fileResponse = await fetch(mediaUrl);
    if (fileResponse.ok) {
      const arrayBuffer = await fileResponse.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);

      if (buffer.length > MAX_UPLOAD_SIZE) {
        oversizedMediaUrls.push(mediaUrl);
        continue;
      }

      const filename = mediaUrl.split('/').pop();
      uploadFiles.push(new AttachmentBuilder(buffer, { name: filename }));
    }
  }
  return { uploadFiles, oversizedMediaUrls };
}

module.exports = { downloadMedia };
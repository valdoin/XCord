const { AttachmentBuilder } = require("discord.js");

const MAX_UPLOAD_SIZE = 9.5 * 1024 * 1024;

async function downloadMedia(mediaUrls) {
  const uploadFiles = [];
  const oversizedMediaUrls = [];

  for (const mediaUrl of mediaUrls) {
    try {
      const fileResponse = await fetch(mediaUrl);
      
      if (fileResponse.ok) {
        const arrayBuffer = await fileResponse.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);
        if (buffer.length > MAX_UPLOAD_SIZE) {
          oversizedMediaUrls.push(mediaUrl);
          continue;
        }
        const filename = mediaUrl.split('/').pop().split('?')[0];
        uploadFiles.push(new AttachmentBuilder(buffer, { name: filename }));
      }
    } catch (error) {
      console.error(`Download error :  ${mediaUrl}:`, error);
      oversizedMediaUrls.push(mediaUrl);
    }
  }
  
  return { uploadFiles, oversizedMediaUrls };
}

module.exports = { downloadMedia };
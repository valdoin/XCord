import { AttachmentBuilder } from "discord.js";

const MAX_UPLOAD_SIZE = 9.5 * 1024 * 1024;

export async function downloadMedia(mediaUrls: string[]) {
  const uploadFiles: AttachmentBuilder[] = [];
  const oversizedMediaUrls: string[] = [];

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
        const filename = mediaUrl.split('/').pop()?.split('?')[0] || 'file';
        uploadFiles.push(new AttachmentBuilder(buffer, { name: filename }));
      }
    } catch (error) {
      console.error(`Download error :  ${mediaUrl}:`, error);
      oversizedMediaUrls.push(mediaUrl);
    }
  }
  
  return { uploadFiles, oversizedMediaUrls };
}
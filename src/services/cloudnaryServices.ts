import { v2 as cloudinary } from 'cloudinary';
import { Readable } from 'stream';

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME || '',
  api_key: process.env.CLOUDINARY_API_KEY || '',
  api_secret: process.env.CLOUDINARY_API_SECRET || '',
});

/**
 * Uploads an image buffer to Cloudinary
 * @param buffer - The image buffer to upload
 * @param folder - Optional folder name to organize images
 * @returns A Promise that resolves to the Cloudinary secure URL
 */
export const uploadImage = async (buffer: Buffer, folder = 'chat-images'): Promise<string> => {
  return new Promise((resolve, reject) => {
    // Create an upload stream
    const uploadStream = cloudinary.uploader.upload_stream(
      { folder },
      (error, result) => {
        if (error) return reject(error);
        if (!result) return reject(new Error('No result from Cloudinary'));
        resolve(result.secure_url);
      }
    );

    // Convert buffer to stream and pipe to Cloudinary
    const stream = Readable.from(buffer);
    stream.pipe(uploadStream);
  });
};

/**
 * Deletes an image from Cloudinary by URL
 * @param url - The Cloudinary URL of the image to delete
 */
export const deleteImage = async (url: string): Promise<void> => {
  try {
    // Extract the public_id from the URL
    // Cloudinary URLs typically look like: https://res.cloudinary.com/cloud-name/image/upload/folder/public_id.extension
    const urlParts = url.split('/');
    const filenamePart = urlParts[urlParts.length - 1];
    const publicId = filenamePart.split('.')[0];
    
    // If there's a folder structure, include it in the public_id
    const folderIndex = urlParts.indexOf('upload') + 1;
    if (folderIndex < urlParts.length - 1) {
      const folder = urlParts.slice(folderIndex, urlParts.length - 1).join('/');
      await cloudinary.uploader.destroy(`${folder}/${publicId}`);
    } else {
      await cloudinary.uploader.destroy(publicId);
    }
  } catch (error) {
    console.error('Error deleting image from Cloudinary:', error);
    throw error;
  }
};
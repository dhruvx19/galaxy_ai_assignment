// services/cloudinaryService.ts
import { v2 as cloudinary } from 'cloudinary';
import { Readable } from 'stream';

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

/**
 * Uploads an image buffer to Cloudinary
 * @param buffer - The image buffer
 * @param folder - The folder to upload to in Cloudinary
 * @returns The Cloudinary image URL
 */
export const uploadImage = async (buffer: Buffer, folder = 'chat-images'): Promise<string> => {
  return new Promise((resolve, reject) => {
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
 * Deletes an image from Cloudinary
 * @param url - The Cloudinary URL of the image to delete
 */
export const deleteImage = async (url: string): Promise<void> => {
  // Extract the public_id from the URL
  const publicId = url.split('/').pop()?.split('.')[0];
  if (!publicId) throw new Error('Invalid Cloudinary URL');
  
  await cloudinary.uploader.destroy(publicId);
};
import { Request, Response } from 'express';
import { uploadImage } from '../services/cloudnaryServices';

/**
 * Controller to handle image uploads
 * @param req - Express request object with file buffer
 * @param res - Express response object
 */
export const uploadImageController = async (req: Request, res: Response): Promise<void> => {
  try {
    // Check if a file was uploaded
    if (!req.file) {
      res.status(400).json({ error: 'No image file provided' });
      return;
    }

    // Upload the image to Cloudinary
    const imageUrl = await uploadImage(req.file.buffer);

    // Return the URL of the uploaded image
    res.status(200).json({ imageUrl });
  } catch (error) {
    console.error('Error uploading image:', error);
    res.status(500).json({ error: 'Failed to upload image' });
  }
};
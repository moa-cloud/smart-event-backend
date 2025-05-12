import { Injectable } from '@nestjs/common';
import { cloudinary } from './cloudinary.config';
import { Readable } from 'stream';
import { Express } from 'express';

@Injectable()
export class CloudinaryService {
  async uploadImageToCloudinary(file: Express.Multer.File): Promise<string> {
    return new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder: 'smart-event/events', // optional folder
        },
        (error, result) => {
          if (error) {
            return reject(error);
          }
          resolve(result.secure_url);
        },
      );

      const readableFile = new Readable();
      readableFile.push(file.buffer);
      readableFile.push(null);
      readableFile.pipe(uploadStream);
    });
  }

  async uploadMultipleImagesToCloudinary(
    files: Express.Multer.File[],
  ): Promise<string[]> {
    const uploadedImages = [];
    for (const file of files) {
      const imageUrl = await this.uploadImageToCloudinary(file);
      uploadedImages.push(imageUrl);
    }
    return uploadedImages;
  }
}

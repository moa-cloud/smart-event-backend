import { BadRequestException } from '@nestjs/common';
import { memoryStorage } from 'multer';
import { Request } from 'express';
import { MulterOptions } from '@nestjs/platform-express/multer/interfaces/multer-options.interface';

export const multerProfileImageOptions: MulterOptions = {
  storage: memoryStorage(),
  limits: {
    fileSize: 2 * 1024 * 1024, // 2MB max size
  },
  fileFilter: (
    req: Request,
    file: Express.Multer.File,
    callback: (error: any, acceptFile: boolean) => void,
  ) => {
    const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/jfif'];

    if (!allowedMimeTypes.includes(file.mimetype)) {
      return callback(
        new BadRequestException('Only JPEG and PNG files are allowed!'),
        false,
      );
    }

    console.log('inside multer');
    callback(null, true); // Accept the file
  },
};

export const multerEventImageOptions: MulterOptions = {
  storage: memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB max size
  },
  fileFilter: (
    req: Request,
    file: Express.Multer.File,
    callback: (error: any, acceptFile: boolean) => void,
  ) => {
    const allowedMimeTypes = ['image/jpeg', 'image/png'];

    if (!allowedMimeTypes.includes(file.mimetype)) {
      return callback(
        new BadRequestException('Only JPEG and PNG files are allowed!'),
        false,
      );
    }

    callback(null, true); // Accept the file
  },
};

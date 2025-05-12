import 'dotenv/config'; // Automatically loads variables from your .env file
import { v2 as cloudinary } from 'cloudinary';
console.log('ENV cloud name:', process.env.CLOUDINARY_CLOUD_NAME);
console.log('ENV api key:', process.env.CLOUDINARY_API_KEY);
console.log('ENV secret:', process.env.CLOUDINARY_API_SECRET);

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export { cloudinary };

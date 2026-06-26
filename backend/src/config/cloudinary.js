/**
 * Cloudinary config — gracefully skips when credentials are missing
 */
let cloudinary = null;

if (process.env.CLOUDINARY_CLOUD_NAME && process.env.CLOUDINARY_API_KEY) {
  const { v2 } = require('cloudinary');
  v2.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key:    process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
  });
  cloudinary = v2;
  console.log('[Cloudinary] Client initialized');
} else {
  console.warn('[Cloudinary] Credentials not set — file uploads will be stored locally');
}

module.exports = cloudinary;

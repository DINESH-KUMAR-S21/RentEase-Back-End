import cloudinary from 'cloudinary';

let isConfigured = false;

const configureCloudinary = () => {
  if (!isConfigured) {
    console.log('🔧 Initializing Cloudinary (v1 API)...');
    console.log('Cloud name:', process.env.CLOUDINARY_NAME);
    console.log('API Key exists:', !!process.env.CLOUDINARY_API_KEY);
    console.log('API Secret exists:', !!process.env.CLOUDINARY_API_SECRET);

    cloudinary.config({
      cloud_name: process.env.CLOUDINARY_NAME,
      api_key: process.env.CLOUDINARY_API_KEY,
      api_secret: process.env.CLOUDINARY_API_SECRET,
    });

    isConfigured = true;
    console.log('✅ Cloudinary config applied successfully');
  }
  return cloudinary;
};

export default configureCloudinary();
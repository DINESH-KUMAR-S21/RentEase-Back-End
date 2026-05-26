import cloudinary from 'cloudinary';

const uploadToCloudinary = async (fileBuffer, fileName) => {
  console.log('Starting Cloudinary upload for:', fileName);

  // Configure Cloudinary only when needed
  if (!cloudinary.config().cloud_name) {
    console.log('Configuring Cloudinary...');
    console.log('Cloudinary config check:', {
      cloud_name: process.env.CLOUDINARY_NAME,
      has_api_key: !!process.env.CLOUDINARY_API_KEY,
      has_api_secret: !!process.env.CLOUDINARY_API_SECRET
    });

    cloudinary.config({
      cloud_name: process.env.CLOUDINARY_NAME,
      api_key: process.env.CLOUDINARY_API_KEY,
      api_secret: process.env.CLOUDINARY_API_SECRET,
    });
  }

  return new Promise((resolve, reject) => {
    cloudinary.v2.uploader.upload_stream(
      {
        folder: 'rental-products', // Creates a folder in Cloudinary
        resource_type: 'auto',
        public_id: fileName,
      },
      (error, result) => {
        if (error) {
          console.error('Cloudinary upload error:', error);
          reject(error);
        } else {
          console.log('Cloudinary upload success:', result.secure_url);
          resolve(result);
        }
      }
    ).end(fileBuffer);
  });
};

const deleteFromCloudinary = async (publicId) => {
  console.log('Deleting from Cloudinary:', publicId);

  // Configure Cloudinary only when needed
  if (!cloudinary.config().cloud_name) {
    console.log('Configuring Cloudinary for delete...');
    cloudinary.config({
      cloud_name: process.env.CLOUDINARY_NAME,
      api_key: process.env.CLOUDINARY_API_KEY,
      api_secret: process.env.CLOUDINARY_API_SECRET,
    });
  }

  try {
    const result = await cloudinary.v2.uploader.destroy(publicId);
    console.log('Cloudinary delete success for:', publicId);
    return result;
  } catch (error) {
    console.error('Error deleting image:', error);
    throw error;
  }
};

export { uploadToCloudinary, deleteFromCloudinary };
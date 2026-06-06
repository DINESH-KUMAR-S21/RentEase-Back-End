import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: new URL('./config/config.env', import.meta.url).pathname });

import axios from 'axios';
import FormData from 'form-data';
import mongoose from 'mongoose';
import User from './models/userModel.js';

async function setupTestVendor() {
  try {
    await mongoose.connect(process.env.DB_URI);

    const testVendor = await User.create({
      name: 'Test Vendor',
      email: 'vendor@test.com',
      password: 'testpassword123',
      role: 'vendor',
      avatar: {
        public_id: 'test_id',
        url: 'test_url'
      }
    });

    console.log('Test vendor created:', testVendor._id);

    const token = testVendor.getJwtToken();
    console.log('Vendor token:', token);

    return token;
  } catch (error) {
    console.error('Setup failed:', error);
    throw error;
  }
}

async function testImageUpload(vendorToken) {
  try {
    const testImageBuffer = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==', 'base64');

    const formData = new FormData();
    formData.append('name', 'Test Product');
    formData.append('description', 'Test product description');
    formData.append('price', '100');
    formData.append('category', 'Test Category');
    formData.append('location', 'Test Location');
    formData.append('images', testImageBuffer, {
      filename: 'test-image.png',
      contentType: 'image/png'
    });

    console.log('Sending test image upload request...');

    const BACKEND_BASE_URL = process.env.BACKEND_BASE_URL || 'http://localhost:8000';
    const response = await axios.post(`${BACKEND_BASE_URL}/api/v1/vendor/product/create`, formData, {
      headers: {
        ...formData.getHeaders(),
        Authorization: `Bearer ${vendorToken}`
      }
    });

    console.log('Upload successful:', response.data);
  } catch (error) {
    console.error('Upload failed:', error.response?.data || error.message);
  }
}

async function runTest() {
  try {
    const vendorToken = await setupTestVendor();
    await testImageUpload(vendorToken);
  } catch (error) {
    console.error('Test failed:', error);
  } finally {
    await mongoose.connection.close();
  }
}

runTest();
import dotenv from 'dotenv';
import mongoose from 'mongoose';

dotenv.config({ path: './backend/config/config.env' });

import product from '../models/productModel.js';

const seedProducts = async () => {
    try {
        await mongoose.connect(process.env.DB_URI);
        console.log('✅ Connected to MongoDB');

        // Clear existing products
        await product.deleteMany({});
        console.log('🗑️  Cleared existing products');

        // Sample products
        const sampleProducts = [
            {
                name: "Modern Sofa",
                description: "Comfortable modern sofa perfect for living rooms",
                price: 15000,
                category: "Sofa",
                stock: 5,
                ratings: 4.5,
                availability: "Available",
                securityDeposit: 3000,
                rentalTenure: [3, 6, 12],
                images: [
                    {
                        url: "https://via.placeholder.com/400",
                        public_id: "sofa1"
                    }
                ],
                thumbnail: {
                    url: "https://via.placeholder.com/400",
                    public_id: "sofa1"
                }
            },
            {
                name: "Wooden Dining Table",
                description: "Premium wooden dining table for 6 people",
                price: 12000,
                category: "Table",
                stock: 3,
                ratings: 4.8,
                availability: "Available",
                securityDeposit: 2500,
                rentalTenure: [3, 6, 12],
                images: [
                    {
                        url: "https://via.placeholder.com/400",
                        public_id: "table1"
                    }
                ],
                thumbnail: {
                    url: "https://via.placeholder.com/400",
                    public_id: "table1"
                }
            },
            {
                name: "Smart TV 55 inch",
                description: "Latest 4K Smart TV with HDR",
                price: 45000,
                category: "TV",
                stock: 2,
                ratings: 4.7,
                availability: "Available",
                securityDeposit: 8000,
                rentalTenure: [3, 6, 12],
                images: [
                    {
                        url: "https://via.placeholder.com/400",
                        public_id: "tv1"
                    }
                ],
                thumbnail: {
                    url: "https://via.placeholder.com/400",
                    public_id: "tv1"
                }
            },
            {
                name: "Air Conditioner 1.5 Ton",
                description: "Energy efficient air conditioner",
                price: 35000,
                category: "Air Conditioner",
                stock: 4,
                ratings: 4.6,
                availability: "Available",
                securityDeposit: 7000,
                rentalTenure: [3, 6, 12],
                images: [
                    {
                        url: "https://via.placeholder.com/400",
                        public_id: "ac1"
                    }
                ],
                thumbnail: {
                    url: "https://via.placeholder.com/400",
                    public_id: "ac1"
                }
            }
        ];

        const insertedProducts = await product.insertMany(sampleProducts);
        console.log(`✅ Inserted ${insertedProducts.length} sample products`);

        await mongoose.connection.close();
        console.log('✅ Database connection closed');
        process.exit(0);
    } catch (error) {
        console.error('❌ Error:', error.message);
        process.exit(1);
    }
};

seedProducts();

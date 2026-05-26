import mongoose from 'mongoose';

export const connectDB = async () => {
    try {
        const data = await mongoose.connect(process.env.DB_URI);
        console.log(`MongoDB connected with server: ${data.connection.host}`);
    } catch (error) {
        console.log(`Database connection error: ${error.message}`);
        process.exit(1);
    }
};
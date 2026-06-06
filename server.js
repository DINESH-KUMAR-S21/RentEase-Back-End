import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables FIRST - Use absolute path
dotenv.config({ path: path.join(__dirname, './config/config.env') });

// Verify DB_URI is loaded
if (!process.env.DB_URI) {
    console.error('❌ CRITICAL: DB_URI not found in config.env');
    console.error('Environment variables loaded:', Object.keys(process.env).filter(k => k.includes('DB') || k.includes('FRONTEND')));
    process.exit(1);
}

import app from './app.js';
import { connectDB } from './config/db.js';

// Start server
const port = process.env.PORT || 8000;

const server = app.listen(port, () => {
    console.log(`🚀 Server is running on port ${port} in ${process.env.NODE_ENV} mode`);
});

// Connect to database
connectDB().catch((err) => {
    console.error('❌ Database connection failed:', err.message);
    server.close(() => {
        process.exit(1);
    });
});

process.on("unhandledRejection", (err) => {
    console.log(`❌ Error: ${err.message}`);
    console.log("Shutting down the server due to unhandled promise rejection");
    server.close(() => {
        process.exit(1);
    });
});

process.on("uncaughtException", (err) => {
    console.error(`❌ Uncaught Exception: ${err.message}`);
    console.error(err.stack);
    process.exit(1);
});
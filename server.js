import dotenv from 'dotenv';

// Load environment variables FIRST
dotenv.config({ path: './backend/config/config.env' });

let app;
try {
    const appModule = await import('./app.js');
    app = appModule.default;
    console.log('✅ App module loaded successfully');
} catch (err) {
    console.error('❌ CRITICAL: Failed to load app module:', err);
    process.exit(1);
}

import { connectDB } from './config/db.js';

connectDB();

const port = process.env.PORT || 3000;

const server = app.listen(port, () => {
    console.log(`Server is running on port ${port} in ${process.env.NODE_ENV} mode`);
});

process.on("unhandledRejection", (err) => {
    console.log(`Error: ${err.message}`);
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
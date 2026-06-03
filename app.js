import express from 'express';
import cookieParser from 'cookie-parser';
import helmet from 'helmet';
// import rateLimit from 'express-rate-limit'; // Disabled for development
import cors from 'cors';
import errorHandleMiddleware from './middleware/error.js';

import products from './Routes/ProductRoute.js';
import user from './Routes/userRoutes.js';
import order from './Routes/orderRoutes.js';
import cart from './Routes/cartRoutes.js';
import rental from './Routes/rentalRoutes.js';
import vendor from './Routes/vendorRoutes.js';
import maintenance from './Routes/maintenanceRoutes.js';
import admin from './Routes/adminRoutes.js';

const app = express();

// ─── SECURITY HEADERS ─────────────────────────────────────────────
app.use(helmet());

// ─── CORS CONFIGURATION ───────────────────────────────────────────
app.use(cors({
    origin: ['http://localhost:5173', 'http://localhost:5174', 'http://localhost:5175', 'http://localhost:5176', 'http://localhost:5177', 'http://localhost:5178'], // Allow all possible frontend ports
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));

// ─── RATE LIMITING ────────────────────────────────────────────────
// DISABLED FOR DEVELOPMENT - Enable for production
// const apiLimiter = rateLimit({
//     windowMs: 15 * 60 * 1000, // 15 minutes
//     max: 100,
//     message: {
//         success: false,
//         message: "Too many requests from this IP, please try again after 15 minutes"
//     },
//     standardHeaders: true,
//     legacyHeaders: false
// });

// // Strict limiter for auth routes
// const authLimiter = rateLimit({
//     windowMs: 15 * 60 * 1000, // 15 minutes
//     max: 10,
//     message: {
//         success: false,
//         message: "Too many login attempts from this IP, please try again after 15 minutes"
//     },
//     standardHeaders: true,
//     legacyHeaders: false
// });

// ─── MIDDLEWARE ───────────────────────────────────────────────────
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));
app.use(cookieParser());

// ─── ROUTES ───────────────────────────────────────────────────────
// Rate limiting disabled for development
// Uncomment below for production:
// app.use("/api/v1", apiLimiter);                 // apply to all routes
// app.use("/api/v1/register", authLimiter);        // stricter on auth
// app.use("/api/v1/login", authLimiter);
// app.use("/api/v1/password/forgot", authLimiter);

app.use("/api/v1", products);
app.use("/api/v1", user);
app.use("/api/v1", order);
app.use("/api/v1", cart);
app.use("/api/v1", rental);
app.use("/api/v1", vendor);
app.use("/api/v1", maintenance);
app.use("/api/v1", admin);

// ─── ERROR MIDDLEWARE (always last) ───────────────────────────────
app.use(errorHandleMiddleware);

export default app;
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
// Log the environment URL being used
console.log(`📋 FRONTEND_URL from env: ${process.env.FRONTEND_URL}`);

// Simplified CORS - Allow specific origins and Vercel preview domains
const allowedStaticOrigins = [
    'https://rent-ease-front-end.vercel.app',
    'http://localhost:5173',
    'http://localhost:5174',
    'http://localhost:5175',
    'http://localhost:5176',
    'http://localhost:5177',
    'http://localhost:5178'
].filter(Boolean);

// Merge any configured FRONTEND_URL
if (process.env.FRONTEND_URL) allowedStaticOrigins.push(process.env.FRONTEND_URL);

const corsOptions = {
    origin: function(origin, callback) {
        // Allow requests with no origin (e.g., server-to-server, curl)
        if (!origin) return callback(null, true);

        try {
            const hostname = new URL(origin).hostname;

            // Allow exact matches
            if (allowedStaticOrigins.includes(origin)) return callback(null, true);

            // Allow any subdomain under vercel.app (preview deployments)
            if (hostname && hostname.endsWith('.vercel.app')) return callback(null, true);

            // Otherwise reject
            return callback(new Error('CORS policy: Origin not allowed'), false);
        } catch (err) {
            return callback(new Error('CORS policy: Invalid origin'), false);
        }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
    exposedHeaders: ['Content-Type', 'Authorization'],
    maxAge: 3600,
    optionsSuccessStatus: 200 // For legacy browsers
};

console.log('✅ Allowed CORS static origins:', allowedStaticOrigins);

// Apply CORS middleware
app.use(cors(corsOptions));

// ─── REQUEST LOGGING ──────────────────────────────────────────────
// Log all incoming requests
app.use((req, res, next) => {
    console.log(`📨 ${req.method} ${req.path} - Origin: ${req.get('origin') || 'no-origin'}`);
    next();
});

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
// Health check endpoint
app.get('/health', (req, res) => {
    res.status(200).json({ success: true, message: 'Server is running' });
});

// Rate limiting disabled for development
// Uncomment below for production:
// app.use("/api/v1", apiLimiter);                 // apply to all routes
// app.use("/api/v1/register", authLimiter);        // stricter on auth
// app.use("/api/v1/login", authLimiter);
// app.use("/api/v1/password/forgot", authLimiter);

console.log('📍 Registering routes...');
try {
    app.use("/api/v1", products);
    console.log('✅ Products routes registered');
} catch (err) {
    console.error('❌ FAILED to register products routes:', err.message);
}

try {
    app.use("/api/v1", user);
    console.log('✅ User routes registered');
} catch (err) {
    console.error('❌ FAILED to register user routes:', err.message);
}

try {
    app.use("/api/v1", order);
    console.log('✅ Order routes registered');
} catch (err) {
    console.error('❌ FAILED to register order routes:', err.message);
}

try {
    app.use("/api/v1", cart);
    console.log('✅ Cart routes registered');
} catch (err) {
    console.error('❌ FAILED to register cart routes:', err.message);
}

try {
    app.use("/api/v1", rental);
    console.log('✅ Rental routes registered');
} catch (err) {
    console.error('❌ FAILED to register rental routes:', err.message);
}

try {
    app.use("/api/v1", vendor);
    console.log('✅ Vendor routes registered');
} catch (err) {
    console.error('❌ FAILED to register vendor routes:', err.message);
}

try {
    app.use("/api/v1", maintenance);
    console.log('✅ Maintenance routes registered');
} catch (err) {
    console.error('❌ FAILED to register maintenance routes:', err.message);
}

try {
    app.use("/api/v1", admin);
    console.log('✅ Admin routes registered');
} catch (err) {
    console.error('❌ FAILED to register admin routes:', err.message);
}

// ─── ERROR MIDDLEWARE (always last) ───────────────────────────────
app.use(errorHandleMiddleware);

export default app;
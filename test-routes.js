/**
 * Test script to validate all route modules import correctly
 * Run this before deployment: node test-routes.js
 */

import dotenv from 'dotenv';
dotenv.config({ path: './backend/config/config.env' });

console.log('🧪 Testing route module imports...\n');

const routes = [
    { name: 'ProductRoute', path: './Routes/ProductRoute.js' },
    { name: 'userRoutes', path: './Routes/userRoutes.js' },
    { name: 'orderRoutes', path: './Routes/orderRoutes.js' },
    { name: 'cartRoutes', path: './Routes/cartRoutes.js' },
    { name: 'rentalRoutes', path: './Routes/rentalRoutes.js' },
    { name: 'vendorRoutes', path: './Routes/vendorRoutes.js' },
    { name: 'maintenanceRoutes', path: './Routes/maintenanceRoutes.js' },
    { name: 'adminRoutes', path: './Routes/adminRoutes.js' }
];

let allPassed = true;

for (const route of routes) {
    try {
        const imported = await import(route.path);
        if (imported.default) {
            console.log(`✅ ${route.name} - OK`);
        } else {
            console.log(`❌ ${route.name} - No default export`);
            allPassed = false;
        }
    } catch (err) {
        console.error(`❌ ${route.name} - FAILED:`, err.message);
        allPassed = false;
    }
}

console.log('\n' + (allPassed ? '✅ All routes loaded successfully!' : '❌ Some routes failed to load'));
process.exit(allPassed ? 0 : 1);

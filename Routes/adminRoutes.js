import express from 'express';
import { verifyUserAuth, roleBasedAccess } from '../middleware/userAuth.js';
import {
    getAdminDashboard,
    getRevenueAnalytics,
    getCategoryAnalytics,
    getRentalTrends,
    adminGetAllUsers,
    adminGetAllVendors,
    adminGetSingleUser,
    adminUpdateUserRole,
    adminDeleteUser,
    createLocation,
    getAllLocations,
    getServiceableLocations,
    updateLocation,
    deleteLocation,
    getDisputedRentals,
    resolveDispute,
    generateReport
} from '../controller/adminController.js';

const router = express.Router();

const adminAuth = [verifyUserAuth, roleBasedAccess("admin")];

// Dashboard & Analytics
router.route("/admin/dashboard").get(...adminAuth, getAdminDashboard);
router.route("/admin/analytics/revenue").get(...adminAuth, getRevenueAnalytics);
router.route("/admin/analytics/categories").get(...adminAuth, getCategoryAnalytics);
router.route("/admin/analytics/trends").get(...adminAuth, getRentalTrends);

// User management
router.route("/admin/users").get(...adminAuth, adminGetAllUsers);
router.route("/admin/vendors").get(...adminAuth, adminGetAllVendors);
router.route("/admin/user/:id")
    .get(...adminAuth, adminGetSingleUser)
    .put(...adminAuth, adminUpdateUserRole)
    .delete(...adminAuth, adminDeleteUser);

// Location management
router.route("/locations").get(getServiceableLocations); // public
router.route("/admin/locations").get(...adminAuth, getAllLocations);
router.route("/admin/location/new").post(...adminAuth, createLocation);
router.route("/admin/location/:id")
    .put(...adminAuth, updateLocation)
    .delete(...adminAuth, deleteLocation);

// Dispute management
router.route("/admin/disputes").get(...adminAuth, getDisputedRentals);
router.route("/admin/dispute/resolve/:id").put(...adminAuth, resolveDispute);

// Reports
router.route("/admin/report").get(...adminAuth, generateReport);

export default router;
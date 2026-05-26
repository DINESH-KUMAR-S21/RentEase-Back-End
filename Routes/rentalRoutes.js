import express from 'express';
import { verifyUserAuth, roleBasedAccess } from '../middleware/userAuth.js';
import {
    createRental,
    getMyActiveRentals,
    getMyRentalHistory,
    getSingleRental,
    extendRental,
    requestReturn,
    getVendorRentals,
    vendorUpdateReturn,
    getAllRentals,
    adminUpdateRentalStatus
} from '../controller/rentalController.js';

const router = express.Router();

// User routes
router.route("/rental/new/:orderId").post(verifyUserAuth, createRental);
router.route("/rentals/me/active").get(verifyUserAuth, getMyActiveRentals);
router.route("/rentals/me/history").get(verifyUserAuth, getMyRentalHistory);
router.route("/rental/:id").get(verifyUserAuth, getSingleRental);
router.route("/rental/extend/:id").put(verifyUserAuth, extendRental);
router.route("/rental/return/:id").put(verifyUserAuth, requestReturn);

// Vendor routes
router.route("/vendor/rentals").get(verifyUserAuth, roleBasedAccess("vendor"), getVendorRentals);
router.route("/vendor/rental/return/:id").put(verifyUserAuth, roleBasedAccess("vendor"), vendorUpdateReturn);

// Admin routes
router.route("/admin/rentals").get(verifyUserAuth, roleBasedAccess("admin"), getAllRentals);
router.route("/admin/rental/:id").put(verifyUserAuth, roleBasedAccess("admin"), adminUpdateRentalStatus);

export default router;
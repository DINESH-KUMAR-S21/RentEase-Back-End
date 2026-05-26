import express from 'express';
import { verifyUserAuth, roleBasedAccess } from '../middleware/userAuth.js';
import {
    createMaintenanceRequest,
    getMyMaintenanceRequests,
    getSingleMaintenanceRequest,
    cancelMaintenanceRequest,
    adminGetAllMaintenanceRequests,
    adminUpdateMaintenanceRequest,
    adminDeleteMaintenanceRequest,
    adminGetMaintenanceByVendor
} from '../controller/maintenanceController.js';
import { validateMaintenanceRequest } from '../middleware/validate.js';

const router = express.Router();

// User routes
router.route("/maintenance/new").post(verifyUserAuth, validateMaintenanceRequest, createMaintenanceRequest);
router.route("/maintenance/me").get(verifyUserAuth, getMyMaintenanceRequests);
router.route("/maintenance/:id")
    .get(verifyUserAuth, getSingleMaintenanceRequest)
    .delete(verifyUserAuth, cancelMaintenanceRequest);

// Admin routes
router.route("/admin/maintenance")
    .get(verifyUserAuth, roleBasedAccess("admin"), adminGetAllMaintenanceRequests);
router.route("/admin/maintenance/:id")
    .put(verifyUserAuth, roleBasedAccess("admin"), adminUpdateMaintenanceRequest)
    .delete(verifyUserAuth, roleBasedAccess("admin"), adminDeleteMaintenanceRequest);
router.route("/admin/maintenance/vendor/:vendorId")
    .get(verifyUserAuth, roleBasedAccess("admin"), adminGetMaintenanceByVendor);

export default router;
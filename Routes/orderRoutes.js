import express from 'express';
import { verifyUserAuth, roleBasedAccess } from '../middleware/userAuth.js';
import {
    createOrder,
    getSingleOrder,
    getMyOrders,
    getAllOrders,
    updateOrderStatus,
    updateRentalStatus,
    deleteOrder
} from '../controller/orderController.js';
import { validateOrder } from '../middleware/validate.js';

const router = express.Router();

// User routes
router.route("/new/order").post(verifyUserAuth, validateOrder, createOrder);
router.route("/order/:id").get(verifyUserAuth, getSingleOrder);
router.route("/orders/me").get(verifyUserAuth, getMyOrders);

// Admin routes
router.route("/admin/orders").get(verifyUserAuth, roleBasedAccess("admin"), getAllOrders);
router.route("/admin/order/:id")
    .put(verifyUserAuth, roleBasedAccess("admin"), updateOrderStatus)
    .delete(verifyUserAuth, roleBasedAccess("admin"), deleteOrder);
router.route("/admin/order/rental/:id")
    .put(verifyUserAuth, roleBasedAccess("admin"), updateRentalStatus);

export default router;
import express from 'express';
import { verifyUserAuth } from '../middleware/userAuth.js';
import {
    addToCart,
    getMyCart,
    updateCartItem,
    removeCartItem,
    clearCart
} from '../controller/cartController.js';

const router = express.Router();

router.route("/cart").get(verifyUserAuth, getMyCart);
router.route("/cart/add").post(verifyUserAuth, addToCart);
router.route("/cart/update").put(verifyUserAuth, updateCartItem);
router.route("/cart/remove/:productId").delete(verifyUserAuth, removeCartItem);
router.route("/cart/clear").delete(verifyUserAuth, clearCart);

export default router;
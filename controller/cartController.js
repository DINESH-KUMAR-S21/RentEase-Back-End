import Cart from "../models/cartModel.js";
import Product from "../models/productModel.js";
import handleAsyncError from "../middleware/handleAsyncError.js";
import HandleError from "../utils/handleError.js";

// Add item to cart
export const addToCart = handleAsyncError(async (req, res, next) => {
    const { productId, quantity, rentalTenure } = req.body;

    const product = await Product.findById(productId);

    if (!product) {
        return next(new HandleError("Product not found", 404));
    }

    if (product.availability !== "Available") {
        return next(new HandleError("Product is not available for rent", 400));
    }

    if (!product.rentalTenure.includes(rentalTenure)) {
        return next(new HandleError(`Invalid rental tenure. Available options: ${product.rentalTenure.join(", ")} months`, 400));
    }

    // Find existing cart or create new one
    let cart = await Cart.findOne({ user: req.user._id });

    if (!cart) {
        cart = await Cart.create({
            user: req.user._id,
            cartItems: [],
            totalPrice: 0,
            totalSecurityDeposit: 0
        });
    }

    // Check if product already exists in cart
    const existingItemIndex = cart.cartItems.findIndex(
        item => item.product.toString() === productId
    );

    const imageUrl = product.images?.[0]?.url || "";

    if (existingItemIndex >= 0) {
        // Update existing item
        cart.cartItems[existingItemIndex].quantity = quantity;
        cart.cartItems[existingItemIndex].rentalTenure = rentalTenure;
    } else {
        // Add new item
        cart.cartItems.push({
            product: productId,
            name: product.name,
            image: product.images?.[0]?.url || "https://via.placeholder.com/150",
            price: product.price,
            securityDeposit: product.securityDeposit,
            rentalTenure,
            quantity: quantity || 1
        });
    }

    // Recalculate totals
    cart.totalPrice = cart.cartItems.reduce(
        (acc, item) => acc + item.price * item.quantity * item.rentalTenure, 0
    );
    cart.totalSecurityDeposit = cart.cartItems.reduce(
        (acc, item) => acc + item.securityDeposit * item.quantity, 0
    );

    await cart.save();

    res.status(200).json({
        success: true,
        message: "Item added to cart",
        cart
    });
});

// Get my cart
export const getMyCart = handleAsyncError(async (req, res, next) => {
    const cart = await Cart.findOne({ user: req.user._id })
        .populate("cartItems.product", "name images availability rentalTenure price securityDeposit");

    if (!cart || cart.cartItems.length === 0) {
        return res.status(200).json({
            success: true,
            message: "Cart is empty",
            cart: null
        });
    }

    res.status(200).json({
        success: true,
        cart
    });
});

// Update cart item (quantity or rentalTenure)
export const updateCartItem = handleAsyncError(async (req, res, next) => {
    const { productId, quantity, rentalTenure } = req.body;

    const cart = await Cart.findOne({ user: req.user._id });

    if (!cart) {
        return next(new HandleError("Cart not found", 404));
    }

    const itemIndex = cart.cartItems.findIndex(
        item => item.product.toString() === productId
    );

    if (itemIndex < 0) {
        return next(new HandleError("Item not found in cart", 404));
    }

    // Validate rental tenure if updating it
    if (rentalTenure) {
        const product = await Product.findById(productId);
        if (!product.rentalTenure.includes(rentalTenure)) {
            return next(new HandleError(`Invalid rental tenure. Available options: ${product.rentalTenure.join(", ")} months`, 400));
        }
        cart.cartItems[itemIndex].rentalTenure = rentalTenure;
    }

    if (quantity) {
        cart.cartItems[itemIndex].quantity = quantity;
    }

    // Recalculate totals
    cart.totalPrice = cart.cartItems.reduce(
        (acc, item) => acc + item.price * item.quantity * item.rentalTenure, 0
    );
    cart.totalSecurityDeposit = cart.cartItems.reduce(
        (acc, item) => acc + item.securityDeposit * item.quantity, 0
    );

    await cart.save();

    res.status(200).json({
        success: true,
        message: "Cart updated successfully",
        cart
    });
});

// Remove single item from cart
export const removeCartItem = handleAsyncError(async (req, res, next) => {
    const cart = await Cart.findOne({ user: req.user._id });

    if (!cart) {
        return next(new HandleError("Cart not found", 404));
    }

    const itemIndex = cart.cartItems.findIndex(
        item => item.product.toString() === req.params.productId
    );

    if (itemIndex < 0) {
        return next(new HandleError("Item not found in cart", 404));
    }

    cart.cartItems.splice(itemIndex, 1);

    // Recalculate totals
    cart.totalPrice = cart.cartItems.reduce(
        (acc, item) => acc + item.price * item.quantity * item.rentalTenure, 0
    );
    cart.totalSecurityDeposit = cart.cartItems.reduce(
        (acc, item) => acc + item.securityDeposit * item.quantity, 0
    );

    await cart.save();

    res.status(200).json({
        success: true,
        message: "Item removed from cart",
        cart
    });
});

// Clear entire cart
export const clearCart = handleAsyncError(async (req, res, next) => {
    const cart = await Cart.findOne({ user: req.user._id });

    if (!cart) {
        return next(new HandleError("Cart not found", 404));
    }

    cart.cartItems = [];
    cart.totalPrice = 0;
    cart.totalSecurityDeposit = 0;

    await cart.save();

    res.status(200).json({
        success: true,
        message: "Cart cleared successfully"
    });
});
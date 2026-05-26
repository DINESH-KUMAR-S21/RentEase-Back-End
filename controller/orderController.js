import Order from "../models/orderModel.js";
import Product from "../models/productModel.js";
import handleAsyncError from '../middleware/handleAsyncError.js';
import HandleError from "../utils/handleError.js";

// Create new order
export const createOrder = handleAsyncError(async (req, res, next) => {
    const {
        shippingInfo, orderItems, paymentInfo,
        itemsPrice, shippingPrice, totalPrice,
        taxPrice, rentalTenure, rentalStartDate,
        deliveryDate, securityDeposit
    } = req.body;

    // Auto calculate rental end date
    const startDate = new Date(rentalStartDate);
    const rentalEndDate = new Date(startDate);
    rentalEndDate.setMonth(rentalEndDate.getMonth() + rentalTenure);

    const order = await Order.create({
        shippingInfo,
        orderItems,
        paymentInfo,
        itemsPrice,
        shippingPrice,
        totalPrice,
        taxPrice,
        rentalTenure,
        rentalStartDate,
        rentalEndDate,
        deliveryDate,
        securityDeposit,
        paidAt: Date.now(),
        user: req.user._id
    });

    res.status(201).json({
        success: true,
        order
    });
});

// Get single order
export const getSingleOrder = handleAsyncError(async (req, res, next) => {
    const order = await Order.findById(req.params.id)
        .populate("user", "name email")
        .populate("orderItems.product", "name images");

    if (!order) {
        return next(new HandleError("Order not found with this id", 404));
    }

    res.status(200).json({
        success: true,
        order
    });
});

// Get logged in user orders
export const getMyOrders = handleAsyncError(async (req, res, next) => {
    const orders = await Order.find({ user: req.user._id })
        .populate("orderItems.product", "name images");

    res.status(200).json({
        success: true,
        count: orders.length,
        orders
    });
});

// Admin - Get all orders
export const getAllOrders = handleAsyncError(async (req, res, next) => {
    const orders = await Order.find()
        .populate("user", "name email")
        .populate("orderItems.product", "name images");

    // Calculate total revenue
    let totalRevenue = 0;
    orders.forEach(order => {
        totalRevenue += order.totalPrice;
    });

    res.status(200).json({
        success: true,
        count: orders.length,
        totalRevenue,
        orders
    });
});

// Admin - Update order status
export const updateOrderStatus = handleAsyncError(async (req, res, next) => {
    const order = await Order.findById(req.params.id);

    if (!order) {
        return next(new HandleError("Order not found with this id", 404));
    }

    if (order.orderStatus === "Delivered") {
        return next(new HandleError("This order has already been delivered", 400));
    }

    // Update product stock when order is delivered
    if (req.body.orderStatus === "Delivered") {
        for (const item of order.orderItems) {
            await Product.findByIdAndUpdate(item.product, {
                $inc: { stock: -item.quantity },
                availability: "Rented"
            });
        }
        order.deliveredAt = Date.now();
    }

    // If cancelled restore stock
    if (req.body.orderStatus === "Cancelled") {
        if (order.orderStatus === "Delivered") {
            for (const item of order.orderItems) {
                await Product.findByIdAndUpdate(item.product, {
                    $inc: { stock: +item.quantity },
                    availability: "Available"
                });
            }
        }
    }

    order.orderStatus = req.body.orderStatus;
    await order.save({ validateBeforeSave: false });

    res.status(200).json({
        success: true,
        message: "Order status updated successfully",
        order
    });
});

// Admin - Update rental status
export const updateRentalStatus = handleAsyncError(async (req, res, next) => {
    const order = await Order.findById(req.params.id);

    if (!order) {
        return next(new HandleError("Order not found with this id", 404));
    }

    order.rentalStatus = req.body.rentalStatus;

    // If returned, update return info
    if (req.body.rentalStatus === "Returned") {
        order.returnInfo = {
            returnedAt: Date.now(),
            condition: req.body.condition || "Good",
            damageCharges: req.body.damageCharges || 0,
            notes: req.body.notes || ""
        };

        // Restore product availability
        for (const item of order.orderItems) {
            await Product.findByIdAndUpdate(item.product, {
                availability: "Available",
                $inc: { stock: +item.quantity }
            });
        }

        // Handle security deposit
        if (req.body.condition === "Damaged" || req.body.condition === "Lost") {
            order.securityDepositStatus = "Forfeited";
        } else {
            order.securityDepositStatus = "Refunded";
        }
    }

    await order.save({ validateBeforeSave: false });

    res.status(200).json({
        success: true,
        message: "Rental status updated successfully",
        order
    });
});

// Admin - Delete order
export const deleteOrder = handleAsyncError(async (req, res, next) => {
    const order = await Order.findById(req.params.id);

    if (!order) {
        return next(new HandleError("Order not found with this id", 404));
    }

    await Order.findByIdAndDelete(req.params.id);

    res.status(200).json({
        success: true,
        message: "Order deleted successfully"
    });
});
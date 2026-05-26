import Rental from "../models/rentalModel.js";
import Order from "../models/orderModel.js";
import Product from "../models/productModel.js";
import Cart from "../models/cartModel.js";
import handleAsyncError from "../middleware/handleAsyncError.js";
import HandleError from "../utils/handleError.js";

// Create rental after order is placed
export const createRental = handleAsyncError(async (req, res, next) => {
    const order = await Order.findById(req.params.orderId)
        .populate("orderItems.product");

    if (!order) {
        return next(new HandleError("Order not found", 404));
    }

    // Check if rental already exists for this order
    const existingRental = await Rental.findOne({ order: order._id });
    if (existingRental) {
        return next(new HandleError("Rental already exists for this order", 400));
    }

    // Create a rental for each order item
    const rentals = [];
    for (const item of order.orderItems) {
        const product = await Product.findById(item.product);

        const rental = await Rental.create({
            user: order.user,
            order: order._id,
            product: item.product,
            vendor: product.vendor,
            rentalTenure: order.rentalTenure,
            rentalStartDate: order.rentalStartDate,
            rentalEndDate: order.rentalEndDate,
            deliveryDate: order.deliveryDate,
            monthlyPrice: item.price,
            totalRentalPrice: item.price * order.rentalTenure * item.quantity,
            securityDeposit: order.securityDeposit,
            shippingInfo: order.shippingInfo
        });

        rentals.push(rental);
    }

    // Clear user cart after rental created
    await Cart.findOneAndUpdate(
        { user: order.user },
        { cartItems: [], totalPrice: 0, totalSecurityDeposit: 0 }
    );

    res.status(201).json({
        success: true,
        message: "Rental created successfully",
        rentals
    });
});

// Get my active rentals
export const getMyActiveRentals = handleAsyncError(async (req, res, next) => {
    const rentals = await Rental.find({
        user: req.user._id,
        rentalStatus: "Active"
    })
        .populate("product", "name images category price")
        .populate("vendor", "name email")
        .sort({ rentalStartDate: -1 });

    res.status(200).json({
        success: true,
        count: rentals.length,
        rentals
    });
});

// Get my rental history (completed/returned)
export const getMyRentalHistory = handleAsyncError(async (req, res, next) => {
    const rentals = await Rental.find({
        user: req.user._id,
        rentalStatus: { $in: ["Completed", "Returned", "Cancelled"] }
    })
        .populate("product", "name images category price")
        .populate("vendor", "name email")
        .sort({ createdAt: -1 });

    res.status(200).json({
        success: true,
        count: rentals.length,
        rentals
    });
});

// Get single rental details
export const getSingleRental = handleAsyncError(async (req, res, next) => {
    const rental = await Rental.findById(req.params.id)
        .populate("product", "name images category price securityDeposit")
        .populate("vendor", "name email")
        .populate("order");

    if (!rental) {
        return next(new HandleError("Rental not found", 404));
    }

    // Only allow the rental owner or admin to view
    if (
        rental.user.toString() !== req.user._id.toString() &&
        req.user.role !== "admin"
    ) {
        return next(new HandleError("You are not authorized to view this rental", 403));
    }

    res.status(200).json({
        success: true,
        rental
    });
});

// Request rental extension
export const extendRental = handleAsyncError(async (req, res, next) => {
    const { additionalMonths } = req.body;

    const rental = await Rental.findById(req.params.id);

    if (!rental) {
        return next(new HandleError("Rental not found", 404));
    }

    if (rental.user.toString() !== req.user._id.toString()) {
        return next(new HandleError("You are not authorized to extend this rental", 403));
    }

    if (rental.rentalStatus !== "Active") {
        return next(new HandleError("Only active rentals can be extended", 400));
    }

    if (!additionalMonths || additionalMonths <= 0) {
        return next(new HandleError("Please provide valid number of months to extend", 400));
    }

    // Calculate new end date
    const newEndDate = new Date(rental.rentalEndDate);
    newEndDate.setMonth(newEndDate.getMonth() + additionalMonths);

    const additionalCharge = rental.monthlyPrice * additionalMonths;

    // Save extension history
    rental.extensions.push({
        extendedOn: Date.now(),
        additionalMonths,
        newEndDate,
        additionalCharge
    });

    rental.rentalEndDate = newEndDate;
    rental.rentalTenure += additionalMonths;
    rental.totalRentalPrice += additionalCharge;

    await rental.save();

    res.status(200).json({
        success: true,
        message: `Rental extended by ${additionalMonths} month(s)`,
        newEndDate,
        additionalCharge,
        rental
    });
});

// Request return of rental
export const requestReturn = handleAsyncError(async (req, res, next) => {
    const rental = await Rental.findById(req.params.id);

    if (!rental) {
        return next(new HandleError("Rental not found", 404));
    }

    if (rental.user.toString() !== req.user._id.toString()) {
        return next(new HandleError("You are not authorized to return this rental", 403));
    }

    if (rental.rentalStatus !== "Active") {
        return next(new HandleError("Only active rentals can be returned", 400));
    }

    rental.returnInfo.returnRequestedAt = Date.now();
    rental.rentalStatus = "Returned";

    await rental.save();

    res.status(200).json({
        success: true,
        message: "Return request submitted successfully. Our team will contact you for pickup.",
        rental
    });
});

// ─── VENDOR routes ────────────────────────────────────────────────

// Vendor - Get all rentals assigned to vendor
export const getVendorRentals = handleAsyncError(async (req, res, next) => {
    const rentals = await Rental.find({ vendor: req.user._id })
        .populate("product", "name images category")
        .populate("user", "name email")
        .sort({ createdAt: -1 });

    res.status(200).json({
        success: true,
        count: rentals.length,
        rentals
    });
});

// Vendor - Update rental return info (pickup confirmation)
export const vendorUpdateReturn = handleAsyncError(async (req, res, next) => {
    const rental = await Rental.findById(req.params.id);

    if (!rental) {
        return next(new HandleError("Rental not found", 404));
    }

    if (rental.vendor.toString() !== req.user._id.toString()) {
        return next(new HandleError("You are not authorized to update this rental", 403));
    }

    const { condition, damageCharges, notes } = req.body;

    rental.returnInfo = {
        ...rental.returnInfo,
        returnedAt: Date.now(),
        pickedUpBy: req.user._id,
        condition: condition || "Good",
        damageCharges: damageCharges || 0,
        notes: notes || ""
    };

    rental.rentalStatus = "Completed";

    // Handle security deposit
    if (condition === "Damaged" || condition === "Lost") {
        rental.securityDepositStatus = "Forfeited";
    } else {
        rental.securityDepositStatus = "Refunded";
    }

    // Restore product availability
    await Product.findByIdAndUpdate(rental.product, {
        availability: "Available",
        $inc: { stock: 1 }
    });

    await rental.save();

    res.status(200).json({
        success: true,
        message: "Return confirmed successfully",
        rental
    });
});

// ─── ADMIN routes ─────────────────────────────────────────────────

// Admin - Get all rentals
export const getAllRentals = handleAsyncError(async (req, res, next) => {
    const rentals = await Rental.find()
        .populate("product", "name images category")
        .populate("user", "name email")
        .populate("vendor", "name email")
        .sort({ createdAt: -1 });

    // Summary stats
    const activeCount = rentals.filter(r => r.rentalStatus === "Active").length;
    const overdueCount = rentals.filter(r => r.rentalStatus === "Overdue").length;
    const completedCount = rentals.filter(r => r.rentalStatus === "Completed").length;

    res.status(200).json({
        success: true,
        count: rentals.length,
        stats: { activeCount, overdueCount, completedCount },
        rentals
    });
});

// Admin - Update rental status
export const adminUpdateRentalStatus = handleAsyncError(async (req, res, next) => {
    const rental = await Rental.findById(req.params.id);

    if (!rental) {
        return next(new HandleError("Rental not found", 404));
    }

    rental.rentalStatus = req.body.rentalStatus;

    if (req.body.rentalStatus === "Overdue") {
        rental.securityDepositStatus = "Forfeited";
    }

    await rental.save();

    res.status(200).json({
        success: true,
        message: "Rental status updated",
        rental
    });
});
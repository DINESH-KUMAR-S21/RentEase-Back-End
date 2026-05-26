import Product from "../models/productModel.js";
import Rental from "../models/rentalModel.js";
import MaintenanceRequest from "../models/maintenanceRequestModel.js";
import User from "../models/userModel.js";
import handleAsyncError from "../middleware/handleAsyncError.js";
import HandleError from "../utils/handleError.js";
import APIFunctionality from "../utils/apiFunctionality.js";
import { uploadToCloudinary, deleteFromCloudinary } from '../utils/imageUpload.js';

// ─── PRODUCT MANAGEMENT ───────────────────────────────────────────

// Vendor - Create product
export const vendorCreateProduct = handleAsyncError(async (req, res, next) => {
    console.log('Files received:', req.files ? req.files.length : 'No files');
    console.log('Body received:', req.body);

    // Attach vendor and user to product
    req.body.vendor = req.user._id;
    req.body.user = req.user._id;

    // Parse rentalTenure if it's a string
    if (typeof req.body.rentalTenure === 'string') {
       try {
          req.body.rentalTenure = JSON.parse(req.body.rentalTenure);
       } catch (error) {
          return next(new HandleError("Invalid rentalTenure format. Please provide an array like [3, 6, 12]", 400));
       }
    }

    // Parse stock to number if it's a string
    if (typeof req.body.stock === 'string') {
       req.body.stock = Number(req.body.stock);
    }

    // Parse price to number if it's a string
    if (typeof req.body.price === 'string') {
       req.body.price = Number(req.body.price);
    }

    // Parse securityDeposit to number if it's a string
    if (typeof req.body.securityDeposit === 'string') {
       req.body.securityDeposit = Number(req.body.securityDeposit);
    }

    let images = [];
    let thumbnail = {};

    // Handle multiple file uploads
    if (req.files && req.files.length > 0) {
        console.log('Processing', req.files.length, 'files');
        for (let file of req.files) {
            console.log('Uploading file:', file.originalname, 'Size:', file.size);
            const result = await uploadToCloudinary(
                file.buffer,
                `product-${Date.now()}-${Math.random()}`
            );
            console.log('Upload result:', result.secure_url);
            images.push({
                url: result.secure_url,
                public_id: result.public_id,
            });
        }
        // First image as thumbnail
        thumbnail = {
            url: images[0].url,
            public_id: images[0].public_id,
        };
        req.body.images = images;
        req.body.thumbnail = thumbnail;
    }

    const product = await Product.create(req.body);

    res.status(201).json({
        success: true,
        message: "Product created successfully",
        product
    });
});

// Vendor - Get all their products
export const vendorGetProducts = handleAsyncError(async (req, res, next) => {
    const products = await Product.find({ vendor: req.user._id })
        .sort({ createdAt: -1 });

    res.status(200).json({
        success: true,
        count: products.length,
        products
    });
});

// Vendor - Get single product
export const vendorGetSingleProduct = handleAsyncError(async (req, res, next) => {
    const product = await Product.findById(req.params.id);

    if (!product) {
        return next(new HandleError("Product not found", 404));
    }

    // Ensure vendor owns this product
    if (product.vendor.toString() !== req.user._id.toString()) {
        return next(new HandleError("You are not authorized to view this product", 403));
    }

    res.status(200).json({
        success: true,
        product
    });
});

// Vendor - Update product
export const vendorUpdateProduct = handleAsyncError(async (req, res, next) => {
    let product = await Product.findById(req.params.id);

    if (!product) {
        return next(new HandleError("Product not found", 404));
    }

    if (product.vendor.toString() !== req.user._id.toString()) {
        return next(new HandleError("You are not authorized to update this product", 403));
    }

    // Parse rentalTenure if it's a string
    if (typeof req.body.rentalTenure === 'string') {
       try {
          req.body.rentalTenure = JSON.parse(req.body.rentalTenure);
       } catch (error) {
          return next(new HandleError("Invalid rentalTenure format. Please provide an array like [3, 6, 12]", 400));
       }
    }

    // Parse stock to number if it's a string
    if (typeof req.body.stock === 'string') {
       req.body.stock = Number(req.body.stock);
    }

    // Parse price to number if it's a string
    if (typeof req.body.price === 'string') {
       req.body.price = Number(req.body.price);
    }

    // Parse securityDeposit to number if it's a string
    if (typeof req.body.securityDeposit === 'string') {
       req.body.securityDeposit = Number(req.body.securityDeposit);
    }

    // Handle image updates
    if (req.files && req.files.length > 0) {
        // Delete old images from Cloudinary
        if (product.images && product.images.length > 0) {
            for (let image of product.images) {
                await deleteFromCloudinary(image.public_id);
            }
        }

        let images = [];
        for (let file of req.files) {
            const result = await uploadToCloudinary(
                file.buffer,
                `product-${Date.now()}-${Math.random()}`
            );
            images.push({
                url: result.secure_url,
                public_id: result.public_id,
            });
        }
        req.body.images = images;
        req.body.thumbnail = {
            url: images[0].url,
            public_id: images[0].public_id,
        };
    }

    product = await Product.findByIdAndUpdate(
        req.params.id,
        req.body,
        { new: true, runValidators: true }
    );

    res.status(200).json({
        success: true,
        message: "Product updated successfully",
        product
    });
});

// Vendor - Delete product
export const vendorDeleteProduct = handleAsyncError(async (req, res, next) => {
    const product = await Product.findById(req.params.id);

    if (!product) {
        return next(new HandleError("Product not found", 404));
    }

    if (product.vendor.toString() !== req.user._id.toString()) {
        return next(new HandleError("You are not authorized to delete this product", 403));
    }

    // Prevent deletion if product is currently rented
    if (product.availability === "Rented") {
        return next(new HandleError("Cannot delete a product that is currently rented", 400));
    }

    await Product.findByIdAndDelete(req.params.id);

    res.status(200).json({
        success: true,
        message: "Product deleted successfully"
    });
});

// Vendor - Update product availability
export const vendorUpdateAvailability = handleAsyncError(async (req, res, next) => {
    const product = await Product.findById(req.params.id);

    if (!product) {
        return next(new HandleError("Product not found", 404));
    }

    if (product.vendor.toString() !== req.user._id.toString()) {
        return next(new HandleError("You are not authorized to update this product", 403));
    }

    product.availability = req.body.availability;
    await product.save();

    res.status(200).json({
        success: true,
        message: "Product availability updated",
        product
    });
});

// ─── DELIVERY & PICKUP MANAGEMENT ─────────────────────────────────

// Vendor - Get all upcoming deliveries
export const getVendorDeliveries = handleAsyncError(async (req, res, next) => {
    const deliveries = await Rental.find({
        vendor: req.user._id,
        rentalStatus: "Active",
        deliveryDate: { $gte: new Date() }
    })
        .populate("product", "name images category")
        .populate("user", "name email")
        .sort({ deliveryDate: 1 });

    res.status(200).json({
        success: true,
        count: deliveries.length,
        deliveries
    });
});

// Vendor - Get all upcoming pickups (returns)
export const getVendorPickups = handleAsyncError(async (req, res, next) => {
    const pickups = await Rental.find({
        vendor: req.user._id,
        rentalStatus: "Returned"
    })
        .populate("product", "name images category")
        .populate("user", "name email")
        .sort({ "returnInfo.returnRequestedAt": 1 });

    res.status(200).json({
        success: true,
        count: pickups.length,
        pickups
    });
});

// Vendor - Confirm delivery
export const confirmDelivery = handleAsyncError(async (req, res, next) => {
    const rental = await Rental.findById(req.params.id);

    if (!rental) {
        return next(new HandleError("Rental not found", 404));
    }

    if (rental.vendor.toString() !== req.user._id.toString()) {
        return next(new HandleError("You are not authorized to update this rental", 403));
    }

    // Update product availability to Rented
    await Product.findByIdAndUpdate(rental.product, {
        availability: "Rented",
        $inc: { stock: -1 }
    });

    rental.rentalStartDate = Date.now();
    await rental.save();

    res.status(200).json({
        success: true,
        message: "Delivery confirmed successfully",
        rental
    });
});

// ─── MAINTENANCE REQUEST MANAGEMENT ───────────────────────────────

// Vendor - Get all maintenance requests assigned to vendor
export const getVendorMaintenanceRequests = handleAsyncError(async (req, res, next) => {
    const requests = await MaintenanceRequest.find({ vendor: req.user._id })
        .populate("product", "name images category")
        .populate("user", "name email")
        .populate("rental")
        .sort({ createdAt: -1 });

    // Group by status
    const pending = requests.filter(r => r.status === "Pending").length;
    const inProgress = requests.filter(r => r.status === "In Progress").length;
    const resolved = requests.filter(r => r.status === "Resolved").length;

    res.status(200).json({
        success: true,
        count: requests.length,
        stats: { pending, inProgress, resolved },
        requests
    });
});

// Vendor - Update maintenance request status
export const vendorUpdateMaintenanceRequest = handleAsyncError(async (req, res, next) => {
    const request = await MaintenanceRequest.findById(req.params.id);

    if (!request) {
        return next(new HandleError("Maintenance request not found", 404));
    }

    if (request.vendor.toString() !== req.user._id.toString()) {
        return next(new HandleError("You are not authorized to update this request", 403));
    }

    const { status, message, technicianName, technicianPhone, scheduledDate } = req.body;

    request.status = status || request.status;
    request.scheduledDate = scheduledDate || request.scheduledDate;

    request.vendorResponse = {
        message: message || request.vendorResponse?.message,
        respondedAt: request.vendorResponse?.respondedAt || Date.now(),
        resolvedAt: status === "Resolved" ? Date.now() : request.vendorResponse?.resolvedAt,
        technicianName: technicianName || request.vendorResponse?.technicianName,
        technicianPhone: technicianPhone || request.vendorResponse?.technicianPhone
    };

    if (status === "Resolved") {
        request.resolvedAt = Date.now();

        // Restore product availability if it was under maintenance
        await Product.findByIdAndUpdate(request.product, {
            availability: "Available"
        });
    }

    if (status === "In Progress") {
        // Mark product as under maintenance
        await Product.findByIdAndUpdate(request.product, {
            availability: "Under Maintenance"
        });
    }

    await request.save();

    res.status(200).json({
        success: true,
        message: "Maintenance request updated successfully",
        request
    });
});

// ─── VENDOR DASHBOARD ─────────────────────────────────────────────

// Vendor - Get dashboard stats
export const getVendorDashboard = handleAsyncError(async (req, res, next) => {
    const vendorId = req.user._id;

    const [
        totalProducts,
        availableProducts,
        rentedProducts,
        activeRentals,
        pendingReturns,
        maintenanceRequests,
        totalRentals
    ] = await Promise.all([
        Product.countDocuments({ vendor: vendorId }),
        Product.countDocuments({ vendor: vendorId, availability: "Available" }),
        Product.countDocuments({ vendor: vendorId, availability: "Rented" }),
        Rental.countDocuments({ vendor: vendorId, rentalStatus: "Active" }),
        Rental.countDocuments({ vendor: vendorId, rentalStatus: "Returned" }),
        MaintenanceRequest.countDocuments({ vendor: vendorId, status: { $in: ["Pending", "In Progress"] } }),
        Rental.find({ vendor: vendorId, rentalStatus: "Completed" })
    ]);

    // Calculate total revenue
    const totalRevenue = totalRentals.reduce(
        (acc, rental) => acc + rental.totalRentalPrice, 0
    );

    res.status(200).json({
        success: true,
        dashboard: {
            totalProducts,
            availableProducts,
            rentedProducts,
            activeRentals,
            pendingReturns,
            maintenanceRequests,
            totalRevenue
        }
    });
});
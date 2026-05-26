import MaintenanceRequest from "../models/maintenanceRequestModel.js";
import Rental from "../models/rentalModel.js";
import Product from "../models/productModel.js";
import handleAsyncError from "../middleware/handleAsyncError.js";
import HandleError from "../utils/handleError.js";

// ─── USER ROUTES ──────────────────────────────────────────────────

// User - Raise a maintenance request
export const createMaintenanceRequest = handleAsyncError(async (req, res, next) => {
    const { rentalId, issueType, description } = req.body;

    // Verify rental exists and belongs to user
    const rental = await Rental.findById(rentalId)
        .populate("product");

    if (!rental) {
        return next(new HandleError("Rental not found", 404));
    }

    if (rental.user.toString() !== req.user._id.toString()) {
        return next(new HandleError("You are not authorized to raise a request for this rental", 403));
    }

    if (rental.rentalStatus !== "Active") {
        return next(new HandleError("Maintenance requests can only be raised for active rentals", 400));
    }

    // Check if there's already a pending request for this rental
    const existingRequest = await MaintenanceRequest.findOne({
        rental: rentalId,
        status: { $in: ["Pending", "Acknowledged", "In Progress"] }
    });

    if (existingRequest) {
        return next(new HandleError("A maintenance request is already active for this rental", 400));
    }

    const request = await MaintenanceRequest.create({
        user: req.user._id,
        rental: rentalId,
        product: rental.product._id,
        vendor: rental.vendor,
        issueType,
        description,
        images: req.body.images || []
    });

    res.status(201).json({
        success: true,
        message: "Maintenance request raised successfully. Our team will contact you shortly.",
        request
    });
});

// User - Get all my maintenance requests
export const getMyMaintenanceRequests = handleAsyncError(async (req, res, next) => {
    const requests = await MaintenanceRequest.find({ user: req.user._id })
        .populate("product", "name images category")
        .populate("rental", "rentalStartDate rentalEndDate")
        .sort({ createdAt: -1 });

    res.status(200).json({
        success: true,
        count: requests.length,
        requests
    });
});

// User - Get single maintenance request
export const getSingleMaintenanceRequest = handleAsyncError(async (req, res, next) => {
    const request = await MaintenanceRequest.findById(req.params.id)
        .populate("product", "name images category")
        .populate("vendor", "name email")
        .populate("rental");

    if (!request) {
        return next(new HandleError("Maintenance request not found", 404));
    }

    // Only allow owner or admin to view
    if (
        request.user.toString() !== req.user._id.toString() &&
        req.user.role !== "admin"
    ) {
        return next(new HandleError("You are not authorized to view this request", 403));
    }

    res.status(200).json({
        success: true,
        request
    });
});

// User - Cancel a maintenance request
export const cancelMaintenanceRequest = handleAsyncError(async (req, res, next) => {
    const request = await MaintenanceRequest.findById(req.params.id);

    if (!request) {
        return next(new HandleError("Maintenance request not found", 404));
    }

    if (request.user.toString() !== req.user._id.toString()) {
        return next(new HandleError("You are not authorized to cancel this request", 403));
    }

    if (request.status === "Resolved" || request.status === "Closed") {
        return next(new HandleError("Cannot cancel a resolved or closed request", 400));
    }

    if (request.status === "In Progress") {
        return next(new HandleError("Cannot cancel a request that is already in progress", 400));
    }

    request.status = "Closed";
    await request.save();

    res.status(200).json({
        success: true,
        message: "Maintenance request cancelled successfully",
        request
    });
});

// ─── ADMIN ROUTES ─────────────────────────────────────────────────

// Admin - Get all maintenance requests
export const adminGetAllMaintenanceRequests = handleAsyncError(async (req, res, next) => {
    const requests = await MaintenanceRequest.find()
        .populate("product", "name images category")
        .populate("user", "name email")
        .populate("vendor", "name email")
        .populate("rental")
        .sort({ createdAt: -1 });

    // Stats
    const pending = requests.filter(r => r.status === "Pending").length;
    const inProgress = requests.filter(r => r.status === "In Progress").length;
    const resolved = requests.filter(r => r.status === "Resolved").length;
    const closed = requests.filter(r => r.status === "Closed").length;

    res.status(200).json({
        success: true,
        count: requests.length,
        stats: { pending, inProgress, resolved, closed },
        requests
    });
});

// Admin - Update maintenance request
export const adminUpdateMaintenanceRequest = handleAsyncError(async (req, res, next) => {
    const request = await MaintenanceRequest.findById(req.params.id);

    if (!request) {
        return next(new HandleError("Maintenance request not found", 404));
    }

    const { status, priority, adminNotes } = req.body;

    request.status = status || request.status;
    request.priority = priority || request.priority;
    request.adminNotes = adminNotes || request.adminNotes;

    if (status === "Resolved") {
        request.resolvedAt = Date.now();
    }

    await request.save();

    res.status(200).json({
        success: true,
        message: "Maintenance request updated successfully",
        request
    });
});

// Admin - Delete maintenance request
export const adminDeleteMaintenanceRequest = handleAsyncError(async (req, res, next) => {
    const request = await MaintenanceRequest.findById(req.params.id);

    if (!request) {
        return next(new HandleError("Maintenance request not found", 404));
    }

    await MaintenanceRequest.findByIdAndDelete(req.params.id);

    res.status(200).json({
        success: true,
        message: "Maintenance request deleted successfully"
    });
});

// Admin - Get maintenance requests by vendor
export const adminGetMaintenanceByVendor = handleAsyncError(async (req, res, next) => {
    const requests = await MaintenanceRequest.find({ vendor: req.params.vendorId })
        .populate("product", "name images")
        .populate("user", "name email")
        .sort({ createdAt: -1 });

    res.status(200).json({
        success: true,
        count: requests.length,
        requests
    });
});
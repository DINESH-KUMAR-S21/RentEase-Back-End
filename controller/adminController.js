import User from "../models/userModel.js";
import Product from "../models/productModel.js";
import Order from "../models/orderModel.js";
import Rental from "../models/rentalModel.js";
import MaintenanceRequest from "../models/maintenanceRequestModel.js";
import Location from "../models/locationModel.js";
import handleAsyncError from "../middleware/handleAsyncError.js";
import HandleError from "../utils/handleError.js";

// ─── DASHBOARD & ANALYTICS ────────────────────────────────────────

// Admin - Get dashboard stats
export const getAdminDashboard = handleAsyncError(async (req, res, next) => {
    const [
        totalUsers,
        totalVendors,
        totalProducts,
        totalOrders,
        totalRentals,
        activeRentals,
        overdueRentals,
        pendingMaintenance,
        totalLocations
    ] = await Promise.all([
        User.countDocuments({ role: "user" }),
        User.countDocuments({ role: "vendor" }),
        Product.countDocuments(),
        Order.countDocuments(),
        Rental.countDocuments(),
        Rental.countDocuments({ rentalStatus: "Active" }),
        Rental.countDocuments({ rentalStatus: "Overdue" }),
        MaintenanceRequest.countDocuments({ status: { $in: ["Pending", "In Progress"] } }),
        Location.countDocuments({ isServiceable: true })
    ]);

    // Total revenue from completed rentals
    const completedRentals = await Rental.find({ rentalStatus: "Completed" });
    const totalRevenue = completedRentals.reduce(
        (acc, rental) => acc + rental.totalRentalPrice, 0
    );

    // Revenue this month
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);
    const monthlyRentals = await Rental.find({
        rentalStatus: "Completed",
        createdAt: { $gte: startOfMonth }
    });
    const monthlyRevenue = monthlyRentals.reduce(
        (acc, rental) => acc + rental.totalRentalPrice, 0
    );

    res.status(200).json({
        success: true,
        dashboard: {
            totalUsers,
            totalVendors,
            totalProducts,
            totalOrders,
            totalRentals,
            activeRentals,
            overdueRentals,
            pendingMaintenance,
            totalLocations,
            totalRevenue,
            monthlyRevenue
        }
    });
});

// Admin - Get revenue analytics (monthly breakdown)
export const getRevenueAnalytics = handleAsyncError(async (req, res, next) => {
    const year = req.query.year || new Date().getFullYear();

    const revenueData = await Rental.aggregate([
        {
            $match: {
                rentalStatus: "Completed",
                createdAt: {
                    $gte: new Date(`${year}-01-01`),
                    $lte: new Date(`${year}-12-31`)
                }
            }
        },
        {
            $group: {
                _id: { $month: "$createdAt" },
                revenue: { $sum: "$totalRentalPrice" },
                count: { $sum: 1 }
            }
        },
        { $sort: { _id: 1 } }
    ]);

    // Fill missing months with 0
    const months = Array.from({ length: 12 }, (_, i) => {
        const found = revenueData.find(r => r._id === i + 1);
        return {
            month: i + 1,
            revenue: found ? found.revenue : 0,
            count: found ? found.count : 0
        };
    });

    res.status(200).json({
        success: true,
        year,
        analytics: months
    });
});

// Admin - Get category wise analytics
export const getCategoryAnalytics = handleAsyncError(async (req, res, next) => {
    const categoryData = await Product.aggregate([
        {
            $group: {
                _id: "$category",
                totalProducts: { $sum: 1 },
                availableProducts: {
                    $sum: { $cond: [{ $eq: ["$availability", "Available"] }, 1, 0] }
                },
                rentedProducts: {
                    $sum: { $cond: [{ $eq: ["$availability", "Rented"] }, 1, 0] }
                }
            }
        },
        { $sort: { totalProducts: -1 } }
    ]);

    res.status(200).json({
        success: true,
        analytics: categoryData
    });
});

// Admin - Get rental trend analytics
export const getRentalTrends = handleAsyncError(async (req, res, next) => {
    const last6Months = new Date();
    last6Months.setMonth(last6Months.getMonth() - 6);

    const trends = await Rental.aggregate([
        {
            $match: {
                createdAt: { $gte: last6Months }
            }
        },
        {
            $group: {
                _id: {
                    month: { $month: "$createdAt" },
                    year: { $year: "$createdAt" }
                },
                totalRentals: { $sum: 1 },
                activeRentals: {
                    $sum: { $cond: [{ $eq: ["$rentalStatus", "Active"] }, 1, 0] }
                },
                completedRentals: {
                    $sum: { $cond: [{ $eq: ["$rentalStatus", "Completed"] }, 1, 0] }
                }
            }
        },
        { $sort: { "_id.year": 1, "_id.month": 1 } }
    ]);

    res.status(200).json({
        success: true,
        trends
    });
});

// ─── USER MANAGEMENT ──────────────────────────────────────────────

// Admin - Get all users
export const adminGetAllUsers = handleAsyncError(async (req, res, next) => {
    const users = await User.find({ role: "user" }).sort({ createdAt: -1 });

    res.status(200).json({
        success: true,
        count: users.length,
        users
    });
});

// Admin - Get all vendors
export const adminGetAllVendors = handleAsyncError(async (req, res, next) => {
    const vendors = await User.find({ role: "vendor" }).sort({ createdAt: -1 });

    res.status(200).json({
        success: true,
        count: vendors.length,
        vendors
    });
});

// Admin - Get single user
export const adminGetSingleUser = handleAsyncError(async (req, res, next) => {
    const user = await User.findById(req.params.id);

    if (!user) {
        return next(new HandleError(`User not found with id: ${req.params.id}`, 404));
    }

    res.status(200).json({
        success: true,
        user
    });
});

// Admin - Update user role
export const adminUpdateUserRole = handleAsyncError(async (req, res, next) => {
    const user = await User.findById(req.params.id);

    if (!user) {
        return next(new HandleError(`User not found with id: ${req.params.id}`, 404));
    }

    user.role = req.body.role;
    await user.save();

    res.status(200).json({
        success: true,
        message: `User role updated to ${req.body.role}`,
        user
    });
});

// Admin - Delete user
export const adminDeleteUser = handleAsyncError(async (req, res, next) => {
    const user = await User.findById(req.params.id);

    if (!user) {
        return next(new HandleError(`User not found with id: ${req.params.id}`, 404));
    }

    await User.findByIdAndDelete(req.params.id);

    res.status(200).json({
        success: true,
        message: "User deleted successfully"
    });
});

// ─── LOCATION MANAGEMENT ──────────────────────────────────────────

// Admin - Create location
export const createLocation = handleAsyncError(async (req, res, next) => {
    const location = await Location.create(req.body);

    res.status(201).json({
        success: true,
        message: "Location added successfully",
        location
    });
});

// Admin - Get all locations
export const getAllLocations = handleAsyncError(async (req, res, next) => {
    const locations = await Location.find().sort({ city: 1 });

    res.status(200).json({
        success: true,
        count: locations.length,
        locations
    });
});

// Public - Get all serviceable locations
export const getServiceableLocations = handleAsyncError(async (req, res, next) => {
    const locations = await Location.find({ isServiceable: true })
        .select("city state pincodes deliveryCharges estimatedDeliveryDays")
        .sort({ city: 1 });

    res.status(200).json({
        success: true,
        count: locations.length,
        locations
    });
});

// Admin - Update location
export const updateLocation = handleAsyncError(async (req, res, next) => {
    let location = await Location.findById(req.params.id);

    if (!location) {
        return next(new HandleError("Location not found", 404));
    }

    location = await Location.findByIdAndUpdate(
        req.params.id,
        req.body,
        { new: true, runValidators: true }
    );

    res.status(200).json({
        success: true,
        message: "Location updated successfully",
        location
    });
});

// Admin - Delete location
export const deleteLocation = handleAsyncError(async (req, res, next) => {
    const location = await Location.findById(req.params.id);

    if (!location) {
        return next(new HandleError("Location not found", 404));
    }

    await Location.findByIdAndDelete(req.params.id);

    res.status(200).json({
        success: true,
        message: "Location deleted successfully"
    });
});

// ─── DISPUTE MANAGEMENT ───────────────────────────────────────────

// Admin - Get all disputed rentals (damaged/lost)
export const getDisputedRentals = handleAsyncError(async (req, res, next) => {
    const disputes = await Rental.find({
        "returnInfo.condition": { $in: ["Damaged", "Lost"] }
    })
        .populate("product", "name images category price")
        .populate("user", "name email")
        .populate("vendor", "name email")
        .sort({ "returnInfo.returnedAt": -1 });

    res.status(200).json({
        success: true,
        count: disputes.length,
        disputes
    });
});

// Admin - Resolve dispute
export const resolveDispute = handleAsyncError(async (req, res, next) => {
    const rental = await Rental.findById(req.params.id);

    if (!rental) {
        return next(new HandleError("Rental not found", 404));
    }

    const { damageCharges, securityDepositStatus, notes } = req.body;

    rental.returnInfo.damageCharges = damageCharges || rental.returnInfo.damageCharges;
    rental.returnInfo.notes = notes || rental.returnInfo.notes;
    rental.securityDepositStatus = securityDepositStatus || rental.securityDepositStatus;
    rental.rentalStatus = "Completed";

    await rental.save();

    res.status(200).json({
        success: true,
        message: "Dispute resolved successfully",
        rental
    });
});

// ─── REPORTS ──────────────────────────────────────────────────────

// Admin - Generate full report
export const generateReport = handleAsyncError(async (req, res, next) => {
    const { startDate, endDate } = req.query;

    const dateFilter = {};
    if (startDate) dateFilter.$gte = new Date(startDate);
    if (endDate) dateFilter.$lte = new Date(endDate);

    const filter = Object.keys(dateFilter).length ? { createdAt: dateFilter } : {};

    const [orders, rentals, users, maintenanceRequests] = await Promise.all([
        Order.find(filter).populate("user", "name email"),
        Rental.find(filter)
            .populate("product", "name category")
            .populate("user", "name email"),
        User.find(filter),
        MaintenanceRequest.find(filter)
    ]);

    // Revenue breakdown
    const totalRevenue = rentals.reduce((acc, r) => acc + r.totalRentalPrice, 0);
    const totalSecurityDeposit = rentals.reduce((acc, r) => acc + r.securityDeposit, 0);
    const forfeitedDeposits = rentals
        .filter(r => r.securityDepositStatus === "Forfeited")
        .reduce((acc, r) => acc + r.securityDeposit, 0);

    // Category breakdown
    const categoryBreakdown = rentals.reduce((acc, rental) => {
        const category = rental.product?.category || "Unknown";
        acc[category] = (acc[category] || 0) + 1;
        return acc;
    }, {});

    res.status(200).json({
        success: true,
        report: {
            period: {
                startDate: startDate || "All time",
                endDate: endDate || "Present"
            },
            summary: {
                totalOrders: orders.length,
                totalRentals: rentals.length,
                totalUsers: users.length,
                totalMaintenanceRequests: maintenanceRequests.length
            },
            revenue: {
                totalRevenue,
                totalSecurityDeposit,
                forfeitedDeposits,
                netRevenue: totalRevenue + forfeitedDeposits
            },
            categoryBreakdown,
            rentals,
            orders
        }
    });
});
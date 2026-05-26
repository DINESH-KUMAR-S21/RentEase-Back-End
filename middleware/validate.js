import HandleError from "../utils/handleError.js";
import validator from "validator";

// Validate register input
export const validateRegister = (req, res, next) => {
    const { name, email, password } = req.body;

    if (!name || name.trim().length === 0) {
        return next(new HandleError("Please enter your name", 400));
    }

    if (name.trim().length > 25) {
        return next(new HandleError("Name cannot exceed 25 characters", 400));
    }

    if (!email || !validator.isEmail(email)) {
        return next(new HandleError("Please enter a valid email address", 400));
    }

    if (!password || password.length < 8) {
        return next(new HandleError("Password must be at least 8 characters", 400));
    }

    next();
};

// Validate login input
export const validateLogin = (req, res, next) => {
    const { email, password } = req.body;

    if (!email || !validator.isEmail(email)) {
        return next(new HandleError("Please enter a valid email address", 400));
    }

    if (!password) {
        return next(new HandleError("Please enter your password", 400));
    }

    next();
};

// Validate product input
export const validateProduct = (req, res, next) => {
    const { name, description, price, securityDeposit, category, stock } = req.body;

    if (!name || name.trim().length === 0) {
        return next(new HandleError("Please enter product name", 400));
    }

    if (!description || description.trim().length === 0) {
        return next(new HandleError("Please enter product description", 400));
    }

    if (!price || isNaN(price) || price <= 0) {
        return next(new HandleError("Please enter a valid rental price", 400));
    }

    if (securityDeposit === undefined || isNaN(securityDeposit) || securityDeposit < 0) {
        return next(new HandleError("Please enter a valid security deposit amount", 400));
    }

    if (!category) {
        return next(new HandleError("Please select a product category", 400));
    }

    if (!stock || isNaN(stock) || stock < 0) {
        return next(new HandleError("Please enter valid stock quantity", 400));
    }

    next();
};

// Validate order input
export const validateOrder = (req, res, next) => {
    const {
        shippingInfo, orderItems, paymentInfo,
        rentalTenure, rentalStartDate, deliveryDate
    } = req.body;

    if (!shippingInfo) {
        return next(new HandleError("Please provide shipping information", 400));
    }

    if (!shippingInfo.address || !shippingInfo.city ||
        !shippingInfo.state || !shippingInfo.pincode || !shippingInfo.phoneNo) {
        return next(new HandleError("Please provide complete shipping information", 400));
    }

    if (!orderItems || orderItems.length === 0) {
        return next(new HandleError("Please add items to your order", 400));
    }

    if (!rentalTenure || ![3, 6, 12].includes(Number(rentalTenure))) {
        return next(new HandleError("Please select a valid rental tenure (3, 6 or 12 months)", 400));
    }

    if (!rentalStartDate) {
        return next(new HandleError("Please provide rental start date", 400));
    }

    if (!deliveryDate) {
        return next(new HandleError("Please provide delivery date", 400));
    }

    if (!paymentInfo || !paymentInfo.id || !paymentInfo.status) {
        return next(new HandleError("Please provide payment information", 400));
    }

    next();
};

// Validate maintenance request input
export const validateMaintenanceRequest = (req, res, next) => {
    const { rentalId, issueType, description } = req.body;

    if (!rentalId) {
        return next(new HandleError("Please provide rental id", 400));
    }

    if (!issueType) {
        return next(new HandleError("Please select an issue type", 400));
    }

    if (!description || description.trim().length === 0) {
        return next(new HandleError("Please describe the issue", 400));
    }

    if (description.trim().length > 500) {
        return next(new HandleError("Description cannot exceed 500 characters", 400));
    }

    next();
};
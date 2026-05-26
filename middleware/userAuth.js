import handleAsyncError from "./handleAsyncError.js";
import jwt from "jsonwebtoken";
import User from "../models/userModel.js";
import HandleError from "../utils/handleError.js";


export const verifyUserAuth = handleAsyncError(async (req, res, next) => {

    
    const { token } = req.cookies;

    if (!token) {
        return next(new HandleError("Authentication is missing, Login again", 401));
    }

    try {
        const decodedData = jwt.verify(token, process.env.JWT_SECRET_KEY);
        req.user = await User.findById(decodedData.id);

        if (!req.user) {
            return next(new HandleError("User not found", 401));
        }

        return next();
    } catch (error) {
        res.clearCookie("token");
        return next(new HandleError("Invalid or expired token, login again", 401));
    }
});

export const roleBasedAccess = (...roles) => {
    return (req, res, next) => {
        if (!roles.includes(req.user.role)) {
            return next(new HandleError(`Access denied for role: ${req.user.role}`, 403));
        }
       next();
    };
 
}
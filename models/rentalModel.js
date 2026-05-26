import mongoose from 'mongoose';

const rentalSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.ObjectId,
        ref: "User",
        required: true
    },

    order: {
        type: mongoose.Schema.ObjectId,
        ref: "Order",
        required: true
    },

    product: {
        type: mongoose.Schema.ObjectId,
        ref: "Product",
        required: true
    },

    vendor: {
        type: mongoose.Schema.ObjectId,
        ref: "User",
        required: true
    },

    // Rental period
    rentalTenure: {
        type: Number,       // in months
        required: true
    },

    rentalStartDate: {
        type: Date,
        required: true
    },

    rentalEndDate: {
        type: Date,
        required: true
    },

    deliveryDate: {
        type: Date,
        required: true
    },

    // Pricing
    monthlyPrice: {
        type: Number,
        required: true
    },

    totalRentalPrice: {
        type: Number,
        required: true
    },

    securityDeposit: {
        type: Number,
        required: true,
        default: 0
    },

    // Rental status
    rentalStatus: {
        type: String,
        enum: ["Active", "Completed", "Overdue", "Returned", "Cancelled"],
        default: "Active"
    },

    // Security deposit status
    securityDepositStatus: {
        type: String,
        enum: ["Held", "Refunded", "Forfeited"],
        default: "Held"
    },

    // Extension history
    extensions: [
        {
            extendedOn: Date,
            additionalMonths: Number,
            newEndDate: Date,
            additionalCharge: Number
        }
    ],

    // Return details
    returnInfo: {
        returnRequestedAt: Date,
        returnedAt: Date,
        pickedUpBy: {
            type: mongoose.Schema.ObjectId,
            ref: "User"
        },
        condition: {
            type: String,
            enum: ["Good", "Damaged", "Lost"]
        },
        damageCharges: {
            type: Number,
            default: 0
        },
        notes: String
    },

    // Shipping info snapshot
    shippingInfo: {
        address: { type: String, required: true },
        city: { type: String, required: true },
        state: { type: String, required: true },
        country: { type: String, required: true },
        pincode: { type: Number, required: true },
        phoneNo: { type: Number, required: true }
    }

}, { timestamps: true });

export default mongoose.model('Rental', rentalSchema);
import mongoose from 'mongoose';

const maintenanceRequestSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.ObjectId,
        ref: "User",
        required: true
    },

    rental: {
        type: mongoose.Schema.ObjectId,
        ref: "Rental",
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

    // Request details
    issueType: {
        type: String,
        enum: [
            "Not Working",
            "Physical Damage",
            "Missing Parts",
            "Installation Issue",
            "Other"
        ],
        required: [true, 'Please select an issue type']
    },

    description: {
        type: String,
        required: [true, 'Please describe the issue'],
        maxLength: [500, 'Description cannot exceed 500 characters']
    },

    images: [
        {
            public_id: { type: String, required: true },
            url: { type: String, required: true }
        }
    ],

    // Request status
    status: {
        type: String,
        enum: [
            "Pending",
            "Acknowledged",
            "In Progress",
            "Resolved",
            "Closed"
        ],
        default: "Pending"
    },

    priority: {
        type: String,
        enum: ["Low", "Medium", "High"],
        default: "Medium"
    },

    // Vendor response
    vendorResponse: {
        message: String,
        respondedAt: Date,
        resolvedAt: Date,
        technicianName: String,
        technicianPhone: String
    },

    // Admin notes
    adminNotes: String,

    // Scheduled visit date
    scheduledDate: Date,

    resolvedAt: Date

}, { timestamps: true });

export default mongoose.model('MaintenanceRequest', maintenanceRequestSchema);
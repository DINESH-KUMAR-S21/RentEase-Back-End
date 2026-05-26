import mongoose from 'mongoose';

const locationSchema = new mongoose.Schema({
    city: {
        type: String,
        required: [true, 'Please enter city name'],
        trim: true,
        unique: true
    },

    state: {
        type: String,
        required: [true, 'Please enter state name'],
        trim: true
    },

    country: {
        type: String,
        required: [true, 'Please enter country name'],
        default: "India"
    },

    pincodes: {
        type: [Number],
        required: [true, 'Please enter serviceable pincodes']
    },

    isServiceable: {
        type: Boolean,
        default: true
    },

    // Delivery settings for this location
    deliveryCharges: {
        type: Number,
        default: 0
    },

    estimatedDeliveryDays: {
        type: Number,
        default: 3
    },

    // Vendors operating in this location
    vendors: [
        {
            type: mongoose.Schema.ObjectId,
            ref: "User"
        }
    ]

}, { timestamps: true });

export default mongoose.model('Location', locationSchema);
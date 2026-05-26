import mongoose from 'mongoose';

const cartSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.ObjectId,
        ref: "User",
        required: true
    },

    cartItems: [
        {
            product: {
                type: mongoose.Schema.ObjectId,
                ref: "Product",
                required: true
            },
            name: {
                type: String,
                required: true
            },
            image: {
                type: String,
                required: true
            },
            price: {
                type: Number,   // monthly rental price
                required: true
            },
            securityDeposit: {
                type: Number,
                required: true,
                default: 0
            },
            rentalTenure: {
                type: Number,   // selected tenure in months
                required: true
            },
            quantity: {
                type: Number,
                required: true,
                default: 1
            }
        }
    ],

    // Total calculated price
    totalPrice: {
        type: Number,
        default: 0
    },

    totalSecurityDeposit: {
        type: Number,
        default: 0
    }

}, { timestamps: true });

export default mongoose.model('Cart', cartSchema);
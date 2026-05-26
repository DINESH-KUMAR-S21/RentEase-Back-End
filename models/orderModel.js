import mongoose from "mongoose";

const orderSchema = new mongoose.Schema({
    shippingInfo:{
        address:{
            type:String,
            required:true
        },

        state:{
            type:String,
            required:true
        },
        city: {             // ✅ added city
            type: String,
            required: true
        },

        country:{
            type:String,
            required:true
        },

        pincode:{
            type:Number,
            required:true
        },

        phoneNo:{
            type:Number,
            required:true
        }
    },

    orderItems:[
        {
            name:{
                type:String,
                required:true
            },
            price:{
                type:Number,
                required:true
            },
            quantity:{
                type:Number,
                required:true
            },
            image:{
                type:String,
                required:true
            },
            product:{
                type:mongoose.Schema.ObjectId,
                ref:"Product",
                required:true
            }

        }
    ],

    user:{
        type:mongoose.Schema.ObjectId,
        ref:"User",
        required:true
    },

    paymentInfo:{
        id:{
            type:String,
            required:true
        },
        status:{
            type:String,
            required:true
        }
    },
    paidAt:{
        type:Date,
        required:true
    },

    itemsPrice:{
        type:Number,
        required:true
    },

    shippingPrice:{ 
        type:Number,
        required:true
    },

    totalPrice:{
        type:Number,
        required:true
    },

    taxPrice:{
        type:Number,
        required:true
    },

    deliveredAt:Date,

    createdAt:{
        type:Date,
        default:Date.now
    },
     // ✅ Rental specific fields
    rentalTenure: {
        type: Number,           // in months e.g. 3, 6, 12
        required: [true, 'Please select a rental tenure'],
    },

    rentalStartDate: {
        type: Date,
        required: true
    },

    rentalEndDate: {
        type: Date,             // auto-calculated: startDate + rentalTenure months
        required: true
    },
    // Add this after rentalEndDate
    deliveryDate: {
        type: Date,
        required: true
    },
    // ✅ Order status
    orderStatus: {
        type: String,
        enum: ["Processing", "Shipped", "Delivered", "Cancelled"],
        default: "Processing"
    },

    // ✅ Rental status (separate from order status)
    rentalStatus: {
        type: String,
        enum: ["Active", "Completed", "Overdue", "Returned"],
        default: "Active"
    },

    // ✅ Return info when product is returned
    returnInfo: {
        returnedAt: Date,
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

    securityDeposit: {
        type: Number,
        required: true,
        default: 0
    },

    securityDepositStatus: {
        type: String,
        enum: ["Held", "Refunded", "Forfeited"],
        default: "Held"
    },

});



export default mongoose.model("Order",orderSchema)
import mongoose from 'mongoose';

const productSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Please enter product name'],
        trim:true
    },

    description:{
         type: String,
        required: [true, 'Please enter product description']
    },

    price: {
        type: Number,
        required: [true, 'Please enter product price'],
        maxLength: [8, 'Price cannot exceed 8 characters']
    },

    ratings: {
        type: Number,
        default: 0
    },

        // ✅ Availability status
    availability: {
        type: String,
        enum: ["Available", "Rented", "Under Maintenance", "Unavailable"],
        default: "Available"
    },
     // ✅ Security deposit amount
    securityDeposit: {
        type: Number,
        required: [true, 'Please enter security deposit amount'],
        default: 0
    },

    // ✅ Available rental tenures in months e.g. [3, 6, 12]
    rentalTenure: {
        type: [Number],
        required: [true, 'Please enter available rental tenure options'],
        default: [3, 6, 12]
    },


   // Add these fields to your product schema:
images: [
  {
    url: {
      type: String,
    },
    public_id: {
      type: String,
    },
  },
],
thumbnail: {
  url: String,
  public_id: String,
},

    category: {
    type: String,
    required: [true, 'Please enter product category'],
    enum: [
        "Bed", "Sofa", "Table", "Chair", "Wardrobe", "Bookshelf",
        "Refrigerator", "Washing Machine", "TV", "Air Conditioner",
        "Microwave", "Water Purifier", "Other"
    ]
},

    stock:{
        type: Number,
        required: [true, 'Please enter product stock'],
        maxLength: [5, 'Stock cannot exceed 5 characters'],
        default: 1
     },

     numberOfReviews:{
        type: Number,
        default: 0
     },
     reviews:[
       
        {
             user:{
            type:mongoose.Schema.ObjectId,
            ref:"User",
            required: true
        },
            name:{
                type: String,
                required: true
            },
            rating:{
                type: Number,
                required: true
            },
            comment:{
                type: String,
                required: true
            }
        }
    ],
      // ✅ Vendor who owns this product
    vendor: {
        type: mongoose.Schema.ObjectId,
        ref: "User",
        required: true
    },

        user:{
            type: mongoose.Schema.ObjectId,
            ref:"User",
            required: true
        },


    createdAt:{
        type: Date,
        default: Date.now
    }
    
})

export default mongoose.model('Product', productSchema);
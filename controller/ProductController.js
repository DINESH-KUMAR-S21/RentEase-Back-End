import product from '../models/productModel.js';
import HandleError from "../utils/handleError.js";
import handleAsyncError from '../middleware/handleAsyncError.js';
import APIFunctionality from '../utils/apiFunctionality.js';
import { uploadToCloudinary, deleteFromCloudinary } from '../utils/imageUpload.js';


//creating product
export const createProduct = handleAsyncError(async (req, res, next) => {
   req.body.user = req.user.id;
   let images = [];
   let thumbnail = {};

   // Parse rentalTenure if it's a string
   if (typeof req.body.rentalTenure === 'string') {
      try {
         req.body.rentalTenure = JSON.parse(req.body.rentalTenure);
      } catch (error) {
         return next(new HandleError("Invalid rentalTenure format. Please provide an array like [3, 6, 12]", 400));
      }
   }

   // Parse stock to number if it's a string
   if (typeof req.body.stock === 'string') {
      req.body.stock = Number(req.body.stock);
   }

   // Parse price to number if it's a string
   if (typeof req.body.price === 'string') {
      req.body.price = Number(req.body.price);
   }

   // Parse securityDeposit to number if it's a string
   if (typeof req.body.securityDeposit === 'string') {
      req.body.securityDeposit = Number(req.body.securityDeposit);
   }

   // Handle multiple file uploads
   if (req.files && req.files.length > 0) {
      for (let file of req.files) {
         const result = await uploadToCloudinary(
            file.buffer,
            `product-${Date.now()}-${Math.random()}`
         );
         images.push({
            url: result.secure_url,
            public_id: result.public_id,
         });
      }
      // First image as thumbnail
      thumbnail = {
         url: images[0].url,
         public_id: images[0].public_id,
      };
      req.body.images = images;
      req.body.thumbnail = thumbnail;
   }

   const createdProduct = await product.create(req.body);
   res.status(201).json({
    success: true,
    product: createdProduct
   })
});

//get all product
export const getAllProducts =handleAsyncError(async (req, res, next) => {
    // Check if random products are requested
    if (req.query.random === 'true') {
        const limit = Number(req.query.limit) || 4;
        
        // Debug logs
        console.log('🔍 Fetching random products with limit:', limit);
        const totalCount = await product.countDocuments();
        console.log('📊 Total products in DB:', totalCount);
        
        const products = await product.aggregate([
            { $sample: { size: limit } }
        ]);

        console.log('✅ Aggregation result:', products.length, 'products found');

                if(!products || products.length === 0){
                        console.log('⚠️ No products returned from aggregation');
                        return res.status(200).json({
                            success: true,
                            products: [],
                            totalProducts: totalCount,
                            resultPerPage: limit,
                            totalPages: Math.ceil(totalCount / limit) || 0,
                            currentPage: 1
                        })
                }

                res.status(200).json({
                    success: true,
                    products
                })
        return;
    }

    // Normal pagination
    const resultPerPage = Number(req.query.limit) || 12;
    const apiFeatures =  new APIFunctionality(product.find(), req.query).search().filter().pagination(resultPerPage);
  
    const filteredQuery = apiFeatures.query.clone();
    const productCount = await filteredQuery.countDocuments();
    
    const totalPages = Math.ceil(productCount / resultPerPage);
    const page = Number(req.query.page) || 1;
    
    if(page > totalPages && productCount > 0){
        return next(new HandleError("Invalid page number", 400))
    }

    //paggination
    apiFeatures.pagination(resultPerPage);
    const products = await apiFeatures.query;

        if(!products || products.length === 0){
                return res.status(200).json({
                    success: true,
                    products: [],
                    totalProducts: productCount,
                    resultPerPage,
                    totalPages,
                    currentPage: page
                })
        }
        res.status(200).json({
            success: true,
            products,
            totalProducts: productCount,
            resultPerPage,
            totalPages,
            currentPage: page
        })
    
});

//update product
export const updateProduct = handleAsyncError(async(req, res, next) => {
    let update = await product.findById(req.params.id)
    if(!update){
        return next(new HandleError("product not found", 500))
    }

    // Parse rentalTenure if it's a string
    if (typeof req.body.rentalTenure === 'string') {
       try {
          req.body.rentalTenure = JSON.parse(req.body.rentalTenure);
       } catch (error) {
          return next(new HandleError("Invalid rentalTenure format. Please provide an array like [3, 6, 12]", 400));
       }
    }

    // Parse stock to number if it's a string
    if (typeof req.body.stock === 'string') {
       req.body.stock = Number(req.body.stock);
    }

    // Parse price to number if it's a string
    if (typeof req.body.price === 'string') {
       req.body.price = Number(req.body.price);
    }

    // Parse securityDeposit to number if it's a string
    if (typeof req.body.securityDeposit === 'string') {
       req.body.securityDeposit = Number(req.body.securityDeposit);
    }

    // Handle image updates
    if (req.files && req.files.length > 0) {
       // Delete old images from Cloudinary
       if (update.images && update.images.length > 0) {
          for (let image of update.images) {
             await deleteFromCloudinary(image.public_id);
          }
       }

       let images = [];
       for (let file of req.files) {
          const result = await uploadToCloudinary(
             file.buffer,
             `product-${Date.now()}-${Math.random()}`
          );
          images.push({
             url: result.secure_url,
             public_id: result.public_id,
          });
       }
       req.body.images = images;
       req.body.thumbnail = {
          url: images[0].url,
          public_id: images[0].public_id,
       };
    }

    update = await product.findByIdAndUpdate(req.params.id, req.body, {
        new: true,
        runValidators: true,
        useFindAndModify: false
    })

    res.status(200).json({
        success: true,
        update
    })
   

  
});

//Delete product

export const deleteProduct = handleAsyncError(async(req, res, next) => {
    const deleteProduct = await product.findById(req.params.id)
    if(!deleteProduct){
        return next(new HandleError("product not found", 404))
    }

    // Delete images from Cloudinary
    if (deleteProduct.images && deleteProduct.images.length > 0) {
       for (let image of deleteProduct.images) {
          await deleteFromCloudinary(image.public_id);
       }
    }

    await product.findByIdAndDelete(req.params.id)

    res.status(200).json({
        success: true,
        message: "product deleted successfully"
    })

//get single product
    

})


export const getSingleproduct = handleAsyncError(async(req, res, next) =>{
    const singleProduct = await product.findById(req.params.id)
    if(!singleProduct){
        return next(new HandleError("product not found", 404))
    }
    res.status(200).json({
        success: true,
        product: singleProduct
    })

})


//creating and updating review
export const createReviewForProduct = handleAsyncError(async (req, res, next) => {
        const {rating,comment,productId} = req.body || {};

        if (!rating || !comment || !productId) {
            return next(new HandleError("Please provide rating, comment and productId", 400));
        }

        const review ={
            user: req.user._id,
            name: req.user.name,
            rating:Number(rating),
            comment
        }

        const foundProduct = await product.findById(productId);

        if (!foundProduct) {
            return next(new HandleError("Product not found", 404));
        }

        const reviewExists = foundProduct.reviews.find((rev) => rev.user.toString() === req.user._id.toString());

        if(reviewExists){
            foundProduct.reviews.forEach((rev) => {
                if(rev.user.toString() === req.user._id.toString()){
                    rev.rating = rating;
                    rev.comment = comment;
                }
            });
        }else{
            foundProduct.reviews.push(review);
            foundProduct.numberOfReviews = foundProduct.reviews.length;
        }

        // Calculate average rating
        let avg = 0;
        foundProduct.reviews.forEach((rev) => {
            avg += rev.rating;
        });
        foundProduct.ratings = foundProduct.reviews.length > 0 ? avg / foundProduct.reviews.length : 0;

        await foundProduct.save({validateBeforeSave:false});

        res.status(200).json({
            success:true,
            message: "Review added/updated successfully",
            product
        })
})


//Getting review
export const getProductReviews = handleAsyncError(async (req, res, next) => {
    const getproduct = await product.findById(req.query.productId)
    if(!getproduct){
        return next(new HandleError("Product not found", 400))
    }

    res.status(200).json({
        success: true,
        reviews: getproduct.reviews
    })
})

//Deleting review
export const deleteReview = handleAsyncError(async (req, res, next) => {
    const deleteProduct = await product.findById(req.query.productId)
    
    if(!deleteProduct){
        return next(new HandleError("Product not found", 400))
    }

    const reviewId = req.query.reviewId || req.query.id;
    if(!reviewId){
        return next(new HandleError("Review id is required", 400))
    }

    const reviews = deleteProduct.reviews.filter(review => review._id.toString() !== reviewId.toString());


    if(reviews.length === deleteProduct.reviews.length){
        return next(new HandleError("Review not found for this product", 404))
    }

    deleteProduct.reviews = reviews;
    deleteProduct.numberOfReviews = reviews.length;

    let avg = 0;
    deleteProduct.reviews.forEach((rev) => {
        avg += rev.rating;
    });
    deleteProduct.ratings = deleteProduct.reviews.length > 0 ? avg / deleteProduct.reviews.length : 0;

    await deleteProduct.save();

    res.status(200).json({
        success: true,
        message: "Review deleted successfully",
        reviews: deleteProduct.reviews
    })

})

//Admin getting all products
export const getAdminProducts = handleAsyncError(async (req, res, next) => {
    const products = await product.find();
    res.status(200).json({
        success:true,
        products
    })

})


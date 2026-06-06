import express from 'express';
import { createProduct, getAllProducts, updateProduct, deleteProduct, getSingleproduct, createReviewForProduct, getAdminProducts, getProductReviews, deleteReview } from '../controller/ProductController.js';
import { roleBasedAccess, verifyUserAuth } from '../middleware/userAuth.js';
import upload from '../middleware/multer.js';



const router = express.Router();    

router.route('/products').get(getAllProducts);

router.route('/admin/products').get(verifyUserAuth, roleBasedAccess("admin"), getAdminProducts);

router.route('/admin/product/create').post(verifyUserAuth, roleBasedAccess("admin"), upload.array('images', 5), createProduct);

router.route("/admin/product/:id")
  .put(verifyUserAuth, roleBasedAccess("admin"), upload.array('images', 5), updateProduct)
  .delete(verifyUserAuth, roleBasedAccess("admin"), deleteProduct);

router.route("/product/:id").get(getSingleproduct);

router.route("/review").put(verifyUserAuth, createReviewForProduct);

router.route("/reviews")
  .get(getProductReviews)
  .delete(verifyUserAuth, deleteReview);



export default router;
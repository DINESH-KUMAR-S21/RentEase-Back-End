import express from 'express';
import {registerUser , loginUser, logout, requestPasswordReset, resetPassword, updatePassword, updateProfile, getUsersList, getSingleUser, updateUserRole, deleteUser} from '../controller/userController.js';
import { getUserDetails } from '../controller/userController.js';
import { createReviewForProduct } from '../controller/ProductController.js';
import { roleBasedAccess, verifyUserAuth } from '../middleware/userAuth.js';
import { validateRegister, validateLogin } from '../middleware/validate.js';

const router = express.Router();

router.route("/register").post(validateRegister,registerUser);
router.route("/login").post(validateLogin,loginUser);
router.route("/logout").post(logout);
router.route("/password/forgot").post(requestPasswordReset);
router.route("/reset/:token").post(resetPassword);
router.route("/profile").post(verifyUserAuth, getUserDetails);
router.route("/me").get(verifyUserAuth, getUserDetails);
router.route("/password/update").post(verifyUserAuth, updatePassword);
router.route("/profile/update").post(verifyUserAuth, updateProfile);
router.route("/admin/users").get(verifyUserAuth, roleBasedAccess("admin"), getUsersList);
router.route("/admin/user/:id")
  .get(verifyUserAuth, roleBasedAccess("admin"), getSingleUser)
  .put(verifyUserAuth, roleBasedAccess("admin"), updateUserRole)
  .delete(verifyUserAuth, roleBasedAccess("admin"), deleteUser);

export default router;
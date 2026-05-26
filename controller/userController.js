import bcrypt from 'bcryptjs';
import User from '../models/userModel.js';
import handleAsyncError from '../middleware/handleAsyncError.js';
import HandleError from '../utils/handleError.js';
import { sendToken } from '../utils/jwtTokens.js';
import { sendEmail } from '../utils/sendEmail.js';
import crypto from 'crypto';

//create user
export const registerUser = handleAsyncError( async (req, res) => {
    const {name,email,password} = req.body;
    const newUser = await User.create({
        name,
        email,
        password,
        avatar:{
            public_id: "this is a temp id",
            url: "this is temp Url"
        }
    })

    const token = newUser.getJwtToken();

    res.status(201).json({
        success: true,
        user: newUser,
        token  
    })
    
})


//login 
export const loginUser = handleAsyncError( async (req, res, next) => {
    const {email,password} = req.body;

    if(!email || password === undefined || password === null || password === ''){
        return res.status(400).json({
            success: false,
            message: "Please enter email and password"
        })
    }

    const user = await User.findOne({email}).select("+password");

    if(!user){
        return next(new HandleError("Invalid email or password", 401));
    }

    const passwordToCompare = typeof password === 'string' ? password : String(password);
    const isPasswordMatched = await bcrypt.compare(passwordToCompare, user.password);
    if(!isPasswordMatched){
        return next(new HandleError("Invalid email or password", 401));
    }

    user.password = undefined;

    // jwt token creation is being handled in jwtTokens.js
    return sendToken(user, 200, res);
})

//Logout

export const logout = handleAsyncError(async (req, res, next) => {
    res.clearCookie('token');
    res.status(200).json({
        success: true,
        message: "Successfully logged out"
    });
});

//Forgot password

export const requestPasswordReset = handleAsyncError(async (req, res, next) => {
    const { email } = req.body || {};

    if (!email) {
        return next(new HandleError("Please provide an email address", 400));
    }

    const user = await User.findOne({ email });
    if (!user) {
        return next(new HandleError("User not found with this email", 404));
    }

    const resetToken = user.generatePasswordResetToken();

    await User.findByIdAndUpdate(
        user._id,
        {
            resetPasswordToken: user.resetPasswordToken,
            resetPasswordExpire: user.resetPasswordExpire,
        },
        { returnDocument: 'after', runValidators: false }
    );

    const resetPasswordURL = `http://localhost:8000/api/v1/reset/${resetToken}`;
    const message = `You requested a password reset. Please click on the link to reset your password: \n\n ${resetPasswordURL} \n\n If you did not request this, please ignore this email.`;
    try {
        await sendEmail({
            email: user.email,
            subject: "Rentease Password Reset",
            message: message
        });
    } catch (error) {
        console.error('Password reset email send failed:', error);
        await User.findByIdAndUpdate(
            user._id,
            {
                resetPasswordToken: undefined,
                resetPasswordExpire: undefined
            },
            { runValidators: false }
        );
        return next(new HandleError(error.message || "Failed to send email", 500));
    }

    return res.status(200).json({
        success: true,
        message: `Email sent to ${user.email} successfully`,
        resetToken
    });
})

//Reset password

export const resetPassword = handleAsyncError(async (req, res, next) => {
    
    const resetPasswordToken = crypto.createHash('sha256').update(req.params.token).digest('hex');
    const user = await User.findOne({
        resetPasswordToken,
        resetPasswordExpire: { $gt: Date.now() }
    });

    if(!user){
        return next(new HandleError("Invalid or expired password reset token", 400));
    }

    const { password, confirmPassword } = req.body || {};

    if (password !== confirmPassword) {
        return next(new HandleError("Password dosen't match", 400));
    }

    user.password = password
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;
    await user.save();
    sendToken(user, 200, res);

})

//get user details
export const getUserDetails = handleAsyncError(async (req, res, next) => {
    const user = await User.findById(req.user.id);
    console.log(req.user.id)
    res.status(200).json({
        success: true,
        user
    })
})

//update password
export const updatePassword = handleAsyncError(async (req, res, next) => {
    const { oldPassword, newPassword, confirmNewPassword, confirmPassword } = req.body || {};
    const confirmPasswordValue = confirmNewPassword ?? confirmPassword;

    if (!oldPassword || !newPassword || !confirmPasswordValue) {
      return next(new HandleError("Please provide old password, new password and confirm password", 400));
    }

   const user = await User.findById(req.user.id).select("+password");

   if (!user) {
     return next(new HandleError("User not found", 404));
   }

   const checkPasswordMatched = await bcrypt.compare(oldPassword, user.password);
  
   if(!checkPasswordMatched){
    return next(new HandleError("Old password is incorrect", 400));
   }

   if(newPassword !== confirmPasswordValue){
    return next(new HandleError("New password and confirm password do not match", 400));
   }

   user.password = newPassword;
   await user.save();
   sendToken(user, 200, res);


})

//Updating profile

export const updateProfile = handleAsyncError(async (req, res, next) => {
  const {name,email} = req.body || {};
  const updateUserDetails = {
    name,
    email
  }
    
  const user = await User.findByIdAndUpdate(req.user.id, updateUserDetails, {
    returnDocument: 'after',
    runValidators: true
  })

  res.status(200).json({
    success: true,
    message:"profile updated successfully",
    user
  })


})

//Admin getting user info
export const getUsersList = handleAsyncError(async (req, res, next) => {
    const users = await User.find();
    res.status(200).json({
        success: true,
        users
    })
})

//Admin getting single user
export const getSingleUser = handleAsyncError(async (req, res, next) => {
    const user = await User.findById(req.params.id);  // ✅ was req.user.id

     if(!user){
        return next (new HandleError(`User dosen't exist ${req.params.id}`, 404));   
     }

    res.status(200).json({
        success: true,
        user
    })

})



//Admin updating user role
export const updateUserRole = handleAsyncError(async (req, res, next) => {
    const {role} = req.body || {};
    const newUserData = {
        role
    }

    const user = await User .findByIdAndUpdate(req.params.id, newUserData, {
        returnDocument: 'after',
        runValidators: true,
    })

    if(!user){
        return next (new HandleError(`User dosen't exist ${req.params.id}`, 400));   
     }


    res.status(200).json({
        success: true,
        user,
        message: "User role updated successfully"
    })
})

//Admin deleting user
export const deleteUser = handleAsyncError(async (req, res, next) => { 
    const user = await User.findById(req.params.id)

    if(!user){
        return next (new HandleError(`User dosen't exist ${req.params.id}`, 400));   
     }

    await User.findByIdAndDelete(req.params.id)

    res.status(200).json({
        success: true,
        message: "User deleted successfully"
    })


})


//


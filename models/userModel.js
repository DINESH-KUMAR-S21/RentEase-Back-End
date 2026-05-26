import mongoose from 'mongoose';
import validator from 'validator';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';


const userSchema = new mongoose.Schema({
    //    userId: {
    //     type: String,
    //     required: [true, 'Please enter your name'],
    //     trim:true
    // },
    
    name: {
        type: String,
        required: [true, 'Please enter your name'],
        maxLength: [25, 'Name cannot exceed 25 characters'],
        trim:true
    },

    email: {
        type: String,
        required: [true, 'Please enter your email'],
        unique: true,
        validate: [validator.isEmail, 'Please enter a valid email address']
    },
    password:{
        type: String,
        required: [true, 'Please enter your password'],
        minLength: [8, 'Password must be at least 8 characters long'],
        select:false
    },

    avatar:{
        public_id:{
            type: String,
            required: true
        },
        url:{
            type: String,
            required: true
        }
       
    },


       role: {
        type: String,
        enum: ["user", "vendor", "admin"],  // ✅ added vendor role
        default: "user"
    },
        resetPasswordToken: String,
        resetPasswordExpire: Date

},{timestamps: true})

//password encryption
userSchema.pre('save', async function() {
   if (!this.isModified('password')) {
        return;
   }
   this.password = await bcrypt.hash(this.password, 10);
});

userSchema.methods.getJwtToken = function(){
    return jwt.sign({id: this._id}, process.env.JWT_SECRET_KEY, {
        expiresIn: process.env.JWT_EXPIRE
    })
}

userSchema.methods.generatePasswordResetToken = function(){
    //generate token
    const resetToken = crypto.randomBytes(20).toString('hex');
    this.resetPasswordToken = crypto.createHash('sha256').update(resetToken).digest('hex');
    this.resetPasswordExpire = Date.now() + 5 * 60 * 1000;
    return resetToken;
}

export default mongoose.model('User', userSchema)

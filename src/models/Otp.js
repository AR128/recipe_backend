import mongoose, { Schema } from "mongoose";

const otpSchema = mongoose.Schema;

const otpVerificatinSchema = new Schema({
    
    username:String,
    otp : String,
    createdAt: Date,
    ExpiredAt:Date,
});

const OtpVerification = mongoose.model(
    "OtpVerification", 
    otpVerificatinSchema
);

module.exports = OtpVerification;

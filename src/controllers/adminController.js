import { error } from "node:console";
import { Admin } from "../models/Admin.js"
import bcrypt from "bcryptjs";
import express from 'express'




export const loginAdmin = async (req, res) => {
    try {
        const {email, password, otp} = req.body;

        email = email.trim();
        password = password.trim();
        otp = otp.trim();

        if(email == "" || password == "" || otp == ""){
            res.status(401).json({ error: "Failed", message: "Empty input failed" });
        }else if (!/^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/.test(email))
            {
            res.status(405).json({ error: "Failed", message: "Failed email format" });
        } else if (password.length < 8) 
            {
            res.status(406).json({ error: "Failed", message: "Failed password format"});
        }else if(!otp.length == 6)
            {
            res.status(407).json({error:"Failed", message: "Password must be 6 digits"});
        }else{
            const token = jwt.sign(
            {id:user._id, role: user.role},
            process.env.SECRET_KEY,
        )

        res.status(205).json({message:"Login Successful", token})
        }
    }catch (error){
        console.log(error)
        res.status(206).json({error:error.message})
    }
}

const sendOtpVerificationemail = async () => {
    try {
        const otp = `${Math.floor(100000 + Math.random() * 900000)}`;


        // mail options
        const mailOptions = {
            from: process.env.ADMIN_EMAIL,
        }
    } catch (error) {

    }
}
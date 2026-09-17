import User from '../models/User.js'

export const signupUser = async (req, res) => {
    try {
        const { usernane, email, password, otp } = req.body;
        usernane = usernane.trim();
        email = email.trim();
        password = password.trim();
        otp = otp.trim();


        if (usernane == "" || email == "" || password == "" || otp == "") {
            res.status(401).json({ error: "Failed", message: "Empty input failed" });
        }else if (!/^[a-zA-Z]*$/.test(usernane))
            {
            res.status(404).json({ error: "Failed", message: "Failed username format" });
        }else if (!/^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/.test(email))
            {
            res.status(405).json({ error: "Failed", message: "Failed email format" });
        } else if (password.length < 8) 
            {
            res.status(406).json({ error: "Failed", message: "Failed password format"});
        }else if(!otp.length == 6)
            {
            res.status(407).json({error:"Failed", message: "Password must be 6 digits"});
        }else
            {
            // Check if alredy exsits

            const User = await User.find({email}).then((result) =>{
                if(result.length){
                    res.status(501).json({error:"Failed", message:"User with the provided email already exists"});
                }else{
                    // Try to create new user

                    // Password Handling

                    const hashpassword = bcrypt.hash(password,10).then((hashedpassword) =>{
                        const newUser = new User({})
                    })
                }
            })
            }

    } catch (error) {
        console.log(error)
        res.status(403).json({ error: error.message })
    }
}

const sendOtpVerificationemail = async () => {
    try {
        const otp = `${Math.floor(100000 + Math.random() * 900000)}`;


        // mail options
        const mailOptions = {
            from: process.env.EMAIL,
        }
    } catch (error) {

    }
}
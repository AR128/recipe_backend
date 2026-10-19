import { Router } from "express";
import { verifyAdminFirebaseToken } from "../middleware/auth.js";

const router = Router();

router.get("/dashboard", verifyAdminFirebaseToken, (req, res) => {
  res.status(200).json({
    message: "Welcome to the protected admin dashboard",
    user: req.user,
  });
});

export default router;

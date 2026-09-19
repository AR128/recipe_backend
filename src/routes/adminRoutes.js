import { Router } from "express";
import {
  loginAdmin,
  refreshAdminToken,
  logoutAdmin,
} from "../controllers/adminController.js";
import { verifyToken } from "../middleware/auth.js";

const router = Router();

// Public routes
router.post("/login", loginAdmin);
router.post("/refresh", refreshAdminToken);

router.post("/logout", logoutAdmin);

// Protected routes
router.get("/dashboard", verifyToken, (req, res) => {
  res.status(200).json({
    message: "Welcome to the protected admin dashboard",
    user: req.user,
  });
});

export default router;

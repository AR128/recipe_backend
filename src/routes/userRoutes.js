import { Router } from "express";
import {
  signupUser,
  loginUser,
  refreshUserToken,
  logoutUser,
  getUserProfile,
  updateUserProfile,
  getCommentedPosts,
  getMyPosts,
  searchUsers,
  getPublicUserProfile,
} from "../controllers/userController.js";
import { verifyToken } from "../middleware/auth.js";

const router = Router();

// Public routes
router.post("/signup", signupUser);
router.post("/login", loginUser);
router.post("/refresh", refreshUserToken);
router.post("/logout", logoutUser);
router.get("/search", searchUsers);
router.get("/public/:username", getPublicUserProfile);

// Protected routes
router.get("/profile", verifyToken, getUserProfile);
router.put("/profile", verifyToken, updateUserProfile);
router.get("/commented-posts", verifyToken, getCommentedPosts);
router.get("/my-posts", verifyToken, getMyPosts);

// Protected test route
router.get("/dashboard", verifyToken, (req, res) => {
  res.status(200).json({
    message: "Welcome to the user dashboard",
    user: req.user,
  });
});

export default router;

import { Router } from "express";
import {
  getUserProfile,
  updateUserProfile,
  getCommentedPosts,
  getMyPosts,
  getSavedRecipes,
  toggleSaveRecipe,
  searchUsers,
  getPublicUserProfile,
} from "../controllers/userController.js";
import { requestPlatformAccess } from "../controllers/accessController.js";
import {
  optionalVerifyFirebaseToken,
  verifyFirebaseIdentity,
  verifyFirebaseToken,
  verifyFirebaseTokenRevoked,
} from "../middleware/auth.js";
import {
  publicContentLimiter,
  searchLimiter,
  userWriteLimiter,
} from "../middleware/tokenBucket.js";

const router = Router();

router.post(
  "/access-request",
  verifyFirebaseIdentity,
  userWriteLimiter,
  requestPlatformAccess
);
router.get("/search", searchLimiter, optionalVerifyFirebaseToken, searchUsers);
router.get(
  "/public/:username",
  publicContentLimiter,
  optionalVerifyFirebaseToken,
  getPublicUserProfile
);

router.get("/profile", verifyFirebaseToken, getUserProfile);
router.put(
  "/profile",
  verifyFirebaseTokenRevoked,
  userWriteLimiter,
  updateUserProfile
);
router.get(
  "/commented-posts",
  publicContentLimiter,
  verifyFirebaseToken,
  getCommentedPosts
);
router.get("/my-posts", publicContentLimiter, verifyFirebaseToken, getMyPosts);
router.get(
  "/saved-recipes",
  publicContentLimiter,
  verifyFirebaseToken,
  getSavedRecipes
);
router.post(
  "/saved-recipes/:idOrSlug",
  verifyFirebaseTokenRevoked,
  userWriteLimiter,
  toggleSaveRecipe
);

// Protected test route
router.get("/dashboard", verifyFirebaseToken, (req, res) => {
  res.status(200).json({
    message: "Welcome to the user dashboard",
    user: req.user,
  });
});

export default router;

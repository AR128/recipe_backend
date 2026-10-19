import { Router } from "express";
import {
  getRecipes,
  getTrendingRecipes,
  getRecipeBySlug,
  getComments,
  createComment,
  getCategories,
  createRecipe,
  updateRecipe,
  deleteRecipe,
  toggleRecipeLike,
} from "../controllers/recipeController.js";
import {
  optionalVerifyFirebaseToken,
  verifyFirebaseTokenRevoked,
} from "../middleware/auth.js";
import {
  commentCreateLimiter,
  commentReadLimiter,
  publicContentLimiter,
  searchLimiter,
  userWriteLimiter,
} from "../middleware/tokenBucket.js";

const router = Router();
const limitRecipeSearch = (req, res, next) => {
  if (req.query.search === undefined && req.query.tag === undefined) {
    return next();
  }
  return searchLimiter(req, res, next);
};

// Public routes
router.get("/categories", publicContentLimiter, getCategories);
router.get(
  "/trending",
  publicContentLimiter,
  optionalVerifyFirebaseToken,
  getTrendingRecipes
);
router.get(
  "/",
  publicContentLimiter,
  limitRecipeSearch,
  optionalVerifyFirebaseToken,
  getRecipes
);
router.get(
  "/:slug/comments",
  publicContentLimiter,
  commentReadLimiter,
  getComments
);
router.get(
  "/:slug",
  publicContentLimiter,
  optionalVerifyFirebaseToken,
  getRecipeBySlug
);

// Protected routes (authenticated users only)
router.post("/", verifyFirebaseTokenRevoked, userWriteLimiter, createRecipe);
router.put("/:id", verifyFirebaseTokenRevoked, userWriteLimiter, updateRecipe);
router.delete(
  "/:id",
  verifyFirebaseTokenRevoked,
  userWriteLimiter,
  deleteRecipe
);
router.post(
  "/:slug/comments",
  verifyFirebaseTokenRevoked,
  commentCreateLimiter,
  createComment
);
router.post(
  "/:slug/likes",
  verifyFirebaseTokenRevoked,
  userWriteLimiter,
  toggleRecipeLike
);

export default router;

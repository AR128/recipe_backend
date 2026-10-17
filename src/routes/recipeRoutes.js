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
import { optionalVerifyToken, verifyToken } from "../middleware/auth.js";

const router = Router();

// Public routes
router.get("/categories", getCategories);
router.get("/trending", optionalVerifyToken, getTrendingRecipes);
router.get("/", optionalVerifyToken, getRecipes);
router.get("/:slug", optionalVerifyToken, getRecipeBySlug);
router.get("/:slug/comments", getComments);

// Protected routes (authenticated users only)
router.post("/", verifyToken, createRecipe);
router.put("/:id", verifyToken, updateRecipe);
router.delete("/:id", verifyToken, deleteRecipe);
router.post("/:slug/comments", verifyToken, createComment);
router.post("/:slug/likes", verifyToken, toggleRecipeLike);

export default router;

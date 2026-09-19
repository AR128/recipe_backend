import { Router } from "express";
import {
  getRecipes,
  getRecipeBySlug,
  getComments,
  createComment,
  getCategories,
  createRecipe,
  updateRecipe,
  deleteRecipe,
} from "../controllers/recipeController.js";
import { verifyToken } from "../middleware/auth.js";

const router = Router();

// Public routes
router.get("/categories", getCategories);
router.get("/", getRecipes);
router.get("/:slug", getRecipeBySlug);
router.get("/:slug/comments", getComments);

// Protected routes (authenticated users only)
router.post("/", verifyToken, createRecipe);
router.put("/:id", verifyToken, updateRecipe);
router.delete("/:id", verifyToken, deleteRecipe);
router.post("/:slug/comments", verifyToken, createComment);

export default router;

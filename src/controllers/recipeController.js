import { Recipe } from "../models/Recipe.js";
import { Comment } from "../models/Comment.js";
import { User } from "../models/User.js";
import mongoose from "mongoose";
import {
  escapeRegex,
  parsePagination,
  queryString,
  requireObjectBody,
  validateRecipePayload,
} from "../utils/requestValidation.js";
import { sendControllerError } from "../utils/controllerError.js";

const serializeRecipe = (recipe, userId, { detail = false } = {}) => {
  const data = recipe.toObject ? recipe.toObject() : recipe;
  const likes = data.likes || [];
  return {
    _id: data._id,
    title: data.title,
    slug: data.slug,
    description: data.description,
    image: data.image,
    authorName: data.authorName,
    category: data.category,
    tags: data.tags || [],
    cookTime: data.cookTime,
    prepTime: data.prepTime,
    servings: data.servings,
    ingredients: data.ingredients || [],
    steps: data.steps || [],
    createdAt: data.createdAt,
    updatedAt: data.updatedAt,
    ...(detail
      ? {
          content: data.content,
          author: data.author
            ? {
                id: data.author._id,
                username: data.author.username,
                name: data.author.fullName || data.author.name,
              }
            : undefined,
          savedCount: data.savedCount,
        }
      : {}),
    likesCount: likes.length,
    likedByMe: Boolean(
      userId && likes.some((likeId) => likeId.toString() === userId)
    ),
  };
};

// GET /api/recipes
// Public — list all published recipes, optional ?search= query
export const getRecipes = async (req, res) => {
  try {
    const { page, limit, skip } = parsePagination(req.query);
    const search = queryString(req.query.search, "search", { max: 80 });
    const tag = queryString(req.query.tag, "tag", { max: 80 });
    const category = queryString(req.query.category, "category", { max: 80 });

    const filter = { published: true };
    const searchQuery = search || tag;

    if (searchQuery) {
      const strippedTag = escapeRegex(searchQuery.replace(/^#/, ""));
      const escapedSearch = escapeRegex(searchQuery);
      filter.$or = [
        { title: { $regex: escapedSearch, $options: "i" } },
        { description: { $regex: escapedSearch, $options: "i" } },
        { tags: { $regex: strippedTag || escapedSearch, $options: "i" } },
        { category: { $regex: strippedTag || escapedSearch, $options: "i" } },
        { authorName: { $regex: escapedSearch, $options: "i" } },
      ];
    }

    const hasCategory = category && category !== "All";
    if (hasCategory) filter.category = category;

    let recipeQuery = Recipe.find(filter)
      .select(
        "title slug description image authorName category tags cookTime prepTime servings createdAt likes"
      )
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);
    if (hasCategory) {
      recipeQuery = recipeQuery.collation({ locale: "en", strength: 2 });
    }

    const [recipes, total] = await Promise.all([
      recipeQuery,
      Recipe.countDocuments(filter),
    ]);

    res.status(200).json({
      recipes: recipes.map((recipe) => serializeRecipe(recipe, req.user?.id)),
      total,
      page,
      limit,
      pages: Math.ceil(total / limit),
    });
  } catch (error) {
    return sendControllerError(req, res, error, "getRecipes");
  }
};

// GET /api/recipes/:slug
// Public — single recipe detail
export const getRecipeBySlug = async (req, res) => {
  try {
    const { slug } = req.params;

    const recipe = await Recipe.findOne({ slug, published: true }).populate(
      "author",
      "username name fullName"
    );

    if (!recipe) {
      return res
        .status(404)
        .json({ error: "Not Found", message: "Recipe not found" });
    }

    const savedCount = await User.countDocuments({ savedRecipes: recipe._id });

    const response = serializeRecipe(recipe, req.user?.id, { detail: true });
    response.savedCount = savedCount;
    res.status(200).json({ recipe: response });
  } catch (error) {
    return sendControllerError(req, res, error, "getRecipeBySlug");
  }
};

// POST /api/recipes/:slug/likes
// Protected — toggle a user's like on a published recipe
export const toggleRecipeLike = async (req, res) => {
  try {
    const { slug } = req.params;
    const userId = req.user.id;
    const recipe = await Recipe.findOne({ slug, published: true }).select(
      "_id likes"
    );

    if (!recipe) {
      return res
        .status(404)
        .json({ error: "Not Found", message: "Recipe not found" });
    }

    const userExists = await User.exists({ _id: userId });
    if (!userExists) {
      return res.status(403).json({
        error: "Forbidden",
        message: "Only registered users can like recipes",
      });
    }

    const alreadyLiked = recipe.likes.some(
      (likeId) => likeId.toString() === userId
    );
    await Recipe.updateOne(
      { _id: recipe._id },
      alreadyLiked
        ? { $pull: { likes: userId } }
        : { $addToSet: { likes: userId } }
    );

    const updatedRecipe = await Recipe.findById(recipe._id).select("likes");
    res.status(200).json({
      liked: !alreadyLiked,
      likesCount: updatedRecipe.likes.length,
    });
  } catch (error) {
    return sendControllerError(req, res, error, "toggleRecipeLike");
  }
};

// GET /api/recipes/:slug/comments
// Public — fetch all comments for a recipe
export const getComments = async (req, res) => {
  try {
    const { slug } = req.params;
    const { page, limit, skip } = parsePagination(req.query, {
      defaultLimit: 12,
      maxLimit: 50,
    });

    const recipe = await Recipe.findOne({ slug, published: true }).select(
      "_id"
    );
    if (!recipe) {
      return res
        .status(404)
        .json({ error: "Not Found", message: "Recipe not found" });
    }

    const [comments, total] = await Promise.all([
      Comment.find({ recipe: recipe._id })
        .populate("user", "username name fullName")
        .select("text createdAt user recipe")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Comment.countDocuments({ recipe: recipe._id }),
    ]);

    res.status(200).json({
      comments: comments.map((comment) => ({
        _id: comment._id,
        text: comment.text,
        createdAt: comment.createdAt,
        recipe: comment.recipe,
        user: comment.user
          ? {
              id: comment.user._id,
              username: comment.user.username,
              name: comment.user.fullName || comment.user.name,
            }
          : null,
      })),
      total,
      page,
      limit,
      pages: Math.ceil(total / limit),
    });
  } catch (error) {
    return sendControllerError(req, res, error, "getComments");
  }
};

// POST /api/recipes/:slug/comments
// Protected — create a comment (authenticated users only)
export const createComment = async (req, res) => {
  try {
    const { slug } = req.params;
    const bodyError = requireObjectBody(req.body, ["text"]);
    if (bodyError) {
      return res.status(400).json({ error: "Validation", message: bodyError });
    }
    const { text } = req.body;

    if (typeof text !== "string" || !text.trim()) {
      return res
        .status(400)
        .json({ error: "Validation", message: "Comment text is required" });
    }

    if (text.trim().length > 1000) {
      return res.status(400).json({
        error: "Validation",
        message: "Comment cannot exceed 1000 characters",
      });
    }

    const recipe = await Recipe.findOne({ slug, published: true }).select(
      "_id"
    );
    if (!recipe) {
      return res
        .status(404)
        .json({ error: "Not Found", message: "Recipe not found" });
    }

    // req.user is populated by Firebase token verification middleware
    const userId = req.user.id;

    const comment = new Comment({
      recipe: recipe._id,
      user: userId,
      text: text.trim(),
    });

    await comment.save();

    const populated = await comment.populate("user", "username name fullName");
    res.status(201).json({
      comment: {
        _id: populated._id,
        text: populated.text,
        createdAt: populated.createdAt,
        recipe: populated.recipe,
        user: populated.user
          ? {
              id: populated.user._id,
              username: populated.user.username,
              name: populated.user.fullName || populated.user.name,
            }
          : null,
      },
    });
  } catch (error) {
    return sendControllerError(req, res, error, "createComment");
  }
};

// GET /api/recipes/categories
// Public — list all unique categories
export const getCategories = async (req, res) => {
  try {
    const categories = await Recipe.distinct("category", { published: true });
    res.status(200).json({ categories });
  } catch (error) {
    return sendControllerError(req, res, error, "getCategories");
  }
};

// POST /api/recipes
// Protected — create a new recipe post
export const createRecipe = async (req, res) => {
  try {
    const validation = validateRecipePayload(req.body);
    if (validation.error) {
      return res
        .status(400)
        .json({ error: "Validation", message: validation.error });
    }
    const {
      title,
      description,
      content,
      image,
      category,
      tags,
      cookTime,
      prepTime,
      servings,
      ingredients,
      steps,
    } = validation.value;

    // Generate base slug
    let slug = title
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, "")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-")
      .trim();

    if (!slug) {
      slug = `recipe-${Date.now()}`;
    }

    // Ensure slug uniqueness
    const existing = await Recipe.findOne({ slug });
    if (existing) {
      slug = `${slug}-${Date.now().toString(36)}`;
    }

    // Fetch author details
    const userId = req.user.id;
    const user = await User.findById(userId).select("username name fullName");
    const authorName =
      user?.fullName && user.fullName.trim()
        ? user.fullName.trim()
        : user?.name && user.name.trim()
          ? user.name.trim()
          : user?.username || "Chef";

    const recipe = new Recipe({
      title,
      slug,
      description,
      content,
      image,
      author: userId,
      authorName,
      category: category || "General",
      tags,
      cookTime,
      prepTime,
      servings,
      ingredients,
      steps,
      published: true,
    });

    await recipe.save();

    res.status(201).json({
      message: "Recipe created successfully",
      recipe: serializeRecipe(recipe, req.user.id, { detail: true }),
    });
  } catch (error) {
    return sendControllerError(req, res, error, "createRecipe");
  }
};

// PUT /api/recipes/:id
// Protected — update a recipe post (author or admin only)
export const updateRecipe = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const userRole = req.user.role;

    const recipe = await Recipe.findById(id);

    if (!recipe) {
      return res
        .status(404)
        .json({ error: "Not Found", message: "Recipe not found" });
    }

    // Check ownership or admin privilege
    if (recipe.author.toString() !== userId && userRole !== "admin") {
      return res.status(403).json({
        error: "Forbidden",
        message: "You can only edit your own recipes",
      });
    }

    const validation = validateRecipePayload(req.body, { partial: true });
    if (validation.error) {
      return res
        .status(400)
        .json({ error: "Validation", message: validation.error });
    }
    Object.assign(recipe, validation.value);

    await recipe.save();

    res.status(200).json({
      message: "Recipe updated successfully",
      recipe: serializeRecipe(recipe, req.user.id, { detail: true }),
    });
  } catch (error) {
    return sendControllerError(req, res, error, "updateRecipe");
  }
};

// DELETE /api/recipes/:id
// Protected — delete a recipe post (author or admin only)
export const deleteRecipe = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const userRole = req.user.role;

    const recipe = await Recipe.findById(id);

    if (!recipe) {
      return res
        .status(404)
        .json({ error: "Not Found", message: "Recipe not found" });
    }

    // Check ownership or admin privilege
    if (recipe.author.toString() !== userId && userRole !== "admin") {
      return res.status(403).json({
        error: "Forbidden",
        message: "You can only delete your own recipes",
      });
    }

    // Delete comments associated with this recipe
    await Comment.deleteMany({ recipe: id });

    // Delete recipe
    await Recipe.findByIdAndDelete(id);

    res.status(200).json({
      message: "Recipe deleted successfully",
      recipeId: id,
    });
  } catch (error) {
    return sendControllerError(req, res, error, "deleteRecipe");
  }
};

// GET /api/recipes/trending
// Public — top recipes ranked by database-backed likes
export const getTrendingRecipes = async (req, res) => {
  try {
    const { limit } = parsePagination(req.query, {
      defaultLimit: 9,
      maxLimit: 20,
    });

    const recipes = await Recipe.aggregate([
      { $match: { published: true } },
      {
        $addFields: {
          likesCount: { $size: { $ifNull: ["$likes", []] } },
          likedByMe: req.user?.id
            ? {
                $in: [
                  new mongoose.Types.ObjectId(req.user.id),
                  { $ifNull: ["$likes", []] },
                ],
              }
            : false,
        },
      },
      {
        $project: {
          _id: 1,
          title: 1,
          slug: 1,
          description: 1,
          image: 1,
          authorName: 1,
          category: 1,
          tags: 1,
          cookTime: 1,
          prepTime: 1,
          servings: 1,
          ingredients: 1,
          steps: 1,
          createdAt: 1,
          updatedAt: 1,
          likesCount: 1,
          likedByMe: 1,
        },
      },
      {
        $sort: {
          likesCount: -1,
          createdAt: -1,
        },
      },
      {
        $limit: limit,
      },
    ]);

    res.status(200).json({ recipes });
  } catch (error) {
    return sendControllerError(req, res, error, "getTrendingRecipes");
  }
};

import mongoose from "mongoose";
import { User } from "../models/User.js";
import { Comment } from "../models/Comment.js";
import { Recipe } from "../models/Recipe.js";
import {
  isDuplicateUsernameError,
  USERNAME_COLLATION,
} from "../utils/username.js";
import {
  escapeRegex,
  parsePagination,
  queryString,
  requireObjectBody,
} from "../utils/requestValidation.js";
import { sendControllerError } from "../utils/controllerError.js";

const publicRecipeProjection = {
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
};

const getAuthorSaveStats = async (authorId, publishedOnly = false) => {
  const match = { author: authorId };
  if (publishedOnly) match.published = true;

  const [stats] = await Recipe.aggregate([
    { $match: match },
    {
      $lookup: {
        from: "users",
        localField: "_id",
        foreignField: "savedRecipes",
        pipeline: [{ $project: { _id: 1 } }],
        as: "savers",
      },
    },
    {
      $addFields: {
        saveCount: { $size: "$savers" },
        saverIds: "$savers._id",
      },
    },
    {
      $group: {
        _id: null,
        totalSavesReceived: { $sum: "$saveCount" },
        saverIdGroups: { $push: "$saverIds" },
      },
    },
    {
      $project: {
        _id: 0,
        totalSavesReceived: 1,
        uniqueUsersCount: {
          $size: {
            $reduce: {
              input: "$saverIdGroups",
              initialValue: [],
              in: { $setUnion: ["$$value", "$$this"] },
            },
          },
        },
      },
    },
  ]);

  return stats || { totalSavesReceived: 0, uniqueUsersCount: 0 };
};

// GET /api/user/profile
// Protected — get current user profile
export const getUserProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res
        .status(404)
        .json({ error: "Not Found", message: "User not found" });
    }

    const saveStats = await getAuthorSaveStats(user._id);

    res.status(200).json({
      user: {
        id: user._id,
        username: user.username,
        name: user.fullName || user.name,
        fullName: user.fullName || user.name,
        email: user.email,
        createdAt: user.createdAt,
        totalSavesReceived: saveStats.totalSavesReceived,
        uniqueUsersCount: saveStats.uniqueUsersCount,
      },
    });
  } catch (error) {
    return sendControllerError(req, res, error, "getUserProfile");
  }
};

// PUT /api/user/profile
// Protected — update the public username and full name
export const updateUserProfile = async (req, res) => {
  try {
    const bodyError = requireObjectBody(req.body, [
      "username",
      "fullName",
      "name",
    ]);
    if (bodyError) {
      return res.status(400).json({ error: "Validation", message: bodyError });
    }
    const { username } = req.body;
    const requestedFullName = req.body.fullName ?? req.body.name;

    if (username !== undefined && typeof username !== "string") {
      return res
        .status(400)
        .json({ error: "Validation", message: "Username must be a string" });
    }
    if (
      requestedFullName !== undefined &&
      typeof requestedFullName !== "string"
    ) {
      return res
        .status(400)
        .json({ error: "Validation", message: "Full name must be a string" });
    }

    const updates = {};
    if (username !== undefined) {
      if (!/^[a-zA-Z0-9_]{2,24}$/.test(username)) {
        return res.status(400).json({
          error: "Validation",
          message:
            "Username must be 2–24 characters with no spaces, using only letters, numbers, or underscores.",
        });
      }

      const existingUsername = await User.exists({
        username,
        _id: { $ne: req.user.id },
      }).collation(USERNAME_COLLATION);

      if (existingUsername) {
        return res.status(409).json({
          error: "Conflict",
          code: "USERNAME_TAKEN",
          message:
            "That username is already registered. Please choose another.",
        });
      }

      updates.username = username;
    }

    if (requestedFullName !== undefined) {
      const fullName = requestedFullName.trim();
      if (!fullName || fullName.length > 80) {
        return res.status(400).json({
          error: "Validation",
          message: "Full name must be between 1 and 80 characters.",
        });
      }
      updates.fullName = fullName;
      updates.name = fullName;
    }

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({
        error: "Validation",
        message: "Provide a username or full name to update.",
      });
    }

    const user = await User.findByIdAndUpdate(
      req.user.id,
      { $set: updates },
      { returnDocument: "after", runValidators: true }
    );

    if (!user) {
      return res
        .status(404)
        .json({ error: "Not Found", message: "User not found" });
    }

    if (updates.fullName !== undefined) {
      await Recipe.updateMany(
        { author: user._id },
        { $set: { authorName: user.fullName } }
      );
    }

    res.status(200).json({
      message: "Profile updated successfully",
      user: {
        id: user._id,
        username: user.username,
        name: user.fullName || user.name,
        fullName: user.fullName || user.name,
        email: user.email,
      },
    });
  } catch (error) {
    if (isDuplicateUsernameError(error)) {
      return res.status(409).json({
        error: "Conflict",
        code: "USERNAME_TAKEN",
        message: "That username is already registered. Please choose another.",
      });
    }
    return sendControllerError(req, res, error, "updateUserProfile");
  }
};

// GET /api/user/commented-posts
// Protected — get all recipes the user has commented on
export const getCommentedPosts = async (req, res) => {
  try {
    const userId = req.user.id;
    const { page, limit, skip } = parsePagination(req.query);
    const [result] = await Comment.aggregate([
      { $match: { user: new mongoose.Types.ObjectId(userId) } },
      { $group: { _id: "$recipe" } },
      {
        $lookup: {
          from: "recipes",
          let: { recipeId: "$_id" },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [
                    { $eq: ["$_id", "$$recipeId"] },
                    { $eq: ["$published", true] },
                  ],
                },
              },
            },
            { $project: publicRecipeProjection },
          ],
          as: "recipe",
        },
      },
      { $unwind: "$recipe" },
      { $replaceRoot: { newRoot: "$recipe" } },
      { $sort: { createdAt: -1 } },
      {
        $facet: {
          recipes: [{ $skip: skip }, { $limit: limit }],
          totals: [{ $count: "total" }],
        },
      },
    ]);
    const recipes = result?.recipes || [];
    const total = result?.totals[0]?.total || 0;
    res.status(200).json({
      recipes,
      total,
      page,
      limit,
      pages: Math.ceil(total / limit),
    });
  } catch (error) {
    return sendControllerError(req, res, error, "getCommentedPosts");
  }
};

// GET /api/user/my-posts
// Protected — get all recipes created by the current logged-in user
export const getMyPosts = async (req, res) => {
  try {
    const userId = req.user.id;
    const authorObjectId = new mongoose.Types.ObjectId(userId);
    const { page, limit, skip } = parsePagination(req.query);
    const [result] = await Recipe.aggregate([
      { $match: { author: authorObjectId } },
      {
        $lookup: {
          from: "users",
          localField: "_id",
          foreignField: "savedRecipes",
          pipeline: [{ $project: { _id: 1 } }],
          as: "savedByUsers",
        },
      },
      {
        $addFields: {
          savedCount: { $size: "$savedByUsers" },
          likesCount: { $size: { $ifNull: ["$likes", []] } },
        },
      },
      {
        $project: {
          ...publicRecipeProjection,
          savedCount: 1,
          likesCount: 1,
          savedByUsers: "$savedByUsers._id",
        },
      },
      {
        $facet: {
          recipes: [
            { $sort: { createdAt: -1 } },
            { $skip: skip },
            { $limit: limit },
            { $project: { savedByUsers: 0 } },
          ],
          totals: [
            {
              $group: {
                _id: null,
                total: { $sum: 1 },
                totalSavesReceived: { $sum: "$savedCount" },
                totalLikesReceived: { $sum: "$likesCount" },
                saverIdGroups: { $push: "$savedByUsers" },
              },
            },
            {
              $project: {
                _id: 0,
                total: 1,
                totalSavesReceived: 1,
                totalLikesReceived: 1,
                uniqueUsersCount: {
                  $size: {
                    $reduce: {
                      input: "$saverIdGroups",
                      initialValue: [],
                      in: { $setUnion: ["$$value", "$$this"] },
                    },
                  },
                },
              },
            },
          ],
        },
      },
    ]);
    const recipes = result?.recipes || [];
    const totals = result?.totals[0] || {
      total: 0,
      totalSavesReceived: 0,
      totalLikesReceived: 0,
      uniqueUsersCount: 0,
    };

    res.status(200).json({
      recipes,
      total: totals.total,
      totalSavesReceived: totals.totalSavesReceived,
      totalLikesReceived: totals.totalLikesReceived,
      uniqueUsersCount: totals.uniqueUsersCount,
      page,
      limit,
      pages: Math.ceil(totals.total / limit),
    });
  } catch (error) {
    return sendControllerError(req, res, error, "getMyPosts");
  }
};

// GET /api/user/search?q=query&hasRecipes=true&limit=12
// Public — search users by username or display name, optionally filter by active recipe publishers
export const searchUsers = async (req, res) => {
  try {
    const { page, limit, skip } = parsePagination(req.query, {
      defaultLimit: 12,
      maxLimit: 50,
    });
    const q = queryString(req.query.q, "q", { max: 64 });
    const hasRecipes = queryString(req.query.hasRecipes, "hasRecipes", {
      max: 5,
    });
    if (hasRecipes && hasRecipes !== "true" && hasRecipes !== "false") {
      return res.status(400).json({
        error: "Validation",
        message: "hasRecipes must be either true or false.",
      });
    }
    const filter = {};
    if (q) {
      const queryRegex = new RegExp(escapeRegex(q), "i");
      filter.$or = [
        { username: queryRegex },
        { fullName: queryRegex },
        { name: queryRegex },
      ];
    }

    if (hasRecipes === "true") {
      // Find author ObjectIds that have at least one published recipe
      const activeAuthorIds = await Recipe.distinct("author", {
        published: true,
      });
      filter._id = { $in: activeAuthorIds };
    }

    const [users, total] = await Promise.all([
      User.find(filter)
        .select("username name fullName createdAt")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      User.countDocuments(filter),
    ]);

    // Compute recipe count for each returned user
    const userIds = users.map((u) => u._id);
    const recipeCounts = await Recipe.aggregate([
      { $match: { author: { $in: userIds }, published: true } },
      { $group: { _id: "$author", count: { $sum: 1 } } },
    ]);

    const countMap = {};
    recipeCounts.forEach((rc) => {
      countMap[rc._id.toString()] = rc.count;
    });

    const enrichedUsers = users.map((u) => ({
      id: u._id,
      username: u.username,
      name: u.fullName || u.name,
      fullName: u.fullName || u.name,
      createdAt: u.createdAt,
      recipeCount: countMap[u._id.toString()] || 0,
    }));

    if (hasRecipes === "true") {
      enrichedUsers.sort((a, b) => b.recipeCount - a.recipeCount);
    }

    res.status(200).json({
      users: enrichedUsers,
      total,
      page,
      limit,
      pages: Math.ceil(total / limit),
    });
  } catch (error) {
    return sendControllerError(req, res, error, "searchUsers");
  }
};

// GET /api/user/public/:username
// Public — get public user details and published posts (excludes comments)
export const getPublicUserProfile = async (req, res) => {
  try {
    const username = queryString(req.params.username, "username", {
      max: 24,
      optional: false,
    });
    const { page, limit, skip } = parsePagination(req.query);

    const user = await User.findOne({ username: username.trim() })
      .collation(USERNAME_COLLATION)
      .select("username name fullName createdAt");

    if (!user) {
      return res
        .status(404)
        .json({ error: "Not Found", message: "User not found" });
    }

    const [recipes, total, saveStats] = await Promise.all([
      Recipe.aggregate([
        {
          $match: {
            author: user._id,
            published: true,
          },
        },
        {
          $lookup: {
            from: "users",
            localField: "_id",
            foreignField: "savedRecipes",
            pipeline: [{ $project: { _id: 1 } }],
            as: "savedByUsers",
          },
        },
        {
          $project: {
            ...publicRecipeProjection,
            savedCount: { $size: "$savedByUsers" },
          },
        },
        { $sort: { createdAt: -1 } },
        { $skip: skip },
        { $limit: limit },
      ]),
      Recipe.countDocuments({ author: user._id, published: true }),
      getAuthorSaveStats(user._id, true),
    ]);

    res.status(200).json({
      user: {
        id: user._id,
        username: user.username,
        name: user.fullName || user.name,
        fullName: user.fullName || user.name,
        createdAt: user.createdAt,
        totalSavesReceived: saveStats.totalSavesReceived,
        uniqueUsersCount: saveStats.uniqueUsersCount,
      },
      recipes,
      total,
      page,
      limit,
      pages: Math.ceil(total / limit),
    });
  } catch (error) {
    return sendControllerError(req, res, error, "getPublicUserProfile");
  }
};

// GET /api/user/saved-recipes
// Protected — get recipes liked or bookmarked by the authenticated user
export const getSavedRecipes = async (req, res) => {
  try {
    const userId = req.user.id;
    const { page, limit, skip } = parsePagination(req.query);
    const [result] = await User.aggregate([
      { $match: { _id: new mongoose.Types.ObjectId(userId) } },
      {
        $project: {
          savedRecipeIds: { $ifNull: ["$savedRecipes", []] },
        },
      },
      {
        $lookup: {
          from: "recipes",
          let: { ids: "$savedRecipeIds", userId: "$_id" },
          pipeline: [
            {
              $match: {
                published: true,
                $expr: {
                  $or: [
                    { $in: ["$_id", "$$ids"] },
                    {
                      $in: ["$$userId", { $ifNull: ["$likes", []] }],
                    },
                  ],
                },
              },
            },
            {
              $addFields: {
                isBookmarked: { $in: ["$_id", "$$ids"] },
                savedOrder: { $indexOfArray: ["$$ids", "$_id"] },
                likesCount: { $size: { $ifNull: ["$likes", []] } },
                likedByMe: {
                  $in: ["$$userId", { $ifNull: ["$likes", []] }],
                },
              },
            },
            { $sort: { isBookmarked: -1, savedOrder: 1, createdAt: -1 } },
            {
              $facet: {
                metadata: [{ $count: "total" }],
                recipes: [
                  { $skip: skip },
                  { $limit: limit },
                  {
                    $project: {
                      ...publicRecipeProjection,
                      likesCount: 1,
                      likedByMe: 1,
                    },
                  },
                ],
              },
            },
          ],
          as: "savedRecipes",
        },
      },
    ]);
    const savedResult = result?.savedRecipes?.[0];
    const recipes = savedResult?.recipes || [];
    const total = savedResult?.metadata?.[0]?.total || 0;
    res.status(200).json({
      recipes,
      total,
      page,
      limit,
      pages: Math.ceil(total / limit),
    });
  } catch (error) {
    return sendControllerError(req, res, error, "getSavedRecipes");
  }
};

// POST /api/user/saved-recipes/:idOrSlug
// Protected — toggle save / bookmark a recipe in MongoDB
export const toggleSaveRecipe = async (req, res) => {
  try {
    const userId = req.user.id;
    const { idOrSlug } = req.params;

    const query = { published: true };
    if (idOrSlug.match(/^[0-9a-fA-F]{24}$/)) {
      query.$or = [{ _id: idOrSlug }, { slug: idOrSlug }];
    } else {
      query.slug = idOrSlug;
    }

    const recipe = await Recipe.findOne(query);
    if (!recipe) {
      return res
        .status(404)
        .json({ error: "Not Found", message: "Recipe not found" });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res
        .status(404)
        .json({ error: "Not Found", message: "User not found" });
    }

    if (!user.savedRecipes) {
      user.savedRecipes = [];
    }

    const recipeIdStr = recipe._id.toString();
    const isAlreadySaved = user.savedRecipes.some(
      (id) => id.toString() === recipeIdStr
    );

    if (isAlreadySaved) {
      user.savedRecipes = user.savedRecipes.filter(
        (id) => id.toString() !== recipeIdStr
      );
    } else {
      user.savedRecipes.push(recipe._id);
    }

    await user.save();

    res.status(200).json({
      saved: !isAlreadySaved,
      recipeId: recipe._id,
      slug: recipe.slug,
      totalSaved: user.savedRecipes.length,
      message: !isAlreadySaved
        ? "Recipe saved to your cookbook."
        : "Recipe removed from your saved list.",
    });
  } catch (error) {
    return sendControllerError(req, res, error, "toggleSaveRecipe");
  }
};

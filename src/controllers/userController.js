import mongoose from "mongoose";
import { User } from "../models/User.js";
import { Comment } from "../models/Comment.js";
import { Recipe } from "../models/Recipe.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

const generateAccessToken = (id, role) => {
  return jwt.sign({ id: id.toString(), role }, process.env.ACCESS_TOKEN, {
    expiresIn: "15m",
  });
};

const generateRefreshToken = (id, role) => {
  return jwt.sign({ id: id.toString(), role }, process.env.REFRESH_TOKEN, {
    expiresIn: "7d",
  });
};

// POST /api/user/signup
export const signupUser = async (req, res) => {
  try {
    const { username, email, password } = req.body;

    if (!username || !email || !password) {
      return res
        .status(400)
        .json({ error: "Failed", message: "All fields are required" });
    }

    const existing = await User.findOne({ $or: [{ username }, { email }] });
    if (existing) {
      return res
        .status(409)
        .json({ error: "Failed", message: "Username or email already in use" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = new User({ username, email, password: hashedPassword });
    await user.save();

    const accessToken = generateAccessToken(user._id, "user");
    const refreshToken = generateRefreshToken(user._id, "user");

    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      path: "/",
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    res.status(201).json({
      message: "Account created successfully",
      accessToken,
      user: {
        id: user._id,
        username: user.username,
        name: user.name,
        email: user.email,
      },
    });
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .json({ error: "Internal server error", message: error.message });
  }
};

// POST /api/user/login
export const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res
        .status(400)
        .json({ error: "Failed", message: "Email and password are required" });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res
        .status(401)
        .json({ error: "Failed", message: "Invalid credentials" });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res
        .status(401)
        .json({ error: "Failed", message: "Invalid credentials" });
    }

    const accessToken = generateAccessToken(user._id, "user");
    const refreshToken = generateRefreshToken(user._id, "user");

    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      path: "/",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    res.status(200).json({
      message: "Login Successful",
      accessToken,
      user: {
        id: user._id,
        username: user.username,
        name: user.name,
        email: user.email,
      },
    });
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .json({ error: "Internal server error", message: error.message });
  }
};

// POST /api/user/refresh
export const refreshUserToken = async (req, res) => {
  try {
    const refreshToken = req.cookies.refreshToken;
    if (!refreshToken) {
      return res
        .status(401)
        .json({ error: "Failed", message: "Refresh token is required" });
    }

    const decoded = jwt.verify(refreshToken, process.env.REFRESH_TOKEN);
    if (decoded.role !== "user") {
      return res
        .status(401)
        .json({ error: "Failed", message: "Invalid or expired refresh token" });
    }

    const newAccessToken = generateAccessToken(decoded.id, "user");

    let userObj = undefined;
    try {
      const user = await User.findById(decoded.id).select("-password");
      if (user) {
        userObj = {
          id: user._id,
          username: user.username,
          name: user.name,
          email: user.email,
        };
      }
    } catch (e) {
      // Ignore DB lookup error for token refresh
    }

    return res.status(200).json({ accessToken: newAccessToken, user: userObj });
  } catch (error) {
    return res
      .status(401)
      .json({ error: "Failed", message: "Invalid or expired refresh token" });
  }
};

// POST /api/user/logout
export const logoutUser = async (req, res) => {
  try {
    res.clearCookie("refreshToken", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      path: "/",
    });
    res.status(200).json({ message: "Logged out successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal server error" });
  }
};

// GET /api/user/profile
// Protected — get current user profile
export const getUserProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("-password");
    if (!user) {
      return res
        .status(404)
        .json({ error: "Not Found", message: "User not found" });
    }

    const recipes = await Recipe.find({ author: user._id }).select("_id");
    const recipeIds = recipes.map((r) => r._id);
    let totalSavesReceived = 0;
    let uniqueUsersCount = 0;

    if (recipeIds.length > 0) {
      const usersSavingPosts = await User.find({
        savedRecipes: { $in: recipeIds },
      }).select("savedRecipes");

      uniqueUsersCount = usersSavingPosts.length;
      totalSavesReceived = usersSavingPosts.reduce((acc, u) => {
        const matches = (u.savedRecipes || []).filter((srId) =>
          recipeIds.some((rId) => rId.toString() === srId.toString())
        );
        return acc + matches.length;
      }, 0);
    }

    res.status(200).json({
      user: {
        id: user._id,
        username: user.username,
        name: user.name,
        email: user.email,
        createdAt: user.createdAt,
        totalSavesReceived,
        uniqueUsersCount,
      },
    });
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .json({ error: "Internal server error", message: error.message });
  }
};

// PUT /api/user/profile
// Protected — update user display name
export const updateUserProfile = async (req, res) => {
  try {
    const { name } = req.body;

    if (name !== undefined && typeof name !== "string") {
      return res
        .status(400)
        .json({ error: "Validation", message: "Name must be a string" });
    }

    const updates = {};
    if (name !== undefined) updates.name = name.trim();

    const user = await User.findByIdAndUpdate(
      req.user.id,
      { $set: updates },
      { new: true, runValidators: true }
    ).select("-password");

    if (!user) {
      return res
        .status(404)
        .json({ error: "Not Found", message: "User not found" });
    }

    // Sync updated authorName across all recipes authored by this user
    const updatedAuthorName =
      user.name && user.name.trim() ? user.name.trim() : user.username;
    await Recipe.updateMany(
      { author: user._id },
      { $set: { authorName: updatedAuthorName } }
    );

    res.status(200).json({
      message: "Profile updated successfully",
      user: {
        id: user._id,
        username: user.username,
        name: user.name,
        email: user.email,
      },
    });
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .json({ error: "Internal server error", message: error.message });
  }
};

// GET /api/user/commented-posts
// Protected — get all recipes the user has commented on
export const getCommentedPosts = async (req, res) => {
  try {
    const userId = req.user.id;

    // Find distinct recipe IDs from user's comments
    const recipeIds = await Comment.find({ user: userId }).distinct("recipe");

    // Fetch those recipes
    const recipes = await Recipe.find({
      _id: { $in: recipeIds },
      published: true,
    }).select("title slug description image authorName category createdAt");

    res.status(200).json({ recipes });
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .json({ error: "Internal server error", message: error.message });
  }
};

// GET /api/user/my-posts
// Protected — get all recipes created by the current logged-in user
export const getMyPosts = async (req, res) => {
  try {
    const userId = req.user.id;
    const authorObjectId = new mongoose.Types.ObjectId(userId);

    const recipes = await Recipe.aggregate([
      { $match: { author: authorObjectId } },
      {
        $lookup: {
          from: "users",
          localField: "_id",
          foreignField: "savedRecipes",
          as: "savedByUsers",
        },
      },
      {
        $addFields: {
          savedCount: { $size: "$savedByUsers" },
        },
      },
      {
        $project: {
          savedByUsers: 0,
        },
      },
      { $sort: { createdAt: -1 } },
    ]);

    const totalSavesReceived = recipes.reduce(
      (sum, r) => sum + (r.savedCount || 0),
      0
    );

    const recipeIds = recipes.map((r) => r._id);
    const uniqueUsersSaved = await User.distinct("_id", {
      savedRecipes: { $in: recipeIds },
    });

    res.status(200).json({
      recipes,
      totalSavesReceived,
      uniqueUsersCount: uniqueUsersSaved.length,
    });
  } catch (error) {
    console.error("getMyPosts error:", error);
    res
      .status(500)
      .json({ error: "Internal server error", message: error.message });
  }
};

// GET /api/user/search?q=query&hasRecipes=true&limit=20
// Public — search users by username or display name, optionally filter by active recipe publishers
export const searchUsers = async (req, res) => {
  try {
    const { q, hasRecipes, limit = 20 } = req.query;

    const filter = {};
    if (q && q.trim()) {
      const queryRegex = new RegExp(q.trim(), "i");
      filter.$or = [{ username: queryRegex }, { name: queryRegex }];
    }

    if (hasRecipes === "true") {
      // Find author ObjectIds that have at least one published recipe
      const activeAuthorIds = await Recipe.distinct("author", {
        published: true,
      });
      filter._id = { $in: activeAuthorIds };
    }

    const parsedLimit = Math.min(parseInt(limit) || 20, 100);

    const users = await User.find(filter)
      .select("username name createdAt")
      .sort({ createdAt: -1 })
      .limit(parsedLimit);

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
      ...u.toObject(),
      recipeCount: countMap[u._id.toString()] || 0,
    }));

    if (hasRecipes === "true") {
      enrichedUsers.sort((a, b) => b.recipeCount - a.recipeCount);
    }

    res.status(200).json({ users: enrichedUsers });
  } catch (error) {
    console.error("searchUsers error:", error);
    res
      .status(500)
      .json({ error: "Internal server error", message: error.message });
  }
};

// GET /api/user/public/:username
// Public — get public user details and published posts (excludes comments)
export const getPublicUserProfile = async (req, res) => {
  try {
    const { username } = req.params;

    const user = await User.findOne({
      username: { $regex: `^${username.trim()}$`, $options: "i" },
    }).select("username name createdAt");

    if (!user) {
      return res
        .status(404)
        .json({ error: "Not Found", message: "User not found" });
    }

    // Fetch published recipes created by this user with real savedCount
    const recipes = await Recipe.aggregate([
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
          as: "savedByUsers",
        },
      },
      {
        $addFields: {
          savedCount: { $size: "$savedByUsers" },
        },
      },
      {
        $project: {
          savedByUsers: 0,
        },
      },
      { $sort: { createdAt: -1 } },
    ]);

    const totalSavesReceived = recipes.reduce(
      (sum, r) => sum + (r.savedCount || 0),
      0
    );

    const recipeIds = recipes.map((r) => r._id);
    const uniqueUsersSaved = await User.distinct("_id", {
      savedRecipes: { $in: recipeIds },
    });

    res.status(200).json({
      user: {
        id: user._id,
        username: user.username,
        name: user.name,
        createdAt: user.createdAt,
        totalSavesReceived,
        uniqueUsersCount: uniqueUsersSaved.length,
      },
      recipes,
    });
  } catch (error) {
    console.error("getPublicUserProfile error:", error);
    res
      .status(500)
      .json({ error: "Internal server error", message: error.message });
  }
};

// GET /api/user/saved-recipes
// Protected — get all recipes saved by the authenticated user from MongoDB
export const getSavedRecipes = async (req, res) => {
  try {
    const userId = req.user.id;
    const user = await User.findById(userId).populate({
      path: "savedRecipes",
      match: { published: true },
      select:
        "title slug description image authorName category tags cookTime prepTime servings createdAt",
    });

    res.status(200).json({ recipes: user?.savedRecipes || [] });
  } catch (error) {
    console.error("getSavedRecipes error:", error);
    res
      .status(500)
      .json({ error: "Internal server error", message: error.message });
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
    console.error("toggleSaveRecipe error:", error);
    res
      .status(500)
      .json({ error: "Internal server error", message: error.message });
  }
};


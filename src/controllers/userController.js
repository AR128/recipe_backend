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
    res.status(200).json({
      user: {
        id: user._id,
        username: user.username,
        name: user.name,
        email: user.email,
        createdAt: user.createdAt,
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
    const recipes = await Recipe.find({ author: userId })
      .sort({ createdAt: -1 })
      .select(
        "title slug description image authorName category createdAt published"
      );

    res.status(200).json({ recipes });
  } catch (error) {
    console.error("getMyPosts error:", error);
    res
      .status(500)
      .json({ error: "Internal server error", message: error.message });
  }
};

// GET /api/user/search?q=query
// Public — search users by username or display name
export const searchUsers = async (req, res) => {
  try {
    const { q } = req.query;

    if (!q || !q.trim()) {
      return res.status(200).json({ users: [] });
    }

    const queryRegex = new RegExp(q.trim(), "i");
    const users = await User.find({
      $or: [{ username: queryRegex }, { name: queryRegex }],
    })
      .select("username name createdAt")
      .limit(20);

    res.status(200).json({ users });
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

    // Fetch published recipes created by this user
    const recipes = await Recipe.find({
      author: user._id,
      published: true,
    })
      .sort({ createdAt: -1 })
      .select(
        "title slug description image authorName category tags cookTime prepTime servings createdAt"
      );

    res.status(200).json({
      user: {
        id: user._id,
        username: user.username,
        name: user.name,
        createdAt: user.createdAt,
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

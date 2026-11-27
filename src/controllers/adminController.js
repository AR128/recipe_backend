import mongoose from "mongoose";
import { Comment } from "../models/Comment.js";
import { Recipe } from "../models/Recipe.js";
import { User } from "../models/User.js";
import { UserAccess } from "../models/UserAccess.js";
import { sendControllerError } from "../utils/controllerError.js";
import {
  escapeRegex,
  parsePagination,
  queryString,
  requireObjectBody,
} from "../utils/requestValidation.js";

const getSearchFilter = (search, fields) => {
  if (!search) return {};
  const expression = new RegExp(escapeRegex(search), "i");
  return { $or: fields.map((field) => ({ [field]: expression })) };
};

const deleteRecipeData = async (recipe) => {
  await Promise.all([
    Comment.deleteMany({ recipe: recipe._id }),
    User.updateMany(
      { savedRecipes: recipe._id },
      { $pull: { savedRecipes: recipe._id } }
    ),
  ]);
  await Recipe.findByIdAndDelete(recipe._id);
};

export const getAdminDashboard = async (req, res) => {
  try {
    const [users, posts] = await Promise.all([
      User.countDocuments(),
      Recipe.countDocuments(),
    ]);

    res.status(200).json({
      message: "Admin access verified.",
      user: req.user,
      stats: { users, posts },
    });
  } catch (error) {
    return sendControllerError(req, res, error, "getAdminDashboard");
  }
};

export const getAdminPosts = async (req, res) => {
  try {
    const pagination = parsePagination(req.query, {
      defaultLimit: 20,
      maxLimit: 50,
    });
    const search = queryString(req.query.search, "search", { max: 100 });
    const filter = getSearchFilter(search, [
      "title",
      "description",
      "authorName",
    ]);
    const [recipes, total] = await Promise.all([
      Recipe.find(filter)
        .select(
          "title slug description image authorName category published createdAt"
        )
        .populate("author", "username name fullName email")
        .sort({ createdAt: -1, _id: -1 })
        .skip(pagination.skip)
        .limit(pagination.limit)
        .lean(),
      Recipe.countDocuments(filter),
    ]);

    res.status(200).json({
      recipes,
      total,
      page: pagination.page,
      pages: Math.max(1, Math.ceil(total / pagination.limit)),
    });
  } catch (error) {
    return sendControllerError(req, res, error, "getAdminPosts");
  }
};

export const deleteAdminPost = async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({
        error: "Validation",
        message: "Post ID is invalid.",
      });
    }

    const recipe = await Recipe.findById(req.params.id);
    if (!recipe) {
      return res
        .status(404)
        .json({ error: "Not Found", message: "Post not found." });
    }

    await deleteRecipeData(recipe);
    res
      .status(200)
      .json({ message: "Post and related data permanently deleted." });
  } catch (error) {
    return sendControllerError(req, res, error, "deleteAdminPost");
  }
};

export const getAdminUsers = async (req, res) => {
  try {
    const pagination = parsePagination(req.query, {
      defaultLimit: 20,
      maxLimit: 50,
    });
    const search = queryString(req.query.search, "search", { max: 100 });
    const filter = getSearchFilter(search, [
      "username",
      "name",
      "fullName",
      "email",
    ]);
    const [users, total] = await Promise.all([
      User.find(filter)
        .select("username name fullName email createdAt")
        .sort({ createdAt: -1, _id: -1 })
        .skip(pagination.skip)
        .limit(pagination.limit)
        .lean(),
      User.countDocuments(filter),
    ]);
    const authorIds = users.map((user) => user._id);
    const postCounts = await Recipe.aggregate([
      { $match: { author: { $in: authorIds } } },
      { $group: { _id: "$author", count: { $sum: 1 } } },
    ]);
    const countsByAuthor = new Map(
      postCounts.map(({ _id, count }) => [_id.toString(), count])
    );

    res.status(200).json({
      users: users.map((user) => ({
        ...user,
        postCount: countsByAuthor.get(user._id.toString()) || 0,
      })),
      total,
      page: pagination.page,
      pages: Math.max(1, Math.ceil(total / pagination.limit)),
    });
  } catch (error) {
    return sendControllerError(req, res, error, "getAdminUsers");
  }
};

export const getAdminAccessRequests = async (req, res) => {
  try {
    const pagination = parsePagination(req.query, {
      defaultLimit: 20,
      maxLimit: 50,
    });
    const search = queryString(req.query.search, "search", { max: 100 });
    const filter = {
      status: "requested",
      ...getSearchFilter(search, ["displayName", "email"]),
    };
    const [requests, total] = await Promise.all([
      UserAccess.find(filter)
        .select("firebaseUid email displayName requestedAt")
        .sort({ requestedAt: -1, _id: -1 })
        .skip(pagination.skip)
        .limit(pagination.limit)
        .lean(),
      UserAccess.countDocuments(filter),
    ]);

    res.status(200).json({
      requests,
      total,
      page: pagination.page,
      pages: Math.max(1, Math.ceil(total / pagination.limit)),
    });
  } catch (error) {
    return sendControllerError(req, res, error, "getAdminAccessRequests");
  }
};

export const reviewAdminAccessRequest = async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({
        error: "Validation",
        message: "Access request ID is invalid.",
      });
    }

    const bodyError = requireObjectBody(req.body, ["action"]);
    if (bodyError) {
      return res.status(400).json({ error: "Validation", message: bodyError });
    }
    if (!["approve", "decline"].includes(req.body.action)) {
      return res.status(400).json({
        error: "Validation",
        message: "Action must be either approve or decline.",
      });
    }

    const status = req.body.action === "approve" ? "approved" : "denied";
    const request = await UserAccess.findOneAndUpdate(
      { _id: req.params.id, status: "requested" },
      { $set: { status } },
      { new: true, runValidators: true }
    ).select("email displayName status");

    if (!request) {
      const exists = await UserAccess.exists({ _id: req.params.id });
      if (!exists) {
        return res.status(404).json({
          error: "Not Found",
          message: "Access request not found.",
        });
      }
      return res.status(409).json({
        error: "Conflict",
        message: "This access request has already been reviewed.",
      });
    }

    res.status(200).json({
      message: `Access request ${req.body.action === "approve" ? "approved" : "declined"}.`,
      request,
    });
  } catch (error) {
    return sendControllerError(req, res, error, "reviewAdminAccessRequest");
  }
};

export const removeAdminUser = async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({
        error: "Validation",
        message: "User ID is invalid.",
      });
    }

    const user = await User.findById(req.params.id);
    if (!user) {
      return res
        .status(404)
        .json({ error: "Not Found", message: "User not found." });
    }
    if (!user.firebaseUid) {
      return res.status(409).json({
        error: "Conflict",
        message:
          "This account cannot be removed because it has no Firebase identity.",
      });
    }

    await UserAccess.findOneAndUpdate(
      {
        $or: [
          { firebaseUid: user.firebaseUid },
          { email: user.email.toLowerCase() },
        ],
      },
      {
        $set: {
          firebaseUid: user.firebaseUid,
          email: user.email,
          displayName: user.fullName || user.name || user.username,
          status: "removed",
          removedAt: new Date(),
        },
        $unset: { requestedAt: "" },
      },
      { upsert: true, runValidators: true, setDefaultsOnInsert: true }
    );

    const recipeIds = await Recipe.distinct("_id", { author: user._id });
    await Promise.all([
      Comment.deleteMany({
        $or: [{ user: user._id }, { recipe: { $in: recipeIds } }],
      }),
      Recipe.deleteMany({ author: user._id }),
      Recipe.updateMany({ likes: user._id }, { $pull: { likes: user._id } }),
      User.updateMany(
        { savedRecipes: { $in: recipeIds } },
        { $pull: { savedRecipes: { $in: recipeIds } } }
      ),
    ]);
    await User.findByIdAndDelete(user._id);

    res.status(200).json({
      message:
        "User, posts, comments, and personal references were permanently removed.",
    });
  } catch (error) {
    return sendControllerError(req, res, error, "removeAdminUser");
  }
};

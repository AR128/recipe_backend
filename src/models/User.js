import mongoose from "mongoose";
import { USERNAME_COLLATION } from "../utils/usernameCollation.js";

const userSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: [true, "Username is required"],
      trim: true,
      minlength: [2, "Username must be at least 2 characters long"],
      maxlength: [24, "Username must be 24 characters or fewer"],
      match: [
        /^[a-zA-Z0-9_]+$/,
        "Username can only contain letters, numbers, and underscores",
      ],
    },
    name: {
      type: String,
      trim: true,
      default: "",
    },
    fullName: {
      type: String,
      trim: true,
      maxlength: [80, "Full name must be 80 characters or fewer"],
      default: "",
    },
    firebaseUid: {
      type: String,
      unique: true,
      sparse: true,
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      lowercase: true,
      match: [/^\S+@\S+\.\S+$/, "Please provide a valid email address"],
    },
    savedRecipes: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Recipe",
      },
    ],
  },
  {
    timestamps: true,
  }
);

userSchema.index(
  { username: 1 },
  {
    unique: true,
    collation: USERNAME_COLLATION,
    name: "username_unique_ci",
  }
);
userSchema.index({ savedRecipes: 1 });

export const User = mongoose.model("User", userSchema);

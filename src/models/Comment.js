import mongoose from "mongoose";

const commentSchema = new mongoose.Schema(
  {
    recipe: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Recipe",
      required: [true, "Recipe reference is required"],
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "User reference is required"],
    },
    text: {
      type: String,
      required: [true, "Comment text is required"],
      trim: true,
      minlength: [1, "Comment cannot be empty"],
      maxlength: [1000, "Comment cannot exceed 1000 characters"],
    },
  },
  {
    timestamps: true,
  }
);

commentSchema.index({ recipe: 1, createdAt: -1 });
commentSchema.index({ user: 1, recipe: 1 });

export const Comment = mongoose.model("Comment", commentSchema);

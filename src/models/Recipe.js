import mongoose from "mongoose";

const ingredientSchema = new mongoose.Schema({
  amount: { type: String, trim: true },
  item: { type: String, required: true, trim: true },
});

const recipeSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, "Title is required"],
      trim: true,
      maxlength: [200, "Title cannot exceed 200 characters"],
    },
    slug: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    description: {
      type: String,
      required: [true, "Description is required"],
      trim: true,
      maxlength: [500, "Description cannot exceed 500 characters"],
    },
    content: {
      type: String,
      default: "",
    },
    image: {
      type: String,
      default: "",
    },
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Admin",
      required: true,
    },
    authorName: {
      type: String,
      default: "Chef",
    },
    category: {
      type: String,
      trim: true,
      default: "General",
    },
    tags: [{ type: String, trim: true }],
    cookTime: {
      type: String,
      default: "",
    },
    prepTime: {
      type: String,
      default: "",
    },
    servings: {
      type: Number,
      default: 4,
    },
    ingredients: [ingredientSchema],
    steps: [
      {
        type: String,
        trim: true,
      },
    ],
    published: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

recipeSchema.pre("validate", function () {
  if (!this.slug && this.title) {
    this.slug = this.title
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, "")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-")
      .trim();
  }
});

export const Recipe = mongoose.model("Recipe", recipeSchema);

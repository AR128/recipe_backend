import mongoose from "mongoose";

const ingredientSchema = new mongoose.Schema({
  amount: { type: String, trim: true, maxlength: 40 },
  item: { type: String, required: true, trim: true, maxlength: 120 },
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
      maxlength: 20000,
    },
    image: {
      type: String,
      default: "",
      maxlength: 2048,
    },
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    authorName: {
      type: String,
      default: "Chef",
      maxlength: 80,
    },
    likes: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    category: {
      type: String,
      trim: true,
      default: "General",
      maxlength: 80,
    },
    tags: [{ type: String, trim: true, maxlength: 40 }],
    cookTime: {
      type: String,
      default: "",
      maxlength: 40,
    },
    prepTime: {
      type: String,
      default: "",
      maxlength: 40,
    },
    servings: {
      type: Number,
      default: 4,
      min: 1,
      max: 100,
    },
    ingredients: {
      type: [ingredientSchema],
      validate: {
        validator: (ingredients) => ingredients.length <= 100,
        message: "A recipe cannot have more than 100 ingredients.",
      },
    },
    steps: {
      type: [
        {
          type: String,
          trim: true,
          maxlength: 2000,
        },
      ],
      validate: {
        validator: (steps) => steps.length <= 50,
        message: "A recipe cannot have more than 50 steps.",
      },
    },
    published: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

recipeSchema.index({ published: 1, createdAt: -1 });
recipeSchema.index({ author: 1, createdAt: -1 });
recipeSchema.index(
  { published: 1, category: 1, createdAt: -1 },
  { collation: { locale: "en", strength: 2 } }
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

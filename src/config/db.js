import mongoose from "mongoose";
import { User } from "../models/User.js";
import { Recipe } from "../models/Recipe.js";
import { Comment } from "../models/Comment.js";

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("✅ MongoDB Connected.");
    await Promise.all([
      User.createIndexes(),
      Recipe.createIndexes(),
      Comment.createIndexes(),
    ]);
    console.log("Application indexes are ready.");
  } catch (error) {
    console.error(`❌ Database connection error: ${error.message}`);
    process.exit(1);
  }
};

export default connectDB;

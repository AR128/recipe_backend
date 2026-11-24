import mongoose from "mongoose";

const userAccessSchema = new mongoose.Schema(
  {
    firebaseUid: {
      type: String,
      required: true,
      unique: true,
    },
    email: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
      unique: true,
    },
    displayName: {
      type: String,
      default: "",
      maxlength: 80,
    },
    status: {
      type: String,
      enum: ["removed", "requested", "approved", "denied"],
      required: true,
    },
    requestedAt: Date,
    removedAt: Date,
  },
  { timestamps: true }
);

userAccessSchema.index({ status: 1, updatedAt: -1 });

export const UserAccess = mongoose.model("UserAccess", userAccessSchema);

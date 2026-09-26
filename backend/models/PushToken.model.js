import mongoose from "mongoose";

const pushTokenSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      index: true,
    },
    userModel: {
      type: String,
      enum: ["Employee", "User", "Household", "Company"],
      default: "Employee",
    },
    expoPushToken: {
      type: String,
      required: true,
      trim: true,
    },
    deviceId: {
      type: String,
      trim: true,
      default: "",
    },
    platform: {
      type: String,
      enum: ["android", "ios", "web"],
      default: "android",
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
    lastUsedAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

// Prevent duplicate token entries for same user
pushTokenSchema.index({ user: 1, expoPushToken: 1 }, { unique: true });
pushTokenSchema.index({ user: 1, isActive: 1 });

export default mongoose.model("PushToken", pushTokenSchema);

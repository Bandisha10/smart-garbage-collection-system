import mongoose from "mongoose";

const notificationSchema = new mongoose.Schema(
  {
    recipient: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      index: true,
    },
    recipientModel: {
      type: String,
      enum: ["Employee", "User", "Household", "Company"],
      default: "Employee",
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    message: {
      type: String,
      required: true,
      trim: true,
    },
    type: {
      type: String,
      enum: [
        "ROUTE_ASSIGNED",
        "COLLECTION_REMINDER",
        "ISSUE_UPDATE",
        "ATTENDANCE",
        "SYNC_COMPLETE",
        "SYSTEM",
      ],
      default: "SYSTEM",
      index: true,
    },
    data: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    isRead: {
      type: Boolean,
      default: false,
      index: true,
    },
  },
  { timestamps: true }
);

notificationSchema.index({ recipient: 1, createdAt: -1 });
notificationSchema.index({ recipient: 1, isRead: 1 });

export default mongoose.model("Notification", notificationSchema);

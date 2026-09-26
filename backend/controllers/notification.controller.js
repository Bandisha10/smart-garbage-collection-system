import Notification from "../models/Notification.model.js";
import PushToken from "../models/PushToken.model.js";
import { Expo } from "expo-server-sdk";
import { sendNotification } from "../services/notification.service.js";

// @desc    Register / Update Expo Push Token for authenticated user
// @route   POST /api/notifications/register-token
// @access  Private
export const registerPushToken = async (req, res) => {
  try {
    const { expoPushToken, deviceId, platform = "android" } = req.body;
    const userId = req.user._id;
    const userRole = req.user.role;

    if (!expoPushToken || typeof expoPushToken !== "string") {
      return res.status(400).json({
        success: false,
        message: "Valid expoPushToken string is required.",
      });
    }

    if (!Expo.isExpoPushToken(expoPushToken)) {
      return res.status(400).json({
        success: false,
        message: "Invalid Expo push token format.",
      });
    }

    const userModel = userRole === "EMPLOYEE" ? "Employee" : "User";

    // 1. If deviceId is provided, deactivate any old tokens registered for this exact device by this user
    if (deviceId) {
      await PushToken.updateMany(
        { user: userId, deviceId, expoPushToken: { $ne: expoPushToken } },
        { isActive: false }
      );
    }

    // 2. Upsert the token for this user
    const tokenDoc = await PushToken.findOneAndUpdate(
      { user: userId, expoPushToken },
      {
        user: userId,
        userModel,
        expoPushToken,
        deviceId: deviceId || "",
        platform: platform.toLowerCase(),
        isActive: true,
        lastUsedAt: new Date(),
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    return res.status(200).json({
      success: true,
      message: "Push token registered successfully.",
      tokenId: tokenDoc._id,
    });
  } catch (error) {
    console.error("Register Push Token Error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to register push token.",
      error: error.message,
    });
  }
};

// @desc    Get all notifications for authenticated user
// @route   GET /api/notifications
// @access  Private
export const getUserNotifications = async (req, res) => {
  try {
    const userId = req.user._id;
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 30;
    const skip = (page - 1) * limit;

    const [notifications, total, unreadCount] = await Promise.all([
      Notification.find({ recipient: userId })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Notification.countDocuments({ recipient: userId }),
      Notification.countDocuments({ recipient: userId, isRead: false }),
    ]);

    return res.status(200).json({
      success: true,
      notifications,
      unreadCount,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Get Notifications Error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch notifications.",
      error: error.message,
    });
  }
};

// @desc    Get unread notification count
// @route   GET /api/notifications/unread-count
// @access  Private
export const getUnreadCount = async (req, res) => {
  try {
    const userId = req.user._id;
    const unreadCount = await Notification.countDocuments({
      recipient: userId,
      isRead: false,
    });

    return res.status(200).json({
      success: true,
      unreadCount,
    });
  } catch (error) {
    console.error("Get Unread Count Error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to get unread count.",
      error: error.message,
    });
  }
};

// @desc    Mark a single notification as read
// @route   PATCH /api/notifications/:id/read
// @access  Private
export const markAsRead = async (req, res) => {
  try {
    const userId = req.user._id;
    const { id } = req.params;

    const notification = await Notification.findOneAndUpdate(
      { _id: id, recipient: userId },
      { isRead: true },
      { new: true }
    );

    if (!notification) {
      return res.status(404).json({
        success: false,
        message: "Notification not found or access denied.",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Notification marked as read.",
      notification,
    });
  } catch (error) {
    console.error("Mark Read Error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to update notification.",
      error: error.message,
    });
  }
};

// @desc    Mark all notifications as read for current user
// @route   PATCH /api/notifications/read-all
// @access  Private
export const markAllAsRead = async (req, res) => {
  try {
    const userId = req.user._id;

    const result = await Notification.updateMany(
      { recipient: userId, isRead: false },
      { isRead: true }
    );

    return res.status(200).json({
      success: true,
      message: "All notifications marked as read.",
      modifiedCount: result.modifiedCount,
    });
  } catch (error) {
    console.error("Mark All Read Error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to mark all as read.",
      error: error.message,
    });
  }
};

// @desc    Send a test push notification to authenticated user
// @route   POST /api/notifications/test
// @access  Private
export const sendTestNotification = async (req, res) => {
  try {
    const userId = req.user._id;
    const { title = "EcoSyz Test Notification", message = "Real push notifications are working on your Android device! 🎉", data = {} } = req.body;

    const notification = await sendNotification({
      recipient: userId,
      recipientModel: req.user.role === "EMPLOYEE" ? "Employee" : "User",
      title,
      message,
      type: "SYSTEM",
      data: {
        screen: "/(tabs)",
        ...data,
      },
    });

    return res.status(200).json({
      success: true,
      message: "Test push notification dispatched.",
      notification,
    });
  } catch (error) {
    console.error("Send Test Notification Error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to send test notification.",
      error: error.message,
    });
  }
};

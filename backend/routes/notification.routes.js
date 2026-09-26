import express from "express";
import {
  registerPushToken,
  getUserNotifications,
  getUnreadCount,
  markAsRead,
  markAllAsRead,
  sendTestNotification,
} from "../controllers/notification.controller.js";
import { protect } from "../middleware/auth.middleware.js";

const router = express.Router();

router.post("/register-token", protect, registerPushToken);
router.get("/", protect, getUserNotifications);
router.get("/unread-count", protect, getUnreadCount);
router.patch("/:id/read", protect, markAsRead);
router.patch("/read-all", protect, markAllAsRead);
router.post("/test", protect, sendTestNotification);

export default router;

import { Expo } from "expo-server-sdk";
import Notification from "../models/Notification.model.js";
import PushToken from "../models/PushToken.model.js";

// Initialize Expo SDK client
const expo = new Expo();

/**
 * Core function to create an in-app notification in DB and dispatch Expo push notification
 * Non-blocking: Errors are caught and logged, never throwing to caller.
 */
export const sendNotification = async ({
  recipient,
  recipientModel = "Employee",
  title,
  message,
  type = "SYSTEM",
  data = {},
  channelId = "ecosyz-default",
}) => {
  try {
    if (!recipient || !title || !message) {
      console.warn("⚠️ Notification skipped: Missing recipient, title, or message.");
      return null;
    }

    // 1. Store Notification in MongoDB
    let savedNotification = null;
    try {
      savedNotification = await Notification.create({
        recipient,
        recipientModel,
        title,
        message,
        type,
        data,
      });
    } catch (dbErr) {
      console.error("❌ Failed to save Notification to DB:", dbErr.message);
    }

    // 2. Fetch Active Push Tokens for the recipient
    const activeTokens = await PushToken.find({
      user: recipient,
      isActive: true,
    }).lean();

    if (!activeTokens || activeTokens.length === 0) {
      console.log(`ℹ️ No active push tokens found for recipient ${recipient}.`);
      return savedNotification;
    }

    // 3. Build Expo push messages
    const messages = [];
    const validTokenDocs = [];

    for (const tokenDoc of activeTokens) {
      const token = tokenDoc.expoPushToken;
      if (!Expo.isExpoPushToken(token)) {
        console.warn(`⚠️ Invalid Expo push token format: ${token}. Deactivating.`);
        await PushToken.updateOne({ _id: tokenDoc._id }, { isActive: false }).catch(() => {});
        continue;
      }

      messages.push({
        to: token,
        sound: "default",
        title,
        body: message,
        data: {
          ...data,
          notificationId: savedNotification?._id?.toString() || "",
          type,
        },
        channelId,
        priority: "high",
        badge: 1,
      });
      validTokenDocs.push(tokenDoc);
    }

    if (messages.length === 0) {
      return savedNotification;
    }

    // 4. Chunk messages and send via Expo
    const chunks = expo.chunkPushNotifications(messages);
    for (let i = 0; i < chunks.length; i++) {
      const chunk = chunks[i];
      try {
        const ticketChunk = await expo.sendPushNotificationsAsync(chunk);
        
        // Check ticket responses for deactivated tokens
        for (let j = 0; j < ticketChunk.length; j++) {
          const ticket = ticketChunk[j];
          if (ticket.status === "error") {
            console.error(`❌ Push Ticket Error for token ${chunk[j]?.to}:`, ticket.message, ticket.details);
            if (ticket.details?.error === "DeviceNotRegistered") {
              // Token is no longer valid, deactivate in DB
              const badTokenDoc = validTokenDocs[j];
              if (badTokenDoc) {
                await PushToken.updateOne({ _id: badTokenDoc._id }, { isActive: false }).catch(() => {});
                console.log(`ℹ️ Deactivated invalid token: ${badTokenDoc.expoPushToken}`);
              }
            }
          }
        }
      } catch (chunkErr) {
        console.error("❌ Error sending push notification chunk:", chunkErr.message);
      }
    }

    console.log(`✅ Push notification sent to user ${recipient} [${type}]: "${title}"`);
    return savedNotification;
  } catch (err) {
    console.error("❌ Notification Service Exception:", err.message);
    return null;
  }
};

/**
 * Route Assignment Event Notification
 */
export const notifyRouteAssigned = async ({ driverId, routeName, routeCode, routeId }) => {
  return sendNotification({
    recipient: driverId,
    recipientModel: "Employee",
    title: "New Route Assigned",
    message: `You have been assigned route "${routeName}" (${routeCode || "Active"}).`,
    type: "ROUTE_ASSIGNED",
    data: {
      screen: "/(tabs)/map",
      routeId: routeId?.toString() || "",
    },
  });
};

/**
 * Attendance Recorded Event Notification
 */
export const notifyAttendance = async ({ labourId, statusText = "Present", source = "QR" }) => {
  return sendNotification({
    recipient: labourId,
    recipientModel: "Employee",
    title: "Attendance Recorded",
    message: `Your attendance has been marked as ${statusText} (via ${source}).`,
    type: "ATTENDANCE",
    data: {
      screen: "/attendance",
    },
  });
};

/**
 * Issue / Complaint Update Event Notification
 */
export const notifyIssueUpdated = async ({ recipientId, complaintId, status, details }) => {
  return sendNotification({
    recipient: recipientId,
    recipientModel: "Employee",
    title: "Collection Issue Updated",
    message: details || `Complaint #${complaintId} has been updated to status: ${status}.`,
    type: "ISSUE_UPDATE",
    data: {
      screen: "/raise-query",
      complaintId: complaintId?.toString() || "",
    },
  });
};

/**
 * Offline Sync Completed Notification
 */
export const notifySyncComplete = async ({ labourId, count = 0 }) => {
  return sendNotification({
    recipient: labourId,
    recipientModel: "Employee",
    title: "Sync Complete",
    message: `Successfully synchronized ${count} offline collection record(s).`,
    type: "SYNC_COMPLETE",
    data: {
      screen: "/(tabs)",
    },
  });
};

/**
 * General System Notification
 */
export const notifySystem = async ({ recipientId, title, message, data = {} }) => {
  return sendNotification({
    recipient: recipientId,
    recipientModel: "Employee",
    title,
    message,
    type: "SYSTEM",
    data,
  });
};

export default {
  sendNotification,
  notifyRouteAssigned,
  notifyAttendance,
  notifyIssueUpdated,
  notifySyncComplete,
  notifySystem,
};

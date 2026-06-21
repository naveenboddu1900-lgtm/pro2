import { Router } from "express";
import { requireAuth } from "../middleware/auth.js";
import { Notification } from "../models/index.js";

export const notificationsRouter = Router();

notificationsRouter.use(requireAuth);

function serializeNotification(notification) {
  return {
    id: notification._id,
    workspace: notification.workspace,
    board: notification.board,
    card: notification.card,
    type: notification.type,
    title: notification.title,
    message: notification.message,
    readAt: notification.readAt,
    createdAt: notification.createdAt
  };
}

notificationsRouter.get("/", async (req, res, next) => {
  try {
    const unreadOnly = req.query.unread === "true";
    const query = { user: req.user._id };

    if (unreadOnly) {
      query.readAt = null;
    }

    const notifications = await Notification.find(query).sort({ createdAt: -1 }).limit(50);
    const unreadCount = await Notification.countDocuments({ user: req.user._id, readAt: null });

    return res.json({
      notifications: notifications.map(serializeNotification),
      unreadCount
    });
  } catch (error) {
    return next(error);
  }
});

notificationsRouter.patch("/:notificationId/read", async (req, res, next) => {
  try {
    const notification = await Notification.findOneAndUpdate(
      { _id: req.params.notificationId, user: req.user._id },
      { readAt: new Date() },
      { new: true }
    );

    if (!notification) {
      return res.status(404).json({ message: "Notification not found" });
    }

    return res.json({ notification: serializeNotification(notification) });
  } catch (error) {
    return next(error);
  }
});

notificationsRouter.patch("/read-all", async (req, res, next) => {
  try {
    const result = await Notification.updateMany(
      { user: req.user._id, readAt: null },
      { readAt: new Date() }
    );

    return res.json({ updated: result.modifiedCount });
  } catch (error) {
    return next(error);
  }
});

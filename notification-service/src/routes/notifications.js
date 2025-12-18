// ===== src/routes/notifications.js =====
const express = require("express");
const router = express.Router();
const authMiddleware = require("../middleware/auth");
const rateLimit = require("express-rate-limit");
const {
  getNotifications,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  getUnreadCount,
  getUserPreferences,
  updateUserPreferences,
} = require("../services/notification-service");

// Rate limiting
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || 900000),
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || 100),
  message: "Too many requests",
});

router.use(authMiddleware);
router.use(limiter);

// GET /api/notifications - Get all notifications
router.get("/", async (req, res) => {
  try {
    const { limit, offset, unreadOnly } = req.query;

    const notifications = await getNotifications(req.userId, {
      limit: parseInt(limit) || 50,
      offset: parseInt(offset) || 0,
      unreadOnly: unreadOnly === "true",
    });

    res.json({
      notifications,
      count: notifications.length,
    });
  } catch (error) {
    console.error("Error fetching notifications:", error);
    res.status(500).json({ error: "Failed to fetch notifications" });
  }
});

// GET /api/notifications/unread-count
router.get("/unread-count", async (req, res) => {
  try {
    const count = await getUnreadCount(req.userId);
    res.json({ count });
  } catch (error) {
    console.error("Error fetching unread count:", error);
    res.status(500).json({ error: "Failed to fetch unread count" });
  }
});

// PUT /api/notifications/:id/read
router.put("/:id/read", async (req, res) => {
  try {
    const notification = await markAsRead(parseInt(req.params.id), req.userId);

    if (!notification) {
      return res.status(404).json({ error: "Notification not found" });
    }

    res.json(notification);
  } catch (error) {
    console.error("Error marking notification as read:", error);
    res.status(500).json({ error: "Failed to mark as read" });
  }
});

// PUT /api/notifications/mark-all-read
router.put("/mark-all-read", async (req, res) => {
  try {
    await markAllAsRead(req.userId);
    res.json({ message: "All notifications marked as read" });
  } catch (error) {
    console.error("Error marking all as read:", error);
    res.status(500).json({ error: "Failed to mark all as read" });
  }
});

// DELETE /api/notifications/:id
router.delete("/:id", async (req, res) => {
  try {
    const notification = await deleteNotification(
      parseInt(req.params.id),
      req.userId
    );

    if (!notification) {
      return res.status(404).json({ error: "Notification not found" });
    }

    res.json({ message: "Notification deleted" });
  } catch (error) {
    console.error("Error deleting notification:", error);
    res.status(500).json({ error: "Failed to delete notification" });
  }
});

// GET /api/notifications/preferences
router.get("/preferences", async (req, res) => {
  try {
    const preferences = await getUserPreferences(req.userId);
    res.json(preferences);
  } catch (error) {
    console.error("Error fetching preferences:", error);
    res.status(500).json({ error: "Failed to fetch preferences" });
  }
});

// PUT /api/notifications/preferences
router.put("/preferences", async (req, res) => {
  try {
    const preferences = await updateUserPreferences(req.userId, req.body);
    res.json(preferences);
  } catch (error) {
    console.error("Error updating preferences:", error);
    res.status(500).json({ error: "Failed to update preferences" });
  }
});

module.exports = router;

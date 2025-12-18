// ===== src/services/socket-handler.js =====
const logger = require("../utils/logger");
const {
  markAsRead,
  markAllAsRead,
  deleteNotification,
  getUnreadCount,
} = require("./notification-service");

function setupSocketHandlers(io, socket) {
  const userId = socket.userId;

  // Client requests unread count
  socket.on("get:unread-count", async (callback) => {
    try {
      const count = await getUnreadCount(userId);
      callback({ success: true, count });
    } catch (error) {
      logger.error("Error getting unread count:", error);
      callback({ success: false, error: error.message });
    }
  });

  // Client marks notification as read
  socket.on("mark:read", async (notificationId, callback) => {
    try {
      await markAsRead(notificationId, userId);

      // Emit updated count to all user's connections
      const count = await getUnreadCount(userId);
      io.to(`user:${userId}`).emit("unread-count", count);

      callback({ success: true });
    } catch (error) {
      logger.error("Error marking as read:", error);
      callback({ success: false, error: error.message });
    }
  });

  // Client marks all as read
  socket.on("mark-all:read", async (callback) => {
    try {
      await markAllAsRead(userId);

      // Emit updated count
      io.to(`user:${userId}`).emit("unread-count", 0);

      callback({ success: true });
    } catch (error) {
      logger.error("Error marking all as read:", error);
      callback({ success: false, error: error.message });
    }
  });

  // Client deletes notification
  socket.on("delete:notification", async (notificationId, callback) => {
    try {
      await deleteNotification(notificationId, userId);

      // Emit updated count
      const count = await getUnreadCount(userId);
      io.to(`user:${userId}`).emit("unread-count", count);

      callback({ success: true });
    } catch (error) {
      logger.error("Error deleting notification:", error);
      callback({ success: false, error: error.message });
    }
  });

  // Send current unread count on connect
  getUnreadCount(userId).then((count) => {
    socket.emit("unread-count", count);
  });
}

module.exports = { setupSocketHandlers };

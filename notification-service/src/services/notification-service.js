// ===== src/services/notification-service.js =====
const db = require("../db/postgres");
const redisClient = require("../db/redis");
const logger = require("../utils/logger");

async function createNotification(data) {
  const {
    userId,
    type,
    title,
    message,
    severity = "INFO",
    dataObj = {},
  } = data;

  // Check user preferences
  const prefs = await getUserPreferences(userId);
  const prefKey = getPreferenceKey(type);

  if (!prefs[prefKey]) {
    logger.info(`User ${userId} has ${type} notifications disabled`);
    return null;
  }

  // Calculate expiration (30 days)
  const expiresAt = new Date();
  expiresAt.setDate(
    expiresAt.getDate() + parseInt(process.env.NOTIFICATION_TTL_DAYS || 30)
  );

  const result = await db.query(
    `INSERT INTO notifications 
     (user_id, type, title, message, severity, data, expires_at) 
     VALUES ($1, $2, $3, $4, $5, $6, $7) 
     RETURNING *`,
    [userId, type, title, message, severity, JSON.stringify(dataObj), expiresAt]
  );

  const notification = result.rows[0];

  // Update unread count in Redis
  await incrementUnreadCount(userId);

  return notification;
}

async function getNotifications(userId, options = {}) {
  const { limit = 50, offset = 0, unreadOnly = false } = options;

  let query = `
    SELECT * FROM notifications 
    WHERE user_id = $1
  `;
  const params = [userId];

  if (unreadOnly) {
    query += ` AND read = FALSE`;
  }

  query += ` ORDER BY created_at DESC LIMIT $2 OFFSET $3`;
  params.push(limit, offset);

  const result = await db.query(query, params);
  return result.rows;
}

async function markAsRead(notificationId, userId) {
  const result = await db.query(
    `UPDATE notifications 
     SET read = TRUE, read_at = NOW() 
     WHERE id = $1 AND user_id = $2 
     RETURNING *`,
    [notificationId, userId]
  );

  if (result.rows.length > 0) {
    await decrementUnreadCount(userId);
  }

  return result.rows[0];
}

async function markAllAsRead(userId) {
  await db.query(
    `UPDATE notifications 
     SET read = TRUE, read_at = NOW() 
     WHERE user_id = $1 AND read = FALSE`,
    [userId]
  );

  // Reset unread count
  await redisClient.set(`unread:${userId}`, "0");
}

async function deleteNotification(notificationId, userId) {
  const result = await db.query(
    `DELETE FROM notifications 
     WHERE id = $1 AND user_id = $2 
     RETURNING *`,
    [notificationId, userId]
  );

  if (result.rows.length > 0 && !result.rows[0].read) {
    await decrementUnreadCount(userId);
  }

  return result.rows[0];
}

async function getUnreadCount(userId) {
  // Try Redis first
  const cached = await redisClient.get(`unread:${userId}`);
  if (cached !== null) {
    return parseInt(cached);
  }

  // Fallback to database
  const result = await db.query(
    "SELECT COUNT(*) FROM notifications WHERE user_id = $1 AND read = FALSE",
    [userId]
  );

  const count = parseInt(result.rows[0].count);

  // Cache in Redis
  await redisClient.set(`unread:${userId}`, count.toString(), { EX: 3600 });

  return count;
}

async function getUserPreferences(userId) {
  const result = await db.query(
    "SELECT * FROM notification_preferences WHERE user_id = $1",
    [userId]
  );

  if (result.rows.length === 0) {
    // Create default preferences
    const defaults = {
      hazard_alerts: true,
      route_updates: true,
      ai_responses: true,
      system_notifications: true,
      sound_enabled: true,
    };

    await db.query(
      `INSERT INTO notification_preferences 
       (user_id, hazard_alerts, route_updates, ai_responses, system_notifications, sound_enabled) 
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [
        userId,
        defaults.hazard_alerts,
        defaults.route_updates,
        defaults.ai_responses,
        defaults.system_notifications,
        defaults.sound_enabled,
      ]
    );

    return defaults;
  }

  return result.rows[0];
}

async function updateUserPreferences(userId, preferences) {
  const result = await db.query(
    `INSERT INTO notification_preferences 
     (user_id, hazard_alerts, route_updates, ai_responses, system_notifications, sound_enabled, updated_at) 
     VALUES ($1, $2, $3, $4, $5, $6, NOW()) 
     ON CONFLICT (user_id) 
     DO UPDATE SET 
       hazard_alerts = $2, 
       route_updates = $3, 
       ai_responses = $4, 
       system_notifications = $5, 
       sound_enabled = $6,
       updated_at = NOW()
     RETURNING *`,
    [
      userId,
      preferences.hazard_alerts,
      preferences.route_updates,
      preferences.ai_responses,
      preferences.system_notifications,
      preferences.sound_enabled,
    ]
  );

  return result.rows[0];
}

// Helper functions
async function incrementUnreadCount(userId) {
  await redisClient.incr(`unread:${userId}`);
}

async function decrementUnreadCount(userId) {
  const current = await redisClient.get(`unread:${userId}`);
  if (current && parseInt(current) > 0) {
    await redisClient.decr(`unread:${userId}`);
  }
}

function getPreferenceKey(type) {
  const mapping = {
    HAZARD_ALERT: "hazard_alerts",
    ROUTE_UPDATE: "route_updates",
    AI_RESPONSE: "ai_responses",
    SYSTEM: "system_notifications",
  };
  return mapping[type] || "system_notifications";
}

module.exports = {
  createNotification,
  getNotifications,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  getUnreadCount,
  getUserPreferences,
  updateUserPreferences,
};

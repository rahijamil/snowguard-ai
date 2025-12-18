// ===== src/db/init.js =====
const db = require("./postgres");
const logger = require("../utils/logger");

async function initializeDatabase() {
  const createTablesQuery = `
    -- Notifications table
    CREATE TABLE IF NOT EXISTS notifications (
      id SERIAL PRIMARY KEY,
      user_id INTEGER NOT NULL,
      type VARCHAR(50) NOT NULL,
      title VARCHAR(255) NOT NULL,
      message TEXT NOT NULL,
      severity VARCHAR(20) DEFAULT 'INFO',
      data JSONB,
      read BOOLEAN DEFAULT FALSE,
      read_at TIMESTAMP,
      created_at TIMESTAMP DEFAULT NOW(),
      expires_at TIMESTAMP
    );

    -- Indexes
    CREATE INDEX IF NOT EXISTS idx_user_unread ON notifications(user_id, read);
    CREATE INDEX IF NOT EXISTS idx_user_created ON notifications(user_id, created_at DESC);
    CREATE INDEX IF NOT EXISTS idx_expires ON notifications(expires_at);

    -- Notification preferences
    CREATE TABLE IF NOT EXISTS notification_preferences (
      user_id INTEGER PRIMARY KEY,
      hazard_alerts BOOLEAN DEFAULT TRUE,
      route_updates BOOLEAN DEFAULT TRUE,
      ai_responses BOOLEAN DEFAULT TRUE,
      system_notifications BOOLEAN DEFAULT TRUE,
      sound_enabled BOOLEAN DEFAULT TRUE,
      updated_at TIMESTAMP DEFAULT NOW()
    );
  `;

  try {
    await db.query(createTablesQuery);
    logger.info("✅ Database tables initialized");
  } catch (error) {
    logger.error("Failed to initialize database:", error);
    throw error;
  }
}

module.exports = initializeDatabase;

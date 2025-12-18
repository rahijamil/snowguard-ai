// ===== src/services/subscriber.js =====
const { createClient } = require("redis");
const logger = require("../utils/logger");
const { createNotification } = require("./notification-service");

const subscriberClient = createClient({
  socket: {
    host: process.env.REDIS_HOST || "localhost",
    port: parseInt(process.env.REDIS_PORT || "6379"),
  },
});

async function initializeSubscribers(io) {
  await subscriberClient.connect();

  // Subscribe to channels
  const channels = [
    "hazard:alerts",
    "route:updates",
    "ai:responses",
    "user:updates",
  ];

  for (const channel of channels) {
    await subscriberClient.subscribe(channel, async (message) => {
      try {
        const event = JSON.parse(message);
        logger.info(`📨 Received event from ${channel}:`, event);

        // Process and emit notification
        await handleEvent(io, channel, event);
      } catch (error) {
        logger.error(`Error processing message from ${channel}:`, error);
      }
    });
  }

  logger.info(`✅ Subscribed to ${channels.length} channels`);
}

async function handleEvent(io, channel, event) {
  let notification;

  switch (channel) {
    case "hazard:alerts":
      notification = {
        userId: event.userId,
        type: "HAZARD_ALERT",
        title: `${event.severity > 80 ? "🚨 SEVERE" : "⚠️"} Hazard Alert`,
        message: `${event.hazardType} detected with severity ${event.severity}`,
        severity:
          event.severity > 80
            ? "DANGER"
            : event.severity > 60
            ? "WARNING"
            : "INFO",
        data: {
          hazardType: event.hazardType,
          severity: event.severity,
          location: event.location,
        },
      };
      break;

    case "route:updates":
      notification = {
        userId: event.userId,
        type: "ROUTE_UPDATE",
        title: "🚗 Route Conditions Changed",
        message: `Your route risk score is now ${event.riskScore}`,
        severity: event.riskScore > 70 ? "WARNING" : "INFO",
        data: {
          routeId: event.routeId,
          riskScore: event.riskScore,
        },
      };
      break;

    case "ai:responses":
      notification = {
        userId: event.userId,
        type: "AI_RESPONSE",
        title: "💬 AI Response Ready",
        message: event.message || "Your safety analysis is complete",
        severity: "INFO",
        data: {
          chatId: event.chatId,
        },
      };
      break;

    case "user:updates":
      notification = {
        userId: event.userId,
        type: "SYSTEM",
        title: event.title || "✅ Update",
        message: event.message,
        severity: "INFO",
        data: event.data,
      };
      break;

    default:
      logger.warn(`Unknown channel: ${channel}`);
      return;
  }

  // Save and emit notification
  const saved = await createNotification(notification);

  // Emit to user's WebSocket
  io.to(`user:${notification.userId}`).emit("notification", saved);

  logger.info(`📤 Notification sent to user ${notification.userId}`);
}

module.exports = { initializeSubscribers, subscriberClient };

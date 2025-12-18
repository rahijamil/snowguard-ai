// ===== src/server.js =====
const express = require("express");
const { createServer } = require("http");
const { Server } = require("socket.io");
const cors = require("cors");
const helmet = require("helmet");
const dotenv = require("dotenv");
const logger = require("./utils/logger");
const db = require("./db/postgres");
const redisClient = require("./db/redis");
const socketAuth = require("./middleware/socker-auth");
const notificationRoutes = require("./routes/notifications");
const { initializeSubscribers } = require("./services/subscriber");
const { setupSocketHandlers } = require("./services/socket-handler");

dotenv.config();

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: process.env.CORS_ORIGIN || "http://localhost:3000",
    credentials: true,
  },
});

// Middleware
app.use(helmet());
app.use(
  cors({
    origin: process.env.CORS_ORIGIN || "http://localhost:3000",
    credentials: true,
  })
);
app.use(express.json());

// Health check
app.get("/health", (req, res) => {
  res.json({
    status: "UP",
    service: "Notification Service",
    timestamp: new Date().toISOString(),
    connections: io.sockets.sockets.size,
  });
});

// API Routes
app.use("/api/notifications", notificationRoutes);

// Socket.IO authentication
io.use(socketAuth);

// Socket.IO connection handler
io.on("connection", (socket) => {
  logger.info(`Client connected: ${socket.id}, User: ${socket.userId}`);

  // Join user's personal room
  socket.join(`user:${socket.userId}`);

  // Setup event handlers
  setupSocketHandlers(io, socket);

  socket.on("disconnect", () => {
    logger.info(`Client disconnected: ${socket.id}`);
  });
});

// Initialize
async function initialize() {
  try {
    // Test database connection
    await db.query("SELECT NOW()");
    logger.info("✅ PostgreSQL connected");

    // Test Redis connection
    await redisClient.ping();
    logger.info("✅ Redis connected");

    // Initialize database tables
    await require("./db/init")();

    // Start Redis subscribers
    await initializeSubscribers(io);
    logger.info("✅ Redis subscribers initialized");

    // Start server
    const PORT = 8004;
    httpServer.listen(PORT, () => {
      logger.info(`🚀 Notification Service running on port ${PORT}`);
    });
  } catch (error) {
    logger.error("Failed to initialize:", error);
    process.exit(1);
  }
}

// Graceful shutdown
process.on("SIGTERM", async () => {
  logger.info("SIGTERM received, shutting down gracefully");
  httpServer.close(async () => {
    await redisClient.quit();
    await db.end();
    process.exit(0);
  });
});

initialize();

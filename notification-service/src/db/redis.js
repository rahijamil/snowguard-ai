// ===== src/db/redis.js =====
const { createClient } = require("redis");
const logger = require("../utils/logger");

const redisClient = createClient({
  socket: {
    host: process.env.REDIS_HOST || "localhost",
    port: parseInt(process.env.REDIS_PORT || "6379"),
  },
});

redisClient.on("error", (err) => {
  logger.error("Redis Client Error:", err);
});

redisClient.on("connect", () => {
  logger.info("Redis client connected");
});

(async () => {
  await redisClient.connect();
})();

module.exports = redisClient;

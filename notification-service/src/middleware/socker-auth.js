// ===== src/middleware/socket-auth.js =====
const jwt = require("jsonwebtoken");
const logger = require("../utils/logger");

function socketAuthMiddleware(socket, next) {
  const token =
    socket.handshake.auth.token ||
    socket.handshake.headers.authorization?.substring(7);

  if (!token) {
    return next(new Error("Authentication required"));
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    socket.userId = decoded.uid;
    socket.userEmail = decoded.sub;
    next();
  } catch (error) {
    logger.error("Socket auth failed:", error.message);
    next(new Error("Invalid token"));
  }
}

module.exports = socketAuthMiddleware;

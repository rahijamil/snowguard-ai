// ===== src/middleware/auth.js =====
const jwt = require("jsonwebtoken");
const logger = require("../utils/logger");

function authMiddleware(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  const token = authHeader.substring(7);

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.userId = decoded.uid;
    req.userEmail = decoded.sub;
    next();
  } catch (error) {
    logger.error("JWT verification failed:", error.message);
    return res.status(401).json({ error: "Invalid token" });
  }
}

module.exports = authMiddleware;

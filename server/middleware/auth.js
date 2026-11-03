
const jwt = require("jsonwebtoken");
const db = require("../db");

async function authenticateToken(req, res, next) {
  const authHeader = req.headers.authorization;
  const token = authHeader?.startsWith("Bearer ")
    ? authHeader.slice(7)
    : null;

  if (!token) {
    return res.status(401).json({
      error: "You must log in first.",
    });
  }

  if (!process.env.JWT_SECRET) {
    return res.status(500).json({
      error: "Authentication is not configured.",
    });
  }

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);

    const [users] = await db.execute(
      "SELECT id, name, email, role FROM users WHERE id = ?",
      [payload.userId]
    );

    if (users.length === 0) {
      return res.status(401).json({
        error: "User account not found.",
      });
    }

    req.user = users[0];
    next();
  } catch (error) {
    if (
      error.name === "JsonWebTokenError" ||
      error.name === "TokenExpiredError"
    ) {
      return res.status(401).json({
        error: "Invalid or expired token. Please log in again.",
      });
    }

    console.error("Authentication error:", error);
    return res.status(500).json({
      error: "Authentication failed.",
    });
  }
}

function requireAdmin(req, res, next) {
  if (req.user?.role !== "admin") {
    return res.status(403).json({
      error: "Administrator access required.",
    });
  }

  next();
}

module.exports = { authenticateToken, requireAdmin };

const jwt = require("jsonwebtoken");
const db = require("../db");

async function optionalAuth(req, res, next) {
  req.user = null;

  const authHeader = req.headers.authorization;
  const token = authHeader?.startsWith("Bearer ")
    ? authHeader.slice(7)
    : null;

  // No token means guest checkout.
  if (!token) return next();

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);

    const [users] = await db.execute(
      "SELECT id, name, email, role FROM users WHERE id = ?",
      [payload.userId]
    );

    if (users.length > 0) {
      req.user = users[0];
    }

    return next();
  } catch (error) {
    if (
      error.name === "JsonWebTokenError" ||
      error.name === "TokenExpiredError"
    ) {
      return res.status(401).json({
        error: "Your login session has expired. Please log in again or continue as a guest.",
      });
    }

    console.error("Optional authentication error:", error);
    return res.status(500).json({ error: "Could not verify login." });
  }
}

module.exports = optionalAuth;
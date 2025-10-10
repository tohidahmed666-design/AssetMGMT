// middleware/auth.js
const jwt = require("jsonwebtoken");
require("dotenv").config();

// Use the same secret as in server.js or environment
const JWT_SECRET =
  process.env.JWT_SECRET ||
  "3be775301238a5cd27d80eb0b54de13219c35266470d8b0f9eb8803a37a9f3c46049438f53ba5358da4ab390bdebe92edc797b98099c6f0a889c0e8bdb7e4093";

/**
 * JWT Authentication Middleware
 * Verifies token, attaches decoded user info to req.user
 */
function authenticateJWT(req, res, next) {
  const authHeader = req.headers["authorization"];

  if (!authHeader) {
    return res
      .status(401)
      .json({ success: false, error: "No authorization header provided" });
  }

  const parts = authHeader.split(" ");
  if (parts.length !== 2 || parts[0] !== "Bearer") {
    return res
      .status(401)
      .json({ success: false, error: "Malformed authorization header" });
  }

  const token = parts[1];
  if (!token) {
    return res.status(401).json({ success: false, error: "Token missing" });
  }

  jwt.verify(token, JWT_SECRET, (err, decoded) => {
    if (err) {
      const message =
        err.name === "TokenExpiredError"
          ? "Token expired, please login again"
          : "Invalid token";
      return res.status(403).json({ success: false, error: message });
    }

    // Attach decoded user info to request
    req.user = decoded; // e.g., { id, email, role, iat, exp }

    next();
  });
}

/**
 * Role-based authorization helper
 * @param {Array<string>} allowedRoles - Array of roles allowed to access the route
 */
function authorizeRoles(allowedRoles = []) {
  return (req, res, next) => {
    if (!req.user || !req.user.role) {
      return res.status(403).json({ success: false, error: "User role not found" });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ success: false, error: "Access denied" });
    }

    next();
  };
}

module.exports = {
  authenticateJWT,
  authorizeRoles,
};

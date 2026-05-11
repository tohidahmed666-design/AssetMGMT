// middleware/auth.js
const jwt = require("jsonwebtoken");
require("dotenv").config();

/**
 * ==============================================================
 * JWT Authentication Middleware
 * --------------------------------------------------------------
 * - Verifies JWT from Authorization header (Bearer <token>)
 * - Attaches decoded user info (id, email, role) to req.user
 * - Rejects invalid or expired tokens
 * ==============================================================
 */

const JWT_SECRET =
  process.env.JWT_SECRET ||
  "3be775301238a5cd27d80eb0b54de13219c35266470d8b0f9eb8803a37a9f3c46049438f53ba5358da4ab390bdebe92edc797b98099c6f0a889c0e8bdb7e4093";

function authenticateJWT(req, res, next) {
  try {
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

      /**
       * Attach decoded user info to req.user
       * Example decoded payload:
       * { id: 12, email: "john@example.com", role: "user", iat: 1715871445, exp: 1715875045 }
       */
      req.user = decoded;

      // Log user details for debugging (optional)
      // console.log("Authenticated User:", req.user);

      next();
    });
  } catch (error) {
    console.error("JWT authentication error:", error);
    return res.status(500).json({ success: false, error: "Server error" });
  }
}

/**
 * ==============================================================
 * Role-Based Authorization Middleware
 * --------------------------------------------------------------
 * Allows only specified roles to access a route.
 * Example: router.get("/admin", authorizeRoles(["admin"]), handler);
 * ==============================================================
 */
function authorizeRoles(allowedRoles = []) {
  return (req, res, next) => {
    if (!req.user || !req.user.role) {
      return res
        .status(403)
        .json({ success: false, error: "User role not found" });
    }

    // Admin override: allow full access if role === "admin"
    if (req.user.role === "admin") {
      return next();
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ success: false, error: "Access denied" });
    }

    next();
  };
}

/**
 * ==============================================================
 * Helper: attachUserFilter
 * --------------------------------------------------------------
 * Simplifies filtering by logged-in user's ID in routes.
 * Example use:
 * const whereClause = attachUserFilter(req);
 * const assets = await Asset.findAll({ where: whereClause });
 * ==============================================================
 */
function attachUserFilter(req) {
  if (!req.user) return {};

  // Admin sees all data, regular users see only their data
  if (req.user.role === "admin") return {};

  return { userId: req.user.id };
}

module.exports = {
  authenticateJWT,
  authorizeRoles,
  attachUserFilter,
};

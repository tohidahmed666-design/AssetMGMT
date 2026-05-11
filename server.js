//server.js
require("dotenv").config();
const express = require("express");
const cors = require("cors");
const path = require("path");
const fs = require("fs");
const morgan = require("morgan");
const multer = require("multer");
const jwt = require("jsonwebtoken");

// =========================
// DB + Models
// =========================
const sequelize = require("./config/database");
const { Asset, DeletedAsset, User, Otp, LoginHistory, Contact, IssuedAsset } = require("./models");

// =========================
// Routes
// =========================
const { router: authRoutes } = require("./routes/auth");
const contactRoutes = require("./routes/contact");
const assetRoutes = require("./routes/asset");
const seedUsers = require("./utils/seedUsers");

const app = express();

// =========================
// Middleware
// =========================
app.use(cors());
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true, limit: "50mb" }));
app.use(express.static(path.join(__dirname, "public")));
app.use("/uploads", express.static(path.join(__dirname, "uploads")));
app.use(
  morgan(":date[iso] :method :url :status :res[content-length] - :response-time ms")
);

// =========================
// JWT Middleware
// =========================
function verifyToken(req, res, next) {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];
  if (!token)
    return res.status(401).json({ error: "No login token found, please login again." });

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) return res.status(403).json({ error: "Invalid or expired token" });
    req.user = user;
    next();
  });
}

// =========================
// Multer Config for File Uploads
// =========================
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, "uploads");
    if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const safeName = file.originalname.replace(/\s/g, "_");
    const uniqueName = `${Date.now()}_${Math.random().toString(36).substring(2, 8)}_${safeName}`;
    cb(null, uniqueName);
  },
});
const upload = multer({ storage });

// =========================
// Database Initialization
// =========================
async function initDB() {
  try {
    await sequelize.authenticate();
    const dialect = sequelize.getDialect();
    console.log(`✅ Connected to Database (${dialect === 'mssql' ? 'SQL Server' : 'PostgreSQL'})`);

    // ⚠️ Use alter: false in production
    await User.sync({ alter: false });
    await Asset.sync({ alter: false });
    await DeletedAsset.sync({ alter: false });
    await IssuedAsset.sync({ alter: false });
    await LoginHistory.sync({ alter: false });
    await Contact.sync({ alter: false });
    await Otp.sync({ alter: false });

    // Ensure unique index for asset_number (SQL Server specific syntax)
    if (dialect === 'mssql') {
      await sequelize.query(`
        IF NOT EXISTS (
          SELECT 1 FROM sys.indexes 
          WHERE name = 'UQ_Assets_AssetNumber' 
            AND object_id = OBJECT_ID('Assets')
        )
        CREATE UNIQUE INDEX UQ_Assets_AssetNumber ON Assets (asset_number);
      `);
    }

    console.log("✅ Models synchronized and unique indexes ensured");

    // Seed users
    try {
      await seedUsers();
      console.log("✅ User seeding completed");
    } catch (seedErr) {
      console.warn("⚠️ Warning: User seeding encountered an issue:", seedErr.message);
      // Don't exit here, the server can still run
    }
  } catch (err) {
    console.error("❌ Database initialization failed. The server cannot start without a DB connection.");
    console.error("👉 Please check your .env file and ensure your DB is reachable.");
    console.error("Error details:", err.message);
    process.exit(1);
  }
}

// =========================
// Associations (FIXED - NO BREAKING FKs)
// =========================

// LoginHistory <-> User
User.hasMany(LoginHistory, { foreignKey: "userId", onDelete: "CASCADE" });
LoginHistory.belongsTo(User, { foreignKey: "userId" });

// Contact <-> User
User.hasMany(Contact, { foreignKey: "resolvedBy", onDelete: "SET NULL" });
Contact.belongsTo(User, { foreignKey: "resolvedBy" });

// OTP <-> User
User.hasMany(Otp, { foreignKey: "userId", onDelete: "CASCADE" });
Otp.belongsTo(User, { foreignKey: "userId" });

// =========================
// Utilities
// =========================
async function handleBase64Image(imageData, prefix = "uploads/") {
  if (!imageData) return null;
  try {
    const base64Data = imageData.replace(/^data:image\/\\w+;base64,/, "");
    const filename = `${prefix}${Date.now()}_${Math.random().toString(36).substring(2, 8)}.png`;
    fs.writeFileSync(filename, base64Data, "base64");
    return `/${filename}`;
  } catch (err) {
    console.error("❌ Base64 image handling error:", err);
    return null;
  }
}

function parseSQLDate(input) {
  if (!input || input === "") return null;
  const d = new Date(input);
  if (!isNaN(d)) {
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const dd = String(d.getDate()).padStart(2, "0");
    const hh = String(d.getHours()).padStart(2, "0");
    const min = String(d.getMinutes()).padStart(2, "0");
    const ss = String(d.getSeconds()).padStart(2, "0");
    return `${yyyy}-${mm}-${dd} ${hh}:${min}:${ss}`;
  }
  return null;
}

// =========================
// Routes
// =========================
app.use("/auth", authRoutes);
app.use("/api/contact", contactRoutes);
app.use("/api/assets", assetRoutes);

// Redirect the root URL to the login page
app.get("/", (req, res) => {
  res.redirect("/login.html");
});

// =========================
// 404 + Error handler
// =========================
app.use((req, res) => res.status(404).json({ error: "Route not found" }));
app.use((err, req, res, next) => {
  console.error("❌ Internal server error:", err);
  res.status(500).json({ 
    error: "Internal server error", 
    details: err.message,
    path: req.path
  });
});


// =========================
// Start Server
// =========================
const PORT = process.env.PORT || 5000;

async function startServer() {
  try {
    await initDB();
    app.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
      console.log(`🔗 Local: http://localhost:${PORT}`);
    });
  } catch (err) {
    console.error("❌ Failed to start server:", err);
    process.exit(1);
  }
}

startServer();


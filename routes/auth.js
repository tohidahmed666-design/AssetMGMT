// routes/auth.js
const express = require("express");
const jwt = require("jsonwebtoken");
const nodemailer = require("nodemailer");
const { User, Otp, LoginHistory } = require("../models");
const { Op } = require("sequelize");

const router = express.Router();

const JWT_SECRET = process.env.JWT_SECRET || "your_jwt_secret_here";
const JWT_EXPIRES = process.env.JWT_EXPIRES || "12h";
const OTP_EXP_MINUTES = parseInt(process.env.OTP_EXP_MINUTES || "5", 10);
const OTP_REQUEST_LIMIT = 3;

// --------------------
// Nodemailer Transport
// --------------------
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_APP_PASSWORD,
  },
});

// --------------------
// Utilities
// --------------------
function generateOTP() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

async function saveLoginHistory(user, success, req) {
  try {
    await LoginHistory.create({
      userId: user ? user.id : null,
      email: user ? user.email : req.body.email?.trim().toLowerCase(),
      ipAddress: req.ip,
      userAgent: req.headers["user-agent"],
      success,
    });
  } catch (err) {
    console.error("⚠️ LoginHistory save failed:", err.message);
  }
}

// --------------------
// Login
// --------------------
router.post("/login", async (req, res) => {
  try {
    const email = req.body.email?.trim().toLowerCase();
    const password = req.body.password;

    console.log("Login attempt for email:", email);

    if (!email || !password) {
      await saveLoginHistory(null, false, req);
      return res.status(400).json({ message: "Email and password required" });
    }

    const user = await User.scope("withPassword").findOne({ where: { email } });
    console.log("User found:", user ? user.email : null);

    if (!user) {
      await saveLoginHistory(null, false, req);
      return res.status(400).json({ message: "User not found" });
    }

    // Check if account is verified
    if (!user.verified) {
      await saveLoginHistory(user, false, req);
      return res.status(400).json({ message: "Account not verified" });
    }

    const validPassword = await user.checkPassword(password);
    if (!validPassword) {
      await saveLoginHistory(user, false, req);

      // Increment failed login attempts
      user.failed_login_attempts = (user.failed_login_attempts || 0) + 1;
      await user.save();

      return res.status(400).json({ message: "Invalid password" });
    }

    // Reset failed login attempts and update last login
    user.failed_login_attempts = 0;
    user.last_login = new Date();
    await user.save();

    await saveLoginHistory(user, true, req);

    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES }
    );

    res.json({
      token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
        verified: user.verified,
      },
      message: "✅ Login successful",
    });
  } catch (err) {
    console.error("❌ Login error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// --------------------
// Request OTP
// --------------------
router.post("/request-otp", async (req, res) => {
  try {
    const email = req.body.email?.trim().toLowerCase();
    if (!email) return res.status(400).json({ message: "Email required" });

    const user = await User.findOne({ where: { email } });
    if (!user) return res.status(400).json({ message: "User not found" });

    const recentOtps = await Otp.count({
      where: { email, createdAt: { [Op.gte]: new Date(Date.now() - 60 * 60 * 1000) } },
    });

    if (recentOtps >= OTP_REQUEST_LIMIT) {
      return res.status(429).json({ message: "Too many OTP requests. Try later." });
    }

    await Otp.destroy({ where: { email, used: false } });

    const otpCode = generateOTP();
    const expiry = new Date(Date.now() + OTP_EXP_MINUTES * 60000);

    await Otp.create({
      email,
      otp: otpCode,
      expiresAt: expiry,
      purpose: "reset-password",
      used: false,
    });

    await transporter.sendMail({
      from: process.env.GMAIL_USER,
      to: email,
      subject: "Password Reset OTP",
      text: `Your OTP is ${otpCode}. It expires in ${OTP_EXP_MINUTES} minutes.`,
    });

    res.json({ message: "✅ OTP sent to your email" });
  } catch (err) {
    console.error("❌ Request OTP error:", err);
    res.status(500).json({ message: "Server error sending OTP" });
  }
});

// --------------------
// Reset Password
// --------------------
router.post("/reset-password", async (req, res) => {
  try {
    const email = req.body.email?.trim().toLowerCase();
    const { otp, newPassword } = req.body;

    if (!email || !otp || !newPassword)
      return res.status(400).json({ message: "Email, OTP, and new password required" });

    const otpDoc = await Otp.findOne({ where: { email, otp, used: false } });
    if (!otpDoc || otpDoc.expiresAt < new Date()) {
      return res.status(400).json({ message: "Invalid or expired OTP" });
    }

    const user = await User.scope("withPassword").findOne({ where: { email } });
    if (!user) return res.status(400).json({ message: "User not found" });

    user.password = newPassword; // hashed via model hook
    await user.save();

    otpDoc.used = true;
    await otpDoc.save();

    res.json({ message: "✅ Password reset successful" });
  } catch (err) {
    console.error("❌ Reset password error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// --------------------
// Logout
// --------------------
router.post("/logout", async (req, res) => {
  try {
    res.json({ message: "✅ Logged out successfully" });
  } catch (err) {
    console.error("❌ Logout error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;

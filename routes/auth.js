// routes/auth.js
const express = require("express");
const jwt = require("jsonwebtoken");
const nodemailer = require("nodemailer");
const { User, Otp, LoginHistory, sequelize } = require("../models");

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || "your_jwt_secret_here";

const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 465,
  secure: true, // true for 465, false for other ports
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_APP_PASSWORD,
  },
  connectionTimeout: 10000, // 10 seconds
  greetingTimeout: 10000,
  tls: {
    rejectUnauthorized: false
  }
});

/* ======================================================
    🔢 REQUEST OTP
====================================================== */
router.post("/request-otp", async (req, res) => {
  try {
    const stationEmail = req.body.email?.trim().toLowerCase();
    const sendToOverride = req.body.sendTo?.trim().toLowerCase();

    const user = await User.findOne({ where: { email: stationEmail } });
    if (!user) {
      console.log(`⚠️ [OTP] Request failed: Station ${stationEmail} not found`);
      return res.status(404).json({ message: "Station not found" });
    }

    // 1. Delete old OTPs
    await Otp.destroy({ where: { userId: user.id } });

    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();

    // 2. Save OTP to DB
    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + 10);
    
    await Otp.create({
      userId: user.id,
      email: user.email,
      otp: otpCode,
      expiresAt: expiresAt
    });

    console.log(`✅ [OTP] Saved ${otpCode} for User ${user.id}`);

    // 3. Determine recipient and send Email
    // If sendToOverride is provided (e.g. admin email), use it. Otherwise use the user's email.
    const recipient = sendToOverride || user.email;
    
    try {
      await transporter.sendMail({
        from: process.env.GMAIL_USER || "noreply@ksp.gov.in",
        to: recipient,
        subject: `Asset Management OTP for ${stationEmail}`,
        html: `
          <div style="font-family: sans-serif; padding: 20px; border: 1px solid #ddd; border-radius: 10px;">
            <h2 style="color: #0072ff;">OTP Verification</h2>
            <p>You requested an OTP to reset your password for the Asset Management System.</p>
            <h1 style="letter-spacing: 5px; color: #333;">${otpCode}</h1>
            <p style="color: #666; font-size: 14px;">This code will expire in 10 minutes.</p>
            <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;">
            <p style="font-size: 12px; color: #999;">Station Email: ${stationEmail}</p>
          </div>
        `
      });
      console.log(`📧 [OTP] Email sent to ${recipient}`);
      res.json({ message: `✅ OTP sent to ${recipient}` });
    } catch (mailErr) {
      console.error("❌ [OTP] Email Sending Failed:", mailErr);
      // Even if email fails, we don't want to return a 500 if the OTP was saved
      // But for debugging, we'll return a specific error
      res.status(500).json({ 
        message: "Failed to send email. Please check server logs.",
        error: mailErr.message 
      });
    }
  } catch (err) {
    console.error("❌ [OTP] Database Error:", err);
    res.status(500).json({ message: "Server Error. Please try again later." });
  }
});

/* ======================================================
    🔒 RESET PASSWORD
====================================================== */
/* ======================================================
    🔒 RESET PASSWORD (FIXED FOR LOGIN)
====================================================== */
router.post("/reset-password", async (req, res) => {
  try {
    const { email, otp, newPassword } = req.body;
    
    // 1. Find the user
    const user = await User.findOne({ 
      where: { email: email?.trim().toLowerCase() } 
    });

    if (!user) return res.status(404).json({ message: "User not found" });

    // 2. Fetch the OTP record using Sequelize
    const otps = await Otp.findAll({ where: { userId: user.id } });

    // 3. Compare the OTP digits
    const userTypedOtp = (otp || "").toString().trim();
    
    // Log the records to see what exactly is being returned from the database
    console.log("Database OTP records:", otps.map(o => o.toJSON()));

    const isValid = otps.some(record => {
      const dbOtp = record.otp || record.getDataValue('otp');
      return dbOtp && dbOtp.toString().trim() === userTypedOtp;
    });

    if (!isValid) return res.status(400).json({ message: "Invalid or expired OTP" });

    /**
     * 4. Update the Password
     * IMPORTANT: We use user.set() and user.save() or user.update() 
     * to ensure that your Model's 'beforeUpdate' or 'beforeSave' 
     * hooks (bcrypt hashing) are triggered.
     */
    user.password = newPassword; 
    await user.save(); // This triggers the hashing logic in your User model

    // 5. Cleanup the OTP
    await Otp.destroy({ where: { userId: user.id } });

    console.log(`✅ Password updated and hashed for user: ${email}`);
    res.json({ message: "✅ Password reset successful! You can now login." });

  } catch (err) {
    console.error("❌ Reset Error:", err);
    res.status(500).json({ message: "Reset failed due to server error." });
  }
});

/* ======================================================
    👤 LOGIN
====================================================== */
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.scope("withPassword").findOne({ where: { email: email?.trim().toLowerCase() } });
    if (!user || !(await user.checkPassword(password))) return res.status(401).json({ message: "Invalid" });
    const token = jwt.sign({ id: user.id, email: user.email }, JWT_SECRET, { expiresIn: "12h" });
    res.json({ token, user: { id: user.id, email: user.email, name: user.name } });
  } catch (err) { res.status(500).send(); }
});

router.post("/logout", (req, res) => res.json({ message: "Logged out" }));

module.exports = { router };
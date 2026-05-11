// routes/contact.js
const express = require("express");
const router = express.Router();
const nodemailer = require("nodemailer");
const multer = require("multer");

// Use memory storage for file uploads
const storage = multer.memoryStorage();
const upload = multer({ storage });

// POST /api/contact
router.post("/", upload.single("screenshot"), async (req, res) => {
  try {
    const { name, email, subject, message } = req.body;
    if (!subject || !message || !email)
      return res.status(400).json({ msg: "Please fill required fields." });

    // Configure Nodemailer transporter using Gmail credentials from .env
    const transporter = nodemailer.createTransport({
      service: "Gmail",
      auth: {
        user: process.env.GMAIL_USER,          // Gmail account from .env
        pass: process.env.GMAIL_APP_PASSWORD   // App password from .env
      }
    });

    // Prepare mail options
    const mailOptions = {
      from: email,
      to: process.env.DEV_EMAIL,               // Developer email from .env
      subject: `[Contact Dev] ${subject}`,
      text: `Name: ${name || "Anonymous"}\nEmail: ${email}\n\nMessage:\n${message}`
    };

    // Attach screenshot if provided
    if (req.file) {
      mailOptions.attachments = [
        {
          filename: req.file.originalname,
          content: req.file.buffer
        }
      ];
    }

    // Send email
    await transporter.sendMail(mailOptions);

    res.json({ msg: "✅ Message sent successfully via email." });
  } catch (err) {
    console.error("Contact email error:", err);
    res.status(500).json({ msg: "Server error sending email." });
  }
});

module.exports = router;

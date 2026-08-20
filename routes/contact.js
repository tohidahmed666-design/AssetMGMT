const express = require("express");
const router = express.Router();
const nodemailer = require("nodemailer");
const multer = require("multer");

// Use memory storage for file uploads
const storage = multer.memoryStorage();
const upload = multer({ storage });

// Create transporter
const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 465,
  secure: true,
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_APP_PASSWORD,
  },
  connectionTimeout: 30000,
  greetingTimeout: 30000,
  socketTimeout: 30000,
});

// POST /api/contact
router.post("/", upload.single("screenshot"), async (req, res) => {
  try {
    const { name, email, subject, message } = req.body;

    if (!subject || !message || !email) {
      return res.status(400).json({
        msg: "Please fill required fields."
      });
    }

    // Verify SMTP configuration
    if (
      !process.env.GMAIL_USER ||
      !process.env.GMAIL_APP_PASSWORD ||
      !process.env.DEV_EMAIL
    ) {
      console.error("Missing email environment variables");

      return res.status(500).json({
        msg: "Email service is not configured correctly."
      });
    }

    const mailOptions = {
      from: `"Asset Management System" <${process.env.GMAIL_USER}>`,
      to: process.env.DEV_EMAIL,

      // When you click Reply, it will reply directly to the user
      replyTo: email,

      subject: `[Contact Dev] ${subject}`,

      text:
`Name: ${name || "Anonymous"}
Email: ${email}

Message:
${message}`
    };

    // Attach screenshot if provided
    if (req.file) {
      mailOptions.attachments = [
        {
          filename: req.file.originalname,
          content: req.file.buffer,
        },
      ];
    }

    await transporter.sendMail(mailOptions);

    console.log(`✅ Contact email sent from ${email}`);

    res.json({
      msg: "✅ Message sent successfully."
    });

  } catch (err) {
    console.error("Contact email error:", err);

    res.status(500).json({
      msg: "Server error sending email."
    });
  }
});

module.exports = router;

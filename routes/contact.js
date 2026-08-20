const express = require("express");
const router = express.Router();
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const { Contact } = require("../models");
const { sendEmail } = require("../utils/mailer");

// Disk storage for file uploads
const uploadDir = path.join(__dirname, "../uploads/contact");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    const safeName = file.originalname.replace(/\s+/g, "_");
    const uniqueName = `contact_${Date.now()}_${Math.random().toString(36).substring(2, 8)}_${safeName}`;
    cb(null, uniqueName);
  }
});
const upload = multer({ storage });

// POST /api/contact
router.post("/", upload.single("screenshot"), async (req, res) => {
  try {
    const { name, email, subject, message } = req.body;

    if (!subject || !message || !email) {
      return res.status(400).json({
        msg: "Please fill required fields (email, subject, message)."
      });
    }

    const screenshotUrl = req.file ? `/uploads/contact/${req.file.filename}` : null;

    // 1. ALWAYS SAVE TO DATABASE FIRST
    let savedContact = null;
    try {
      savedContact = await Contact.create({
        name: name || "Anonymous",
        email: email.trim().toLowerCase(),
        subject: subject.trim(),
        message: message.trim(),
        screenshotUrl: screenshotUrl,
        status: "new"
      });
      console.log(`✅ Contact request saved to Database (ID: ${savedContact.id}) from ${email}`);
    } catch (dbErr) {
      console.warn("⚠️ Failed to save contact request to Database:", dbErr.message);
    }

    // Determine target developer email recipient (Defaults to tohidahmed666@gmail.com for Resend compatibility)
    const devEmail = process.env.DEV_EMAIL || "tohidahmed666@gmail.com";

    // 2. ATTEMPT TO SEND EMAIL NOTIFICATION
    let emailSent = false;
    let emailErrorMsg = null;

    if (devEmail) {
      try {
        const mailText = `Name: ${name || "Anonymous"}\nEmail: ${email}\n\nMessage:\n${message}`;
        const mailHtml = `
          <div style="font-family: Arial, sans-serif; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px;">
            <h2 style="color: #0052cc; margin-top: 0;">New Contact Form Submission</h2>
            <p><strong>Name:</strong> ${name || "Anonymous"}</p>
            <p><strong>Sender Email:</strong> <a href="mailto:${email}">${email}</a></p>
            <p><strong>Subject:</strong> ${subject}</p>
            <hr style="border: 0; border-top: 1px solid #eee; margin: 15px 0;">
            <p><strong>Message:</strong></p>
            <blockquote style="background: #f9f9f9; border-left: 4px solid #0052cc; margin: 0; padding: 10px 15px;">
              ${message.replace(/\n/g, '<br>')}
            </blockquote>
            ${screenshotUrl ? `<p style="margin-top: 15px;"><strong>Screenshot:</strong> Stored at <code>${screenshotUrl}</code></p>` : ''}
          </div>
        `;

        const attachments = [];
        if (req.file) {
          attachments.push({
            filename: req.file.originalname,
            content: fs.readFileSync(req.file.path)
          });
        }

        await sendEmail({
          to: devEmail,
          replyTo: email,
          subject: `[Contact Dev] ${subject}`,
          text: mailText,
          html: mailHtml,
          attachments: attachments.length > 0 ? attachments : undefined
        });

        emailSent = true;
        console.log(`✅ Contact notification email sent to ${devEmail}`);
      } catch (mailErr) {
        emailErrorMsg = mailErr.message;
        console.error("❌ Contact email notification error:", mailErr.message);
      }
    } else {
      console.warn("⚠️ No DEV_EMAIL or GMAIL_USER set in environment variables for contact notifications.");
    }

    // 3. RESPOND TO CLIENT
    // If saved to DB or email delivered, consider it successful
    if (savedContact || emailSent) {
      return res.json({
        msg: "✅ Message sent successfully.",
        contactId: savedContact ? savedContact.id : null,
        emailDelivered: emailSent
      });
    }

    // If both DB save and email delivery failed
    return res.status(500).json({
      msg: "Failed to process message: " + (emailErrorMsg || "Database & email service unavailable.")
    });

  } catch (err) {
    console.error("❌ Contact endpoint error:", err);
    res.status(500).json({
      msg: "Server error processing contact request."
    });
  }
});

// GET /api/contact - View all contact submissions
router.get("/", async (req, res) => {
  try {
    const contacts = await Contact.findAll({
      order: [["createdAt", "DESC"]]
    });
    res.json(contacts);
  } catch (err) {
    console.error("❌ GET /api/contact error:", err);
    res.status(500).json({ error: "Failed to fetch contact submissions" });
  }
});

module.exports = router;


// utils/mailer.js

const nodemailer = require("nodemailer");

/**
 * Universal Mailer Utility for Asset Management System
 *
 * Supports:
 * 1. SendGrid Web API (HTTPS Port 443 - Primary / Recommended for Render)
 * 2. Resend Web API (HTTPS Port 443 - Secondary)
 * 3. Nodemailer SMTP (Optional final fallback)
 *
 * IMPORTANT:
 * If SENDGRID_API_KEY is configured, SendGrid is used directly.
 * We DO NOT fall back to SMTP after a SendGrid failure.
 * This prevents Render SMTP timeout issues.
 */


/**
 * ============================================================
 * Utility: Validate and normalize email
 * ============================================================
 */
function normalizeEmail(email) {
  if (!email || typeof email !== "string") {
    return null;
  }

  return email.trim().toLowerCase();
}


/**
 * ============================================================
 * Utility: Escape HTML
 * ============================================================
 *
 * Useful when optional HTML content is generated dynamically.
 * This helps prevent malformed HTML when user-provided values
 * are inserted into an email.
 */
function escapeHtml(value) {
  if (value === null || value === undefined) {
    return "";
  }

  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}


/**
 * ============================================================
 * Send email via SendGrid v3 HTTP API
 * ============================================================
 */
async function sendEmailViaSendGrid({
  to,
  from,
  replyTo,
  subject,
  text,
  html,
  attachments
}) {
  const apiKey = process.env.SENDGRID_API_KEY;

  if (!apiKey) {
    throw new Error(
      "SENDGRID_API_KEY is not configured in environment"
    );
  }

  const recipientEmail = normalizeEmail(to);

  if (!recipientEmail) {
    throw new Error(
      "A valid recipient email address is required"
    );
  }

  /**
   * SendGrid requires the From address to be a verified sender.
   *
   * Priority:
   * 1. Explicit `from`
   * 2. SENDGRID_FROM_EMAIL
   * 3. GMAIL_USER
   * 4. SMTP_USER
   */
  const fromEmail =
    normalizeEmail(from) ||
    normalizeEmail(process.env.SENDGRID_FROM_EMAIL) ||
    normalizeEmail(process.env.GMAIL_USER) ||
    normalizeEmail(process.env.SMTP_USER);

  if (!fromEmail) {
    throw new Error(
      "Sender email is not configured. Set SENDGRID_FROM_EMAIL or GMAIL_USER."
    );
  }

  /**
   * Build SendGrid payload.
   */
  const payload = {
    personalizations: [
      {
        to: [
          {
            email: recipientEmail
          }
        ]
      }
    ],

    from: {
      email: fromEmail,
      name: "Asset Management System"
    },

    subject: subject || "Asset Management System",

    content: []
  };


  /**
   * Reply-To:
   *
   * This allows the developer to click Reply and send the
   * response directly to the original user.
   */
  const normalizedReplyTo = normalizeEmail(replyTo);

  if (normalizedReplyTo) {
    payload.reply_to = {
      email: normalizedReplyTo
    };
  }


  /**
   * Plain-text email body.
   */
  if (text) {
    payload.content.push({
      type: "text/plain",
      value: String(text)
    });
  }


  /**
   * HTML email body.
   */
  if (html) {
    payload.content.push({
      type: "text/html",
      value: String(html)
    });
  }


  /**
   * Ensure SendGrid always receives at least one content block.
   */
  if (payload.content.length === 0) {
    payload.content.push({
      type: "text/plain",
      value: String(
        text ||
        subject ||
        "Asset Management System notification"
      )
    });
  }


  /**
   * ==========================================================
   * Attachments
   * ==========================================================
   *
   * Supports screenshots/images/files passed by routes/contact.js
   *
   * Example input:
   *
   * {
   *   filename: "screenshot.png",
   *   content: Buffer
   * }
   *
   * SendGrid requires Base64 encoded attachment content.
   */
  if (
    attachments &&
    Array.isArray(attachments) &&
    attachments.length > 0
  ) {
    payload.attachments = attachments
      .filter((attachment) => attachment && attachment.content)
      .map((attachment) => {
        let base64Content;

        if (Buffer.isBuffer(attachment.content)) {
          base64Content =
            attachment.content.toString("base64");
        } else if (typeof attachment.content === "string") {
          /**
           * If a string is supplied, treat it as raw file content
           * and convert it to Base64.
           */
          base64Content =
            Buffer.from(attachment.content).toString("base64");
        } else {
          base64Content =
            Buffer.from(attachment.content).toString("base64");
        }

        return {
          content: base64Content,

          filename:
            attachment.filename ||
            "attachment",

          type:
            attachment.contentType ||
            attachment.type ||
            "application/octet-stream",

          disposition:
            attachment.disposition ||
            "attachment"
        };
      });

    /**
     * Remove the attachment property if all supplied attachments
     * were invalid or empty.
     */
    if (payload.attachments.length === 0) {
      delete payload.attachments;
    }
  }


  /**
   * ==========================================================
   * Send request to SendGrid
   * ==========================================================
   */
  const response = await fetch(
    "https://api.sendgrid.com/v3/mail/send",
    {
      method: "POST",

      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json"
      },

      body: JSON.stringify(payload)
    }
  );


  /**
   * SendGrid normally returns HTTP 202 when the email has been
   * accepted for delivery.
   */
  if (!response.ok) {
    const errorText = await response.text();

    console.error(
      "❌ SendGrid API Error Response:",
      errorText
    );

    throw new Error(
      `SendGrid API status ${response.status}: ${errorText}`
    );
  }


  console.log(
    `📧 Email sent via SendGrid Web API to ${recipientEmail}`
  );

  if (payload.attachments) {
    console.log(
      `📎 ${payload.attachments.length} attachment(s) included`
    );
  }

  return true;
}


/**
 * ============================================================
 * Send email via Resend HTTP API
 * ============================================================
 *
 * Kept intact as a secondary provider.
 */
async function sendEmailViaResend({
  to,
  from,
  replyTo,
  subject,
  text,
  html,
  attachments
}) {
  const apiKey = process.env.RESEND_API_KEY;

  if (!apiKey) {
    throw new Error(
      "RESEND_API_KEY is not configured in environment"
    );
  }

  const recipientEmail = normalizeEmail(to);

  if (!recipientEmail) {
    throw new Error(
      "A valid recipient email address is required"
    );
  }

  const fromEmail =
    normalizeEmail(from) ||
    normalizeEmail(process.env.RESEND_FROM_EMAIL);

  if (!fromEmail) {
    throw new Error(
      "RESEND_FROM_EMAIL is not configured"
    );
  }

  const payload = {
    from: fromEmail,

    to: [
      recipientEmail
    ],

    subject:
      subject ||
      "Asset Management System",

    text:
      text || "",

    html:
      html || undefined
  };


  /**
   * Reply-To
   */
  const normalizedReplyTo = normalizeEmail(replyTo);

  if (normalizedReplyTo) {
    payload.reply_to = normalizedReplyTo;
  }


  /**
   * Attachments
   */
  if (
    attachments &&
    Array.isArray(attachments) &&
    attachments.length > 0
  ) {
    payload.attachments = attachments
      .filter(
        (attachment) =>
          attachment && attachment.content
      )
      .map((attachment) => ({
        filename:
          attachment.filename ||
          "attachment",

        content:
          Buffer.isBuffer(attachment.content)
            ? attachment.content.toString("base64")
            : Buffer.from(
              attachment.content
            ).toString("base64")
      }));
  }


  /**
   * Send request to Resend.
   */
  const response = await fetch(
    "https://api.resend.com/emails",
    {
      method: "POST",

      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json"
      },

      body: JSON.stringify(payload)
    }
  );


  if (!response.ok) {
    const errorText = await response.text();

    console.error(
      "❌ Resend API Error Response:",
      errorText
    );

    throw new Error(
      `Resend API status ${response.status}: ${errorText}`
    );
  }


  console.log(
    `📧 Email sent via Resend API to ${recipientEmail}`
  );

  return true;
}


/**
 * ============================================================
 * Send email via Nodemailer SMTP fallback
 * ============================================================
 *
 * Kept intact for environments where SMTP is intentionally used.
 *
 * IMPORTANT:
 * The universal sendEmail() function below will NOT automatically
 * fall back to SMTP when SendGrid is configured.
 */
async function sendEmailViaSMTP({
  to,
  from,
  replyTo,
  subject,
  text,
  html,
  attachments
}) {
  const smtpHost =
    process.env.SMTP_HOST ||
    "smtp.gmail.com";

  const smtpPort =
    Number(process.env.SMTP_PORT) ||
    (smtpHost === "smtp.gmail.com" ? 465 : 587);

  const smtpUser =
    process.env.SMTP_USER ||
    process.env.GMAIL_USER;

  const smtpPass =
    process.env.SMTP_PASS ||
    process.env.GMAIL_APP_PASSWORD;

  const isSecure =
    process.env.SMTP_SECURE !== undefined
      ? process.env.SMTP_SECURE === "true"
      : smtpPort === 465;


  if (!smtpUser || !smtpPass) {
    throw new Error(
      "Missing SMTP credentials. Please set SMTP_USER/GMAIL_USER and SMTP_PASS/GMAIL_APP_PASSWORD."
    );
  }


  const transporter =
    nodemailer.createTransport({
      host: smtpHost,

      port: smtpPort,

      secure: isSecure,

      auth: {
        user: smtpUser,
        pass: smtpPass
      },

      /**
       * Keep SMTP timeout protection.
       */
      connectionTimeout: 8000,

      greetingTimeout: 8000,

      socketTimeout: 8000
    });


  const fromAddress =
    from ||
    `"Asset Management System" <${smtpUser}>`;


  const mailOptions = {
    from: fromAddress,

    to: to,

    replyTo:
      replyTo ||
      undefined,

    subject:
      subject,

    text:
      text,

    html:
      html,

    attachments:
      attachments ||
      undefined
  };


  try {
    const info =
      await transporter.sendMail(
        mailOptions
      );

    console.log(
      `📧 Email sent via SMTP to ${to} (MessageId: ${info.messageId})`
    );

    return true;

  } catch (err) {

    if (
      err.code === "ETIMEDOUT" ||
      err.code === "ECONNREFUSED"
    ) {
      console.error(
        `❌ SMTP Connection Timeout/Refused (${err.code}) connecting to ${smtpHost}:${smtpPort}`
      );

      console.error(
        "👉 NOTE: Cloud hosting providers such as Render may block outbound SMTP ports (25, 465, 587)."
      );

      console.error(
        "👉 FIX: Use SENDGRID_API_KEY or RESEND_API_KEY in Render Environment Variables."
      );
    }

    throw err;
  }
}


/**
 * ============================================================
 * Universal sendEmail function with provider routing
 * ============================================================
 *
 * PROVIDER PRIORITY:
 *
 * 1. SendGrid
 * 2. Resend
 * 3. SMTP
 *
 * IMPORTANT:
 *
 * If SENDGRID_API_KEY exists:
 *   → SendGrid is used.
 *   → If SendGrid fails, the error is returned.
 *   → NO SMTP fallback.
 *
 * This prevents:
 *
 * SendGrid failure
 *      ↓
 * Gmail SMTP fallback
 *      ↓
 * Render SMTP timeout
 *      ↓
 * ETIMEDOUT
 *
 * If SendGrid is not configured, Resend can be used.
 *
 * If neither API provider is configured, SMTP can be used.
 */
async function sendEmail(options) {
  const { to } = options || {};

  if (!to) {
    throw new Error(
      "Recipient email (to) is required"
    );
  }


  /**
   * ==========================================================
   * 1. SENDGRID - PRIMARY
   * ==========================================================
   */
  if (process.env.SENDGRID_API_KEY) {

    console.log(
      "📤 Email provider: SendGrid Web API"
    );

    /**
     * IMPORTANT:
     * Do NOT catch the error and fall back to SMTP.
     *
     * Any SendGrid error should be visible directly so it can
     * be diagnosed from the Render logs.
     */
    return await sendEmailViaSendGrid(
      options
    );
  }


  /**
   * ==========================================================
   * 2. RESEND - SECONDARY
   * ==========================================================
   */
  if (process.env.RESEND_API_KEY) {

    console.log(
      "📤 Email provider: Resend Web API"
    );

    return await sendEmailViaResend(
      options
    );
  }


  /**
   * ==========================================================
   * 3. SMTP - FINAL FALLBACK
   * ==========================================================
   *
   * SMTP is only reached when neither SendGrid nor Resend API
   * credentials are configured.
   */
  console.warn(
    "⚠️ SENDGRID_API_KEY and RESEND_API_KEY are not configured."
  );

  console.warn(
    "⚠️ Falling back to SMTP."
  );

  return await sendEmailViaSMTP(
    options
  );
}


/**
 * ============================================================
 * Export functions
 * ============================================================
 */
module.exports = {
  sendEmail,
  sendEmailViaSendGrid,
  sendEmailViaResend,
  sendEmailViaSMTP
};
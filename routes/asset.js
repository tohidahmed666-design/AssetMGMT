// routes/asset.js
const express = require("express");
const router = express.Router();
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const nodemailer = require("nodemailer");
const { Asset, IssuedAsset } = require("../models");
const { authenticateJWT } = require("../middleware/auth");

// --------------------
// Multer setup
// --------------------
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = path.join(__dirname, "../uploads/assets");
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  },
});
const upload = multer({ storage });

// --------------------
// Helpers
// --------------------
const safeNumber = (val) => {
  if (val === undefined || val === null || val === "" || val === "-") return null;
  const n = Number(val);
  return isNaN(n) ? null : n;
};

const safeDate = (input) => {
  if (!input || input === "-" || input === "") return null;
  try {
    if (typeof input === "string") {
      if (/^\d{4}-\d{2}-\d{2}$/.test(input)) return input;
      if (input.includes("T")) return input.split("T")[0];
    }
    const d = new Date(input);
    if (isNaN(d.getTime())) return null;
    return d.toISOString().split("T")[0];
  } catch {
    return null;
  }
};

const handleBase64Image = (imageData) => {
  if (!imageData) return null;
  try {
    const base64Data = imageData.replace(/^data:image\/\w+;base64,/, "");
    const filename = `uploads/assets/${Date.now()}_${Math.random().toString(36).substring(2,8)}.png`;
    fs.writeFileSync(path.join(__dirname, "..", filename), base64Data, "base64");
    return "/" + filename;
  } catch (err) {
    console.error("Error saving base64 image:", err);
    return null;
  }
};

const buildFields = (body) => {
  if (typeof body === "string") {
    try { body = JSON.parse(body); } catch { body = {}; }
  }
  const fields = {
    ASSET_SLNO: body.assetNumber || body.asset_number || "-",
    CATEGORY: body.category || "-",
    ASSET_TYPE: body.type || body.asset_type || body.sub_category || "-",
    BRAND_NAME: body.brand || body.brand_name || "-",
    MODEL_NO: body.model || body.model_no || "-",
    LOCATION: body.location || "-",
    WARRANTY: body.warranty || "-",
    "SUPPLIED BY": body.supplier || body.supplied_by || "-",
    "PROPERTY REGISTER SL NO": body.property_register_sl_no || "-",
    "PR PAGE NO": body.pr_page_no || "-",
    "PR DATE": body.pr_date ? safeDate(body.pr_date) : "-",
    "INSTALL DATE": body.install_date ? safeDate(body.install_date) : "-",
    Remarks: body.remarks || "-",
    QUANTITY: safeNumber(body.quantity) ?? 1,
  };

  for (const key in body) {
    if (![
      "assetNumber","asset_number","category","sub_category","type","brand","brand_name",
      "model","model_no","serial_number","location","assigned_officer","notes","status",
      "warranty","barcode","createdBy","year_of_purchase","purchase_price","supplier",
      "supplied_by","depreciation","property_register_sl_no","pr_page_no","pr_date",
      "install_date","remarks","quantity","image_url"
    ].includes(key)) {
      fields[key.toUpperCase().replace(/_/g," ")] = body[key] || "-";
    }
  }
  return fields;
};

// --------------------
// Nodemailer transporter
// --------------------
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT) || 587,
  secure: false,
  auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
});

transporter.verify((error, success) => {
  if (error) console.error("SMTP verification failed:", error);
  else console.log("SMTP ready to send emails");
});

// --------------------
// ROUTES
// --------------------

// GET all assets
router.get("/", authenticateJWT, async (req, res) => {
  try {
    const assets = await Asset.findAll();
    res.json(assets);
  } catch (err) {
    console.error("Error fetching assets:", err);
    res.status(500).json({ error: "Failed to fetch assets", details: err.message });
  }
});

// GET issued assets
router.get("/issued", authenticateJWT, async (req, res) => {
  try {
    const issued = await IssuedAsset.findAll({ include: [{ model: Asset, as: "assetDetails" }] });
    res.json(issued);
  } catch (err) {
    console.error("Error fetching issued assets:", err);
    res.status(500).json({ error: "Failed to fetch issued assets", details: err.message });
  }
});

// GET received/returned assets
router.get("/received", authenticateJWT, async (req, res) => {
  try {
    const received = await IssuedAsset.findAll({
      where: { status: "returned" },
      include: [{ model: Asset, as: "assetDetails" }],
    });
    res.json(received);
  } catch (err) {
    console.error("Error fetching received assets:", err);
    res.status(500).json({ error: "Failed to fetch received assets", details: err.message });
  }
});

// Check if asset exists
router.get("/check/:assetNumber", authenticateJWT, async (req, res) => {
  try {
    const exists = await Asset.findOne({ where: { asset_number: req.params.assetNumber } });
    res.json({ exists: !!exists });
  } catch (err) {
    console.error("Error checking asset:", err);
    res.status(500).json({ error: "Error checking asset", details: err.message });
  }
});

// GET single asset
router.get("/:assetNumber", authenticateJWT, async (req, res) => {
  try {
    const asset = await Asset.findOne({ where: { asset_number: req.params.assetNumber } });
    if (!asset) return res.status(404).json({ error: "Asset not found" });
    res.json(asset);
  } catch (err) {
    console.error("Error fetching asset:", err);
    res.status(500).json({ error: "Failed to fetch asset", details: err.message });
  }
});

// CREATE asset
router.post("/", authenticateJWT, upload.single("capturedImage"), async (req, res) => {
  try {
    let body = req.body;
    if (typeof body === "string") { try { body = JSON.parse(body); } catch { body = {}; } }
    if (!body.assetNumber && body.asset_number) body.assetNumber = body.asset_number;
    if (!body.assetNumber || !body.category) return res.status(400).json({ error: "Asset Number and Category are required" });

    const fields = buildFields(body);
    const imagePath = body.image_url ? handleBase64Image(body.image_url) : (req.file ? `/uploads/assets/${req.file.filename}` : null);

    const asset = await Asset.create({
      asset_number: body.assetNumber?.trim(),
      category: body.category?.trim(),
      sub_category: body.sub_category?.trim() || null,
      type: body.type?.trim() || body.asset_type?.trim() || null,
      brand: body.brand?.trim() || body.brand_name?.trim() || null,
      model: body.model?.trim() || body.model_no?.trim() || null,
      serial_number: body.serial_number?.trim() || null,
      location: body.location?.trim() || null,
      assigned_officer: safeNumber(body.assigned_officer),
      notes: body.notes?.trim() || null,
      status: body.status?.trim() || "available",
      warranty: body.warranty?.trim() || null,
      barcode: body.barcode?.trim() || null,
      createdBy: req.user?.id?.toString() || null,
      fields,
      year_of_purchase: safeDate(body.year_of_purchase),
      purchase_price: safeNumber(body.purchase_price),
      supplier: body.supplier?.trim() || body.supplied_by?.trim() || null,
      depreciation: safeNumber(body.depreciation) ?? 0,
      property_register_sl_no: body.property_register_sl_no?.trim() || null,
      pr_page_no: body.pr_page_no?.trim() || null,
      pr_date: safeDate(body.pr_date),
      install_date: safeDate(body.install_date),
      image_url: imagePath,
      remarks: body.remarks?.trim() || null,
      quantity: safeNumber(body.quantity) ?? 1,
    });

    res.json({ msg: "Asset added successfully", asset });
  } catch (err) {
    console.error("Failed to add asset:", err);
    res.status(500).json({ error: "Failed to add asset", details: err.message });
  }
});

// UPDATE asset
router.put("/:assetNumber", authenticateJWT, upload.single("capturedImage"), async (req, res) => {
  try {
    let body = req.body;
    if (typeof body === "string") { try { body = JSON.parse(body); } catch { body = {}; } }

    const asset = await Asset.findOne({ where: { asset_number: req.params.assetNumber } });
    if (!asset) return res.status(404).json({ error: "Asset not found" });

    const fields = buildFields(body);
    const imagePath = body.image_url ? handleBase64Image(body.image_url) : (req.file ? `/uploads/assets/${req.file.filename}` : asset.image_url);

    await asset.update({
      category: body.category?.trim() ?? asset.category,
      sub_category: body.sub_category?.trim() ?? asset.sub_category,
      type: body.type?.trim() || body.asset_type?.trim() || asset.type,
      brand: body.brand?.trim() || body.brand_name?.trim() || asset.brand,
      model: body.model?.trim() || body.model_no?.trim() || asset.model,
      serial_number: body.serial_number?.trim() ?? asset.serial_number,
      location: body.location?.trim() ?? asset.location,
      assigned_officer: safeNumber(body.assigned_officer) ?? asset.assigned_officer,
      notes: body.notes?.trim() ?? asset.notes,
      status: body.status?.trim() ?? asset.status,
      warranty: body.warranty?.trim() ?? asset.warranty,
      barcode: body.barcode?.trim() ?? asset.barcode,
      fields,
      year_of_purchase: safeDate(body.year_of_purchase) ?? asset.year_of_purchase,
      purchase_price: safeNumber(body.purchase_price) ?? asset.purchase_price,
      supplier: body.supplier?.trim() || body.supplied_by?.trim() || asset.supplier,
      depreciation: safeNumber(body.depreciation) ?? asset.depreciation,
      property_register_sl_no: body.property_register_sl_no?.trim() ?? asset.property_register_sl_no,
      pr_page_no: body.pr_page_no?.trim() ?? asset.pr_page_no,
      pr_date: safeDate(body.pr_date) ?? asset.pr_date,
      install_date: safeDate(body.install_date) ?? asset.install_date,
      image_url: imagePath,
      remarks: body.remarks?.trim() ?? asset.remarks,
      quantity: safeNumber(body.quantity) ?? asset.quantity ?? 1,
    });

    res.json({ msg: "Asset updated successfully", asset });
  } catch (err) {
    console.error("Failed to update asset:", err);
    res.status(500).json({ error: "Failed to update asset", details: err.message });
  }
});

// DELETE asset
router.delete("/:assetNumber", authenticateJWT, async (req, res) => {
  try {
    const asset = await Asset.findOne({ where: { asset_number: req.params.assetNumber } });
    if (!asset) return res.status(404).json({ error: "Asset not found" });

    if (asset.image_url) {
      const filePath = path.join(__dirname, "..", asset.image_url.replace(/^\//, ""));
      if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
    }

    await asset.destroy();
    res.json({ msg: "Asset deleted successfully" });
  } catch (err) {
    console.error("Failed to delete asset:", err);
    res.status(500).json({ error: "Failed to delete asset", details: err.message });
  }
});

// ISSUE ASSET
router.post("/issue", authenticateJWT, async (req, res) => {
  try {
    let body = req.body;
    if (typeof body === "string") { try { body = JSON.parse(body); } catch { body = {}; } }

    const { asset_number, issued_to, receiver_email, issuer_name, issuer_email, notes, return_at } = body;
    if (!asset_number || !issued_to || !receiver_email) return res.status(400).json({ error: "asset_number, issued_to, and receiver_email are required" });

    const asset = await Asset.findOne({ where: { asset_number } });
    if (!asset) return res.status(404).json({ error: "Asset not found" });

    const issued = await IssuedAsset.create({
      asset_number,
      issued_to,
      receiver_email,
      issuer_name: issuer_name || req.user?.name || null,
      issuer_email: issuer_email || req.user?.email || null,
      notes: notes || null,
      issued_at: new Date(),
      return_at: return_at || null,
      status: "issued",
    });

    const mailOptions = {
      from: `"Asset Management" <${process.env.SMTP_USER}>`,
      to: `${issuer_email || req.user?.email}, ${receiver_email}`,
      subject: `Asset Issued: ${asset_number}`,
      html: `
        <h3>Asset Issued Notification</h3>
        <p><strong>Asset:</strong> ${asset.asset_number} - ${asset.brand || "-"} ${asset.model || "-"}</p>
        <p><strong>Issued To:</strong> ${issued_to}</p>
        <p><strong>Issuer:</strong> ${issuer_name || req.user?.name}</p>
        <p><strong>Quantity:</strong> ${asset.quantity ?? 1}</p>
        <p><strong>Date:</strong> ${new Date(issued.issued_at).toLocaleString()}</p>
        ${notes ? `<p><strong>Notes:</strong> ${notes}</p>` : ""}
      `,
    };
    try { await transporter.sendMail(mailOptions); } catch (emailErr) { console.error("Email sending failed:", emailErr); }

    res.json({ msg: "Asset issued successfully", issued });
  } catch (err) {
    console.error("Failed to issue asset:", err);
    res.status(500).json({ error: "Failed to issue asset", details: err.message });
  }
});

// RECEIVE/RETURN ASSET
router.post("/receive", authenticateJWT, async (req, res) => {
  try {
    let body = req.body;
    if (typeof body === "string") { try { body = JSON.parse(body); } catch { body = {}; } }

    const assetNumber = body.assetNumber || body.asset_number;
    const receiver = body.receiver || body.receivedBy;
    const notifyEmail = body.notifyEmail || body.notify_email;
    const notes = body.notes || "";

    if (!assetNumber || !receiver) return res.status(400).json({ error: "assetNumber and receiver are required" });

    const issuedRecord = await IssuedAsset.findOne({ where: { asset_number: assetNumber, status: "issued" } });
    if (!issuedRecord) return res.status(404).json({ error: "Issued asset record not found" });

    // Update issued record
    issuedRecord.status = "returned";
    issuedRecord.returned_at = new Date();
    issuedRecord.received_by = receiver;
    issuedRecord.notes = notes || issuedRecord.notes;
    await issuedRecord.save();

    // Update main asset
    const asset = await Asset.findOne({ where: { asset_number: assetNumber } });
    if (asset) {
      asset.status = "available";
      await asset.save();
    }

    // Notify email
    if (notifyEmail) {
      const mailOptions = {
        from: `"Asset Management" <${process.env.SMTP_USER}>`,
        to: notifyEmail,
        subject: `Asset Received: ${assetNumber}`,
        html: `
          <h3>Asset Received Notification</h3>
          <p><strong>Asset:</strong> ${assetNumber} - ${asset?.brand || "-"} ${asset?.model || "-"}</p>
          <p><strong>Received By:</strong> ${receiver}</p>
          <p><strong>Date:</strong> ${new Date().toLocaleString()}</p>
          ${notes ? `<p><strong>Notes:</strong> ${notes}</p>` : ""}
        `,
      };
      try { await transporter.sendMail(mailOptions); } catch (emailErr) { console.error("Email sending failed:", emailErr); }
    }

    res.json({ msg: `Asset ${assetNumber} received successfully`, asset, issuedRecord });
  } catch (err) {
    console.error("Failed to receive asset:", err);
    res.status(500).json({ error: "Failed to receive asset", details: err.message });
  }
});

module.exports = router;

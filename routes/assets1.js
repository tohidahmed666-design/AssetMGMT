// routes/asset.js
const express = require("express");
const router = express.Router();
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const jwt = require("jsonwebtoken");

const { Asset, IssueLog } = require("../models"); // Sequelize models

// ========================
// 🔒 Auth Middleware
// ========================
const auth = (req, res, next) => {
  const authHeader = req.headers.authorization || "";
  const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : null;
  if (!token) return res.status(401).json({ error: "Unauthorized" });

  jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
    if (err) return res.status(403).json({ error: "Invalid token" });
    req.user = decoded;
    next();
  });
};

// ========================
// 📂 Multer Setup
// ========================
const UPLOAD_DIR = path.join(__dirname, "../uploads");
if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR);

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, UPLOAD_DIR),
  filename: (_req, file, cb) =>
    cb(null, `${Date.now()}_${file.fieldname}${path.extname(file.originalname)}`)
});
const upload = multer({ storage });

// ========================
// 📦 Routes
// ========================

// Generate new asset number
router.get("/new-number", auth, async (_req, res) => {
  try {
    const lastAsset = await Asset.findOne({ order: [["id", "DESC"]] });
    const lastId = lastAsset ? lastAsset.id : 0;
    const assetNumber = "ASSET-" + String(lastId + 1).padStart(4, "0");
    res.json({ assetNumber });
  } catch (err) {
    console.error("Error generating new asset number:", err);
    res.status(500).json({ msg: "Server error generating asset number", detail: err.message });
  }
});

// ✅ Check if asset exists (for frontend compatibility)
router.get("/check/:assetNumber", auth, async (req, res) => {
  try {
    const { assetNumber } = req.params;
    const asset = await Asset.findOne({ where: { assetNumber } });
    if (!asset) return res.status(404).json({ exists: false });
    res.json({ exists: true, asset });
  } catch (err) {
    console.error("Error checking asset:", err);
    res.status(500).json({ msg: "Server error while checking asset", detail: err.message });
  }
});

// ✅ Add asset (for frontend compatibility) → POST /api/asset
router.post("/", auth, async (req, res) => {
  try {
    const { assetNumber, type, brand, model, location, year, quantity, status } = req.body;

    if (!assetNumber || !type) {
      return res.status(400).json({ msg: "Asset Number and Type are required" });
    }

    const existing = await Asset.findOne({ where: { assetNumber } });
    if (existing) return res.status(400).json({ msg: "Asset Number already exists" });

    const newAsset = await Asset.create({
      assetNumber,
      type,
      brand: brand || null,
      model: model || null,
      location: location || null,
      yearOfPurchase: year || null,
      status: status || "available",
      quantity: quantity || 1,
      createdBy: req.user.email || req.user.name || null
    });

    res.json({ msg: "✅ Asset added successfully", asset: newAsset });
  } catch (err) {
    console.error("Error adding asset:", err);
    res.status(500).json({ msg: "Server error while saving asset", detail: err.message });
  }
});

// Legacy: Add a new asset with upload
router.post("/add", auth, upload.single("assetImage"), async (req, res) => {
  try {
    const { assetNumber, category, subCategory, type, barcode, fields, capturedImage } = req.body;
    if (!assetNumber || !category)
      return res.status(400).json({ msg: "Asset Number and Category are required" });

    const existing = await Asset.findOne({ where: { assetNumber } });
    if (existing) return res.status(400).json({ msg: "Asset Number already exists" });

    const assetFields = fields ? JSON.parse(fields) : {};
    const imageUrl = req.file ? `/uploads/${req.file.filename}` : capturedImage || null;

    const newAsset = await Asset.create({
      assetNumber,
      category,
      subCategory: subCategory || null,
      type: type || null,
      brand: assetFields.brand_name || null,
      model: assetFields.model_no || null,
      serialNumber: assetFields.asset_slno || null,
      location: assetFields.location || null,
      yearOfPurchase: assetFields.year || null,
      warranty: assetFields.warranty || null,
      propertyRegisterSlNo: assetFields.property_register_sl_no || null,
      prPageNo: assetFields.pr_page_no || null,
      prDate: assetFields.pr_date || null,
      notes: assetFields.remarks || null,
      imageUrl,
      barcode: barcode || assetNumber,
      status: "available",
      fields: assetFields,
      createdBy: req.user.email || req.user.name || null
    });

    res.json({ msg: "✅ Asset saved successfully", asset: newAsset });
  } catch (err) {
    console.error("Error adding asset with upload:", err);
    res.status(500).json({ msg: "Server error while saving asset", detail: err.message });
  }
});

// Get all assets
router.get("/all", auth, async (_req, res) => {
  try {
    const assets = await Asset.findAll({ order: [["createdAt", "DESC"]] });
    res.json(assets);
  } catch (err) {
    console.error("Error fetching assets:", err);
    res.status(500).json({ msg: "Server error while fetching assets", detail: err.message });
  }
});

// Issue asset
router.post("/issue", auth, async (req, res) => {
  try {
    const { assetNumber, issuerName, issuerEmail, issuedTo, receiverEmail, notes } = req.body;
    if (!assetNumber || !issuedTo || !receiverEmail)
      return res.status(400).json({ msg: "Missing required fields" });

    const asset = await Asset.findOne({ where: { assetNumber } });
    if (!asset) return res.status(404).json({ msg: "Asset not found" });
    if (["issued", "deleted"].includes(asset.status))
      return res.status(400).json({ msg: `Asset cannot be issued. Current status: ${asset.status}` });

    asset.status = "issued";
    asset.fields = {
      ...asset.fields,
      issuerName: issuerName || "",
      issuerEmail: issuerEmail || "",
      issuedTo,
      receiverEmail,
      issueDate: new Date()
    };
    await asset.save();

    await IssueLog.create({
      serial: asset.assetNumber,
      category: asset.category,
      subCategory: asset.subCategory,
      type: asset.type,
      brand: asset.fields.brand || asset.brand || "",
      model: asset.fields.model || asset.model || "",
      location: asset.fields.location || asset.location || "",
      quantity: asset.fields.quantity || 1,
      issuer: issuerEmail || issuerName || "",
      receiver: issuedTo,
      notes: notes || "",
      barcode: asset.barcode,
      capturedImage: asset.imageUrl,
      dynamicFields: asset.fields,
      issuedAt: new Date()
    });

    res.json({ msg: `✅ Asset ${assetNumber} issued to ${issuedTo}` });
  } catch (err) {
    console.error("Error issuing asset:", err);
    res.status(500).json({ msg: "Server error while issuing asset", detail: err.message });
  }
});

// Receive asset
router.post("/receive", auth, async (req, res) => {
  try {
    const { assetNumber } = req.body;
    const asset = await Asset.findOne({ where: { assetNumber } });
    if (!asset) return res.status(404).json({ msg: "Asset not found" });
    if (asset.status !== "issued") return res.status(400).json({ msg: "Asset is not issued" });

    asset.status = "available";
    const updatedFields = { ...asset.fields };
    delete updatedFields.issuerName;
    delete updatedFields.issuerEmail;
    delete updatedFields.issuedTo;
    delete updatedFields.receiverEmail;
    delete updatedFields.issueDate;
    asset.fields = updatedFields;

    await asset.save();
    res.json({ msg: `✅ Asset ${assetNumber} received successfully` });
  } catch (err) {
    console.error("Error receiving asset:", err);
    res.status(500).json({ msg: "Server error while receiving asset", detail: err.message });
  }
});

// Soft delete asset
router.delete("/:assetNumber", auth, async (req, res) => {
  try {
    const { assetNumber } = req.params;
    const asset = await Asset.findOne({ where: { assetNumber } });
    if (!asset) return res.status(404).json({ msg: "Asset not found" });

    asset.status = "deleted";
    await asset.save();
    res.json({ msg: `🗑️ Asset ${assetNumber} deleted successfully` });
  } catch (err) {
    console.error("Error deleting asset:", err);
    res.status(500).json({ msg: "Error deleting asset", detail: err.message });
  }
});

// Recover asset
router.post("/recover/:assetNumber", auth, async (req, res) => {
  try {
    const { assetNumber } = req.params;
    const asset = await Asset.findOne({ where: { assetNumber } });
    if (!asset) return res.status(404).json({ msg: "Asset not found" });

    asset.status = "available";
    await asset.save();
    res.json({ msg: `♻️ Asset ${assetNumber} recovered successfully` });
  } catch (err) {
    console.error("Error recovering asset:", err);
    res.status(500).json({ msg: "Error recovering asset", detail: err.message });
  }
});

// Filter assets
router.get("/filters", auth, async (req, res) => {
  try {
    const { category, subCategory, type, status, brand, model } = req.query;
    const filter = {};
    if (category) filter.category = category;
    if (subCategory) filter.subCategory = subCategory;
    if (type) filter.type = type;
    if (status) filter.status = status;
    if (brand) filter.brand = brand;
    if (model) filter.model = model;

    const assets = await Asset.findAll({ where: filter, order: [["createdAt", "DESC"]] });
    res.json(assets);
  } catch (err) {
    console.error("Error filtering assets:", err);
    res.status(500).json({ msg: "Server error while filtering assets", detail: err.message });
  }
});

module.exports = router;

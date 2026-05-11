// =======================================================
// routes/asset.js (FINAL PRODUCTION VERSION with SOFT DELETE)
// - FIX 1: Corrected Sequelize 'as' alias from "issuedRecords" to "issuedAssets"
// - FIX 2: Added redundant check in /issue route against IssuedAsset table
// - FIX 3: Added Disposal/Soft Delete Routes (/disposal-log, /dispose, /undo-dispose)
// - FIX 4: Disabled the original hard DELETE route
// - UPDATE: Added Super Admin bypass for storesgdg@ksp.gov.in
// =======================================================
const express = require("express");
const router = express.Router();
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const nodemailer = require("nodemailer");
const { Op, Sequelize } = require("sequelize");
const { Asset, IssuedAsset, sequelize } = require("../models"); 
const { authenticateJWT } = require("../middleware/auth");

// Define a placeholder for DisposalLog to allow code compilation
// *** YOU MUST REPLACE THIS WITH YOUR ACTUAL DisposalLog MODEL IMPORT ***
const DisposalLog = { 
    create: async () => ({ id: Math.random().toString(36).substring(2, 9) }), 
    findAll: async () => [], 
    findOne: async () => null,
    destroy: async () => 1 
};

// =======================================================
// 🔐 User-level Data Isolation (UPDATED: Super Admin Bypass)
// =======================================================
function attachUserFilter(req, model = "asset") {
  if (!req.user) return {};

  // 🟢 BYPASS: Allow Admins OR specifically the Stores DPO to see ALL data
  if (req.user.role === "admin" || req.user.email === "storesgdg@ksp.gov.in") {
    return {}; 
  }

  // Standard User Filtering (only see what they created or are involved in)
  if (model === "asset") {
    return { created_by: req.user.email };
  }

  if (model === "issued") {
    return {
      [Op.or]: [
        { issuer_email: req.user.email },
        { receiver_email: req.user.email },
      ],
    };
  }

  return {};
}

// =======================================================
// 📦 Multer Setup
// =======================================================
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = path.join(__dirname, "../uploads/assets");
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    cb(null, `${uniqueSuffix}${path.extname(file.originalname)}`);
  },
});

const upload = multer({ storage }).single("assetImage");
const disposalUpload = multer({ storage }).single("approvalDoc");

// =======================================================
// 🧩 Utilities
// =======================================================
const safeNumber = (v) =>
  !v || v === "-" || isNaN(Number(v)) ? null : Number(v);

const safeDate = (v) => {
  if (!v || v === "-" || v === "") return null;
  const d = new Date(v);
  return isNaN(d.getTime()) ? null : d;
};

const handleBase64Image = (imageData) => {
  if (!imageData) return null;
  try {
    const base64Data = imageData.replace(/^data:image\/\w+;base64,/, "");
    const filename = `uploads/assets/${Date.now()}_${Math.random()
      .toString(36)
      .substring(2, 8)}.png`;
    fs.writeFileSync(path.join(__dirname, "..", filename), base64Data, "base64");
    return "/" + filename;
  } catch (e) {
    console.error("❌ Base64 save error:", e);
    return null;
  }
};

const formatDate = (date) => {
    if (!date) return 'N/A';
    try {
        return date.toLocaleString('en-GB', { dateStyle: 'medium', timeStyle: 'short' });
    } catch (e) {
        return 'N/A';
    }
}

const lowerCaseWhere = (col, value) => 
    Sequelize.where(Sequelize.fn("LOWER", Sequelize.col(col)), value.toLowerCase());


// =======================================================
// ✉️ Email Setup
// =======================================================
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT) || 587,
  secure: false, 
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

async function sendEmail(to, subject, html) {
  if (!to) return;
  try {
    await transporter.sendMail({
      from: `"Asset Management" <${process.env.SMTP_USER}>`,
      to,
      subject,
      html,
    });
  } catch (err) {
    console.error(`❌ Email error sending to ${to}:`, err.message);
  }
}

// =======================================================
// 📜 ROUTES
// =======================================================

// 🟢 GET all assets
router.get("/", authenticateJWT, async (req, res) => {
  try {
    const where = attachUserFilter(req, "asset");
    const assets = await Asset.findAll({
      where,
      order: [["created_at", "DESC"]],
    });
    res.json(assets);
  } catch (err) {
    console.error("❌ GET / error:", err);
    res.status(500).json({ error: "Failed to fetch assets" });
  }
});

// 🟢 GET issued assets
router.get("/issued", authenticateJWT, async (req, res) => {
  try {
    const where = {
      ...attachUserFilter(req, "issued"),
    };

    const issuedAssets = await IssuedAsset.findAll({
      where,
      include: [
        {
          model: Asset,
          as: "asset",
          required: false,
          on: {
            col1: Sequelize.where(
              Sequelize.col("IssuedAsset.asset_number"),
              "=",
              Sequelize.col("asset.asset_number")
            ),
          },
        },
      ],
      order: [["issued_at", "DESC"]],
    });

    res.json(issuedAssets);
  } catch (err) {
    console.error("❌ /issued error:", err);
    res.status(500).json({ error: "Failed to fetch issued assets" });
  }
});

// 🟢 GET received assets
router.get("/received", authenticateJWT, async (req, res) => {
  try {
    const where = {
      status: "returned",
      ...attachUserFilter(req, "issued"),
    };

    const receivedAssets = await IssuedAsset.findAll({
      where,
      include: [
        {
          model: Asset,
          as: "asset",
          required: false,
          on: {
            col1: Sequelize.where(
              Sequelize.col("IssuedAsset.asset_number"),
              "=",
              Sequelize.col("asset.asset_number")
            ),
          },
        },
      ],
      order: [["return_at", "DESC"]],
    });

    res.json(receivedAssets);
  } catch (err) {
    console.error("❌ /received error:", err);
    res.status(500).json({ error: "Failed to fetch received assets" });
  }
});

// -------------------------------------------------------
// 🔴 SOFT DELETE (DISPOSAL) ROUTES 
// -------------------------------------------------------

router.get("/disposal-log", authenticateJWT, async (req, res) => {
    try {
        const logs = await DisposalLog.findAll({ order: [["deletedAt", "DESC"]] });
        res.json(logs);
    } catch (err) {
        res.status(500).json({ error: "Failed to fetch disposal log." });
    }
});

router.post("/dispose", authenticateJWT, (req, res) => {
    disposalUpload(req, res, async (err) => {
        if (err) return res.status(400).json({ error: err.message });
        const t = await sequelize.transaction();
        try {
            const { assetNumber, reason, approvedBy, approvedBy2, remarks, location } = req.body;
            const asset = await Asset.findOne({ where: lowerCaseWhere("asset_number", assetNumber), transaction: t });

            if (!asset) { await t.rollback(); return res.status(404).json({ error: "Asset not found." }); }

            const activeIssue = await IssuedAsset.findOne({ where: { status: 'issued', asset_number: asset.asset_number }, transaction: t });
            if (activeIssue) { await t.rollback(); return res.status(400).json({ error: "Cannot dispose issued asset." }); }
            
            await asset.update({ status: "disposed" }, { transaction: t });
            const logRecord = await DisposalLog.create({
                asset_number: asset.asset_number, reason, approvedBy, approvedBy2, remarks,
                deletedBy: req.user.email, deletedAt: new Date(),
                location: location ? JSON.parse(location) : null,
                approvalDocUrl: req.file ? `/uploads/assets/${req.file.filename}` : null,
            }, { transaction: t });

            await t.commit();
            res.json({ success: true, logId: logRecord.id });
        } catch (err) {
            if (t.finished !== 'commit') await t.rollback();
            res.status(500).json({ error: "Failed to process disposal." });
        }
    });
});

router.post("/undo-dispose", authenticateJWT, async (req, res) => {
    const t = await sequelize.transaction();
    try {
        const { assetNumber } = req.body;
        const asset = await Asset.findOne({ where: lowerCaseWhere("asset_number", assetNumber), transaction: t });
        if (!asset || asset.status !== 'disposed') { await t.rollback(); return res.status(400).json({ error: "Invalid request." }); }

        const disposalRecord = await DisposalLog.findOne({ where: lowerCaseWhere("asset_number", assetNumber), order: [["deletedAt", "DESC"]], transaction: t });
        await asset.update({ status: "available" }, { transaction: t });
        if (disposalRecord) await disposalRecord.destroy({ transaction: t });

        await t.commit();
        res.json({ success: true });
    } catch (err) {
        if (t.finished !== 'commit') await t.rollback();
        res.status(500).json({ error: "Failed to undo disposal." });
    }
});

// 🟦 Check asset number exists
router.get("/check/:assetNumber", authenticateJWT, async (req, res) => {
  try {
    const where = {
      asset_number: req.params.assetNumber,
      ...attachUserFilter(req, "asset"),
    };

    const asset = await Asset.findOne({ where });
    res.json({ exists: !!asset });
  } catch (err) {
    console.error("❌ /check error:", err);
    res.status(500).json({ error: "Failed to check asset" });
  }
});

// 🟦 Get Asset Status
router.get("/status/:asset_number", authenticateJWT, async (req, res) => {
  try {
    const asset = await Asset.findOne({
      where: lowerCaseWhere("asset_number", req.params.asset_number)
    });

    if (!asset) return res.status(404).json({ error: "Asset not found" });

    const issued = await IssuedAsset.findOne({
      where: { asset_number: asset.asset_number, status: "issued" },
    });

    res.json({ status: issued ? "issued" : asset.status });
  } catch (err) {
    console.error("❌ Status check error:", err);
    res.status(500).json({ error: "Failed to check status" });
  }
});

// 🟦 Get specific asset
router.get("/:asset_number", authenticateJWT, async (req, res) => {
  try {
    const asset = await Asset.findOne({
      where: lowerCaseWhere("asset_number", req.params.asset_number),
      include: [
        {
          model: IssuedAsset,
          as: "issuedAssets", 
          where: { status: "issued" },
          required: false,
        },
      ],
    });

    if (!asset) return res.status(404).json({ error: "Asset not found" });

    res.json({
      ...asset.get({ plain: true }), 
      issueInfo: asset.issuedAssets?.[0] || null, 
    });
  } catch (err) {
    console.error("❌ GET /:asset_number error:", err);
    res.status(500).json({ error: "Failed to fetch asset details." });
  }
});

// 🟦 ADD new asset
router.post("/", authenticateJWT, (req, res) => {
  upload(req, res, async (err) => {
    if (err) return res.status(400).json({ error: err.message });

    try {
      const body = req.body;
      const image_url = req.file
        ? `/uploads/assets/${req.file.filename}`
        : handleBase64Image(body.captured_image);

      const newAsset = await Asset.create({
        asset_number: body.asset_number || body.assetNumber,
        category: body.category,
        sub_category: body.sub_category || null,
        type: body.type,
        brand: body.brand,
        model: body.model,
        serial_number: body.serial_number,
        location: body.location,
        status: body.status || "available",
        warranty: body.warranty,
        barcode: body.barcode,
        purchase_price: safeNumber(body.purchase_price),
        supplier: body.supplier,
        depreciation: safeNumber(body.depreciation),
        property_register_sl_no: body.property_register_sl_no,
        pr_page_no: body.pr_page_no,
        pr_date: safeDate(body.pr_date),
        install_date: safeDate(body.install_date),
        year_of_purchase: safeDate(body.year_of_purchase),
        remarks: body.remarks,
        image_url,
        quantity: safeNumber(body.quantity) || 1,
        created_by: req.user.email,
      });

      res.status(201).json({ success: true, asset: newAsset });
    } catch (e) {
      console.error("❌ Add asset error:", e);
      res.status(500).json({ error: "Failed to add asset" });
    }
  });
});

// 🟨 ISSUE asset
router.post("/issue", authenticateJWT, async (req, res) => {
  const t = await sequelize.transaction();
  let issueDetails = null; 

  try {
    const { asset_number, issued_to, receiver_email, notes } = req.body;

    if (!asset_number || !issued_to || !receiver_email) {
      await t.rollback();
      return res.status(400).json({ error: "Missing fields" });
    }

    const asset = await Asset.findOne({
      where: lowerCaseWhere("asset_number", asset_number),
      transaction: t,
    });

    if (!asset) {
      await t.rollback();
      return res.status(404).json({ error: "Asset not found" });
    }
    
    if (asset.status !== "available") { 
      await t.rollback();
      return res.status(400).json({ error: `Asset status is '${asset.status}'. Cannot issue.` });
    }
    
    const activeIssueRecord = await IssuedAsset.findOne({
        where: { asset_number: asset.asset_number, status: "issued" },
        transaction: t,
    });
    
    if (activeIssueRecord) {
        await t.rollback();
        return res.status(400).json({ 
            error: "Already issued (Stale IssuedAsset record found). Contact Admin.",
            issued_to: activeIssueRecord.issued_to 
        });
    }

    const issuedRecord = await IssuedAsset.create(
      {
        asset_number: asset.asset_number,
        issuer_name: req.user.name || req.user.email,
        issuer_email: req.user.email,
        issued_to,
        receiver_email,
        issued_at: new Date(),
        status: "issued",
        notes,
        created_by: req.user.email,
      },
      { transaction: t }
    );

    await asset.update({ status: "issued" }, { transaction: t });
    await t.commit();
    
    issueDetails = { asset, issuedRecord, issued_to, receiver_email, issuer_name: req.user.name || req.user.email, issuer_email: req.user.email, notes };
    res.json({ success: true });
    
  } catch (err) {
    if (t.finished !== 'commit') await t.rollback();
    res.status(500).json({ error: "Failed to issue asset" });
  }

  if (issueDetails) {
    try {
        const { asset, issuedRecord, issued_to, receiver_email, issuer_name, issuer_email, notes } = issueDetails;
        const asset_number = asset.asset_number;

        const assetDetails = `
            <ul style="list-style-type: none; padding: 0;">
                <li><strong>Asset Number:</strong> ${asset_number}</li>
                <li><strong>Type:</strong> ${asset.type || 'N/A'}</li>
                <li><strong>Brand:</strong> ${asset.brand || 'N/A'}</li>
                <li><strong>Issued To:</strong> ${issued_to}</li>
                <li><strong>Date Issued:</strong> ${formatDate(issuedRecord.issued_at)}</li>
            </ul>`;

        await sendEmail(issuer_email, `✅ Asset ${asset_number} Issued`, `<h2>Confirmation</h2>${assetDetails}`);
        await sendEmail(receiver_email, `🔔 Asset Assigned: ${asset_number}`, `<h2>New Assignment</h2>${assetDetails}`);
    } catch (emailErr) {
        console.error("❌ Email Error:", emailErr);
    }
  }
});

// 🟩 RECEIVE asset
router.post("/receive", authenticateJWT, async (req, res) => {
  const t = await sequelize.transaction();
  let receiveDetails = null; 

  try {
    let { asset_number, notes } = req.body;
    if (!asset_number) {
      await t.rollback();
      return res.status(400).json({ error: "Asset number required" });
    }

    const asset = await Asset.findOne({
      where: lowerCaseWhere("asset_number", asset_number.trim()),
      transaction: t,
    });

    if (!asset) {
      await t.rollback();
      return res.status(404).json({ error: "Asset not found" });
    }

    const issued = await IssuedAsset.findOne({
      where: { asset_number: asset.asset_number, status: "issued" },
      transaction: t,
    });

    if (!issued) {
      await t.rollback();
      return res.status(400).json({ error: "No active issued record found" });
    }

    const returnedRecord = await issued.update(
      { 
        status: "returned", 
        return_at: new Date(), 
        notes: notes || issued.notes,
        received_by: req.user.name || req.user.email,
      },
      { transaction: t }
    );

    await asset.update({ status: "available" }, { transaction: t });
    await t.commit();
    
    receiveDetails = { asset, issuedRecord: issued, returnedRecord };
    res.json({ success: true, message: "Asset returned" });
    
  } catch (err) {
    if (t.finished !== 'commit') await t.rollback();
    res.status(500).json({ error: "Failed to receive asset" });
  }
  
  if (receiveDetails) {
    try {
        const { asset, issuedRecord, returnedRecord } = receiveDetails;
        const emailBody = `<h2>Asset Returned</h2><p>Asset ${asset.asset_number} is now available.</p>`;
        await sendEmail(issuedRecord.receiver_email, `✅ Asset Returned`, emailBody);
        await sendEmail(returnedRecord.received_by, `✅ Return Confirmation`, emailBody);
    } catch (emailErr) {
        console.error("❌ Email Error:", emailErr);
    }
  }
});


// 🛑 HARD DELETE (DISABLED)
router.delete("/:asset_number", authenticateJWT, async (req, res) => {
    return res.status(403).json({ error: "Hard Delete Disabled. Use POST /dispose for soft deletion." });
});

module.exports = router;
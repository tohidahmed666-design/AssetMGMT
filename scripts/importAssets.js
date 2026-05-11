// scripts/importAssets.js
const XLSX = require("xlsx");
const path = require("path");
const sequelize = require("../config/database");

// Safe Asset model import (supports named or default export)
let Asset, IssuedAsset, ReceiveLog;
try {
  const assetModule = require("../models/Asset");
  Asset = assetModule.Asset || assetModule;

  const issuedModule = require("../models/IssuedAsset");
  IssuedAsset = issuedModule.IssuedAsset || issuedModule;

  const receivedModule = require("../models/ReceiveLog");
  ReceiveLog = receivedModule.ReceiveLog || receivedModule;

  if (!Asset) throw new Error("Asset model is undefined");
} catch (err) {
  console.error("Failed to import models:", err.message);
  process.exit(1);
}

// Header mapping for common Excel variants
const headerMap = {
  "ASSET_ TYPE": "ASSET_TYPE",
  "ASSET TYPE": "ASSET_TYPE",
  "ASSETSLNO": "ASSET_SLNO",
  "IP Address": "IP_ADDRESS",
  "Hostname": "HOSTNAME",
  "MONITOR MODEL": "MONITOR_MODEL",
  "Supplied By": "SUPPLIED_BY",
  "MONITOR SERIAL NO.": "MONITOR_SERIAL_NO",
};

// Normalize Excel row keys
function normalizeRowKeys(row) {
  const normalized = {};
  for (let key of Object.keys(row)) {
    let cleanKey = key.replace(/["']/g, "").replace(/[\u200B-\u200D\uFEFF]/g, "").trim();
    cleanKey = headerMap[cleanKey] || cleanKey;
    cleanKey = cleanKey.replace(/\s+/g, "_").replace(/_+/g, "_").trim().toUpperCase();
    normalized[cleanKey] = row[key];
  }
  return normalized;
}

// Sanitize values
function sanitizeValue(value) {
  if (value === undefined || value === null) return null;
  const v = String(value).replace(/[\u200B-\u200D\uFEFF]/g, "").trim();
  return v === "" ? null : v;
}

(async () => {
  try {
    const filePath = path.join(__dirname, "assets_data.xlsx");
    const workbook = XLSX.readFile(filePath);
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const jsonData = XLSX.utils.sheet_to_json(sheet);
    console.log(`Loaded ${jsonData.length} rows from ${workbook.SheetNames[0]}`);

    await sequelize.authenticate();
    console.log("Connected to database.");

    // Delete dependent records first
    console.log("Deleting old dependent records...");
    if (IssuedAsset && typeof IssuedAsset.destroy === "function") {
      await IssuedAsset.destroy({ where: {} });
    }
    if (ReceiveLog && typeof ReceiveLog.destroy === "function") {
      await ReceiveLog.destroy({ where: {} });
    }
    console.log("Dependent records deleted.");

    // Delete old asset records
    console.log("Deleting old asset records...");
    await Asset.destroy({ where: {} });
    console.log("Old assets deleted.");

    let success = 0, failed = 0;

    for (const rawRow of jsonData) {
      const row = normalizeRowKeys(rawRow);

      const asset_number = sanitizeValue(row["ASSET_SLNO"]);
      const category = sanitizeValue(row["ASSET_TYPE"] || row["ASSET_CATEGORY"]);

      if (!asset_number || !category) {
        console.warn("Skipped row missing asset_number or category:", rawRow);
        failed++;
        continue;
      }

      const assetData = {
        asset_number,
        category,
        brand: sanitizeValue(row["MONITOR_MAKE"] || row["MBOARD_BRAND"]),
        model: sanitizeValue(row["MODEL_NO"] || row["MONITOR_MODEL"]),
        status: "available",
        location: sanitizeValue(row["LOCATION"]),
        fields: {
          HOSTNAME: sanitizeValue(row["HOSTNAME"]),
          IP_ADDRESS: sanitizeValue(row["IP_ADDRESS"]),
          PROCESSOR_TYPE: sanitizeValue(row["PROCESSOR_TYPE"]),
          PROCESSOR_SPEED: sanitizeValue(row["PROCESSOR_SPEED"]),
          RAM_TYPE: sanitizeValue(row["RAM_TYPE"]),
          RAM_SIZE: sanitizeValue(row["RAM_SIZE"]),
          RAM_QTY: sanitizeValue(row["RAM_QTY"]),
          HDD_TYPE: sanitizeValue(row["HDD_TYPE"]),
          HDD_SIZE: sanitizeValue(row["HDD_SIZE"]),
          HDD_QTY: sanitizeValue(row["HDD_QTY"]),
          MBOARD_BRAND: sanitizeValue(row["MBOARD_BRAND"]),
          MBOARD_CHIPSET: sanitizeValue(row["MBOARD_CHIPSET"]),
          MONITOR_TYPE: sanitizeValue(row["MONITOR_TYPE"]),
          MONITOR_SIZE: sanitizeValue(row["MONITOR_SIZE"]),
          MONITOR_MAKE: sanitizeValue(row["MONITOR_MAKE"]),
          MONITOR_MODEL: sanitizeValue(row["MONITOR_MODEL"]),
          MONITOR_SERIAL_NO: sanitizeValue(row["MONITOR_SERIAL_NO"]),
          INSTALL_DATE: sanitizeValue(row["INSTALL_DATE"]),
          SUPPLIED_BY: sanitizeValue(row["SUPPLIED_BY"]),
        },
      };

      try {
        await Asset.create(assetData);
        success++;
      } catch (err) {
        failed++;
        console.error(
          "Failed to insert row:",
          err.errors ? err.errors.map(e => e.message).join(", ") : err.message
        );
        console.log("Row causing error:", row);
      }
    }

    console.log(`Import complete. Success: ${success}, Failed: ${failed}`);
    process.exit(0);
  } catch (err) {
    console.error("Import failed:", err.message);
    process.exit(1);
  }
})();

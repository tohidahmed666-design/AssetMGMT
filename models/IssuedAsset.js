"use strict";

/**
 * 🧾 IssuedAsset Model
 * --------------------------------------------------
 * Tracks asset issuance and return transactions.
 * Linked to the main Asset table through asset_number.
 * Provides helper getters, validation, and associations.
 */

const { DataTypes, Model } = require("sequelize");
const sequelize = require("../config/database");
const Asset = require("./Asset");

// =====================================================
// 🧩 Helper — Normalize Date Inputs
// =====================================================
function normalizeDateTime(input) {
  if (!input || input === "" || input === "-") return null;
  const d =
    input instanceof Date && !isNaN(input)
      ? input
      : new Date(input);
  return isNaN(d.getTime()) ? null : d;
}

// =====================================================
// 🧠 Model Definition
// =====================================================
class IssuedAsset extends Model {
  /** 🏷️ Human-readable description */
  get description() {
    return `${this.asset_number || "N/A"} → ${this.issued_to || "Unknown"}`;
  }

  /** ✅ Whether asset is returned */
  get isReturned() {
    return this.status === "returned";
  }

  /** ⏰ Formatted date helpers */
  get formattedIssuedAt() {
    return this.issued_at
      ? new Date(this.issued_at).toLocaleString("en-GB")
      : "-";
  }

  get formattedReturnAt() {
    return this.return_at
      ? new Date(this.return_at).toLocaleString("en-GB")
      : "-";
  }

  /** 💻 Nested asset details if included */
  get assetInfo() {
    if (!this.Asset) return {};
    const a = this.Asset;
    return {
      serial: a.serial_number || "-",
      type: a.type || "-",
      brand: a.brand || "-",
      model: a.model || "-",
      location: a.location || "-",
      quantity: a.quantity ?? 1,
      status: a.status || "-",
    };
  }
}

// =====================================================
// 🏗️ Initialization
// =====================================================
IssuedAsset.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },

    asset_number: {
      type: DataTypes.STRING(255),
      allowNull: false,
      references: { model: "Assets", key: "asset_number" },
    },

    issuer_name: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },

    issuer_email: {
      type: DataTypes.STRING(255),
      allowNull: false,
      validate: { isEmail: true },
    },

    issued_to: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },

    receiver_email: {
      type: DataTypes.STRING(255),
      allowNull: false,
      validate: { isEmail: true },
    },

    issued_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
      set(value) {
        this.setDataValue("issued_at", normalizeDateTime(value));
      },
    },

    return_at: {
      type: DataTypes.DATE,
      allowNull: true,
      set(value) {
        this.setDataValue("return_at", normalizeDateTime(value));
      },
    },

    // ===========================
    // ✅ STATUS NORMALIZATION FIX
    // ===========================
    status: {
      type: DataTypes.ENUM("issued", "returned"),
      allowNull: false,
      defaultValue: "issued",
      set(value) {
        const normalized = value
          ? String(value).trim().toLowerCase()
          : "issued";
        this.setDataValue("status", normalized);
      },
    },

    notes: {
      type: DataTypes.TEXT,
      allowNull: true,
    },

    received_by: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },

    created_by: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },

    /** Optional linkage to user (future use) */
    userId: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
  },
  {
    sequelize,
    modelName: "IssuedAsset",
    tableName: "IssuedAssets",
    underscored: true,
    freezeTableName: true,
    timestamps: true,

    hooks: {
      beforeCreate: (record) => {
        record.issued_at =
          normalizeDateTime(record.issued_at) || new Date();

        // Force normalized lowercase values
        if (record.status)
          record.status = String(record.status)
            .trim()
            .toLowerCase();
        else record.status = "issued";
      },

      beforeUpdate: (record) => {
        if (record.status)
          record.status = String(record.status)
            .trim()
            .toLowerCase();
      },
    },
  }
);

// =====================================================
// 🔗 Associations
// =====================================================

// Many IssuedAsset → One Asset
IssuedAsset.belongsTo(Asset, {
  foreignKey: "asset_number",
  targetKey: "asset_number",
  as: "Asset",
  constraints: false,
});

// One Asset → Many IssuedAssets
Asset.hasMany(IssuedAsset, {
  foreignKey: "asset_number",
  sourceKey: "asset_number",
  as: "IssuedRecords",
  constraints: false,
});

// =====================================================
// ✅ Export
// =====================================================
module.exports = IssuedAsset;

"use strict";

const { DataTypes, Model } = require("sequelize");
const sequelize = require("../config/database");

/* ----------------------------------------------------
   NORMALIZE DATE
---------------------------------------------------- */
function normalizeDateTime(input) {
  if (!input || input === "" || input === "-") return null;
  let d = new Date(input);
  return isNaN(d.getTime()) ? null : d;
}

/* ----------------------------------------------------
   ASSET MODEL
---------------------------------------------------- */
class Asset extends Model {
  // For table display
  get fullDescription() {
    return `${this.asset_number || ""} - ${this.brand || ""} ${this.model || ""}`.trim();
  }

  formatDate(field) {
    const v = this[field];
    if (!v) return "-";
    try {
      return new Date(v).toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "long",
        year: "numeric",
      });
    } catch {
      return "-";
    }
  }

  get formattedInstallDate() {
    return this.formatDate("install_date");
  }

  get formattedPrDate() {
    return this.formatDate("pr_date");
  }

  get formattedYearOfPurchase() {
    return this.formatDate("year_of_purchase");
  }

  toJSON() {
    const values = { ...this.get() };

    // Parse dynamic field JSON
    if (typeof values.fields === "string") {
      try {
        values.fields = JSON.parse(values.fields);
      } catch {
        values.fields = {};
      }
    }
    return values;
  }

  /* ----------------------------------------------------
     Populate dynamic fields before save
  ---------------------------------------------------- */
  populateFields() {
    let fields = this.fields || {};

    if (typeof fields === "string") {
      try {
        fields = JSON.parse(fields);
      } catch {
        fields = {};
      }
    }

    fields.ASSET_SLNO = fields.ASSET_SLNO || this.asset_number || "-";
    fields.CATEGORY = fields.CATEGORY || this.category || "-";
    fields.ASSET_TYPE = fields.ASSET_TYPE || this.sub_category || this.type || "-";
    fields.BRAND_NAME = fields.BRAND_NAME || this.brand || "-";
    fields.MODEL_NO = fields.MODEL_NO || this.model || "-";
    fields.SERIAL_NUMBER = fields.SERIAL_NUMBER || this.serial_number || "-";
    fields.LOCATION = fields.LOCATION || this.location || "-";
    fields.WARRANTY = fields.WARRANTY || this.warranty || "-";
    fields["Supplied By"] = fields["Supplied By"] || this.supplier || "-";
    fields["PROPERTY REGISTER SL NO"] =
      fields["PROPERTY REGISTER SL NO"] || this.property_register_sl_no || "-";
    fields["PR PAGE NO"] = fields["PR PAGE NO"] || this.pr_page_no || "-";
    fields["PR DATE"] = fields["PR DATE"] || (this.pr_date ? this.pr_date.toISOString() : "-");
    fields["INSTALL DATE"] =
      fields["INSTALL DATE"] || (this.install_date ? this.install_date.toISOString() : "-");
    fields.Remarks = fields.Remarks || this.remarks || "-";

    // Numeric fields safe default
    fields.QUANTITY = fields.QUANTITY || this.quantity || 1;
    fields.PURCHASE_PRICE = fields.PURCHASE_PRICE || this.purchase_price || 0;
    fields.DEPRECIATION = fields.DEPRECIATION || this.depreciation || 0;

    fields.ASSIGNED_OFFICER = fields.ASSIGNED_OFFICER || this.assigned_officer || "-";
    fields.BARCODE = fields.BARCODE || this.barcode || this.asset_number || "-";
    fields.CREATED_BY = fields.CREATED_BY || this.created_by || "-";

    this.fields = fields;
  }
}

/* ----------------------------------------------------
   SEQUELIZE FIELDS
---------------------------------------------------- */
Asset.init(
  {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },

    asset_number: { type: DataTypes.STRING, allowNull: false, unique: true },

    category: { type: DataTypes.STRING, allowNull: false, defaultValue: "Default" },
    sub_category: { type: DataTypes.STRING, allowNull: true },
    type: { type: DataTypes.STRING, allowNull: true },

    brand: { type: DataTypes.STRING, allowNull: true },
    model: { type: DataTypes.STRING, allowNull: true },
    serial_number: { type: DataTypes.STRING, allowNull: true },

    location: { type: DataTypes.STRING, allowNull: true },
    assigned_officer: { type: DataTypes.STRING, allowNull: true },

    notes: { type: DataTypes.TEXT, allowNull: true },

    status: { type: DataTypes.STRING, allowNull: false, defaultValue: "available" },

    warranty: { type: DataTypes.STRING, allowNull: true },
    barcode: { type: DataTypes.STRING, allowNull: true },

    /* VERY IMPORTANT: Used to filter per user email */
    created_by: { type: DataTypes.STRING, allowNull: true },

    /* Dynamic JSON */
    fields: {
      type: DataTypes.TEXT,
      allowNull: true,
      get() {
        const raw = this.getDataValue("fields");
        if (!raw) return {};
        try {
          return JSON.parse(raw);
        } catch {
          return {};
        }
      },
      set(value) {
        this.setDataValue("fields", JSON.stringify(value || {}));
      },
    },

    year_of_purchase: {
      type: DataTypes.DATE,
      allowNull: true,
      set(value) {
        this.setDataValue("year_of_purchase", normalizeDateTime(value));
      },
    },

    purchase_price: { type: DataTypes.FLOAT, allowNull: true, defaultValue: 0 },
    supplier: { type: DataTypes.STRING, allowNull: true },
    depreciation: { type: DataTypes.FLOAT, allowNull: true, defaultValue: 0 },

    property_register_sl_no: { type: DataTypes.STRING, allowNull: true },
    pr_page_no: { type: DataTypes.STRING, allowNull: true },

    pr_date: {
      type: DataTypes.DATE,
      allowNull: true,
      set(value) {
        this.setDataValue("pr_date", normalizeDateTime(value));
      },
    },

    image_url: { type: DataTypes.STRING, allowNull: true },

    install_date: {
      type: DataTypes.DATE,
      allowNull: true,
      set(value) {
        this.setDataValue("install_date", normalizeDateTime(value));
      },
    },

    remarks: { type: DataTypes.TEXT, allowNull: true },

    quantity: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 1 },
  },
  {
    sequelize,
    modelName: "Asset",
    tableName: "Assets",
    timestamps: true,
    underscored: true,
    createdAt: "created_at",
    updatedAt: "updated_at",

    hooks: {
      beforeCreate: (asset) => asset.populateFields(),
      beforeUpdate: (asset) => asset.populateFields(),
    },
  }
);

module.exports = Asset;

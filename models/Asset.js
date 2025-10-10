// models/Asset.js
const { DataTypes, Model } = require("sequelize");
const sequelize = require("../config/database");

// --------------------
// Safe date normalizer for SQL Server
// --------------------
function normalizeDateTime(input) {
  if (!input || input === "" || input === "-") return null;

  let d;
  if (input instanceof Date && !isNaN(input)) {
    d = input;
  } else if (typeof input === "string") {
    d = new Date(input);
  } else if (typeof input === "number") {
    d = new Date(input);
  } else {
    return null;
  }

  if (isNaN(d.getTime())) return null;
  return d;
}

class Asset extends Model {
  // Full description for display
  get fullDescription() {
    return `${this.asset_number} - ${this.brand || ""} ${this.model || ""}`.trim();
  }

  // Frontend formatted dates
  get formattedPurchaseDate() { return this.formatDate("year_of_purchase"); }
  get formattedInstallDate() { return this.formatDate("install_date"); }
  get formattedPrDate() { return this.formatDate("pr_date"); }

  // Populate dynamic fields
  populateFields() {
    let fields = this.fields;
    if (typeof fields === "string") {
      try { fields = JSON.parse(fields); } catch { fields = {}; }
    }
    fields = fields || {};

    fields.ASSET_SLNO = this.asset_number || fields.ASSET_SLNO || "-";
    fields.LOCATION = this.location || fields.LOCATION || "-";
    fields.ASSET_TYPE = this.sub_category || fields.ASSET_TYPE || "-";
    fields.BRAND_NAME = this.brand || fields.BRAND_NAME || "-";
    fields.MODEL_NO = this.model || fields.MODEL_NO || "-";
    fields["Sl No"] = fields["Sl No"] || this.serial_number || "001";
    fields.WARRANTY = this.warranty || fields.WARRANTY || "-";
    fields["Supplied By"] = this.supplier || fields["Supplied By"] || "-";
    fields["PROPERTY REGISTER SL NO"] = this.property_register_sl_no || fields["PROPERTY REGISTER SL NO"] || "-";
    fields["PR PAGE NO"] = this.pr_page_no || fields["PR PAGE NO"] || "-";
    fields["PR DATE"] = this.pr_date ? this.pr_date.toISOString() : fields["PR DATE"] || "-";
    fields["INSTALL DATE"] = this.install_date ? this.install_date.toISOString() : fields["INSTALL DATE"] || "-";
    fields.Remarks = this.remarks || fields.Remarks || "-";
    fields.QUANTITY = this.quantity || fields.QUANTITY || 1;
    fields.PURCHASE_PRICE = this.purchase_price || fields.PURCHASE_PRICE || 0;
    fields.DEPRECIATION = this.depreciation || fields.DEPRECIATION || 0;
    fields.ASSIGNED_OFFICER = this.assigned_officer || fields.ASSIGNED_OFFICER || null;
    fields.SERIAL_NUMBER = this.serial_number || fields.SERIAL_NUMBER || "-";
    fields.BARCODE = this.barcode || fields.BARCODE || this.asset_number || "-";

    this.fields = fields;
  }

  // Safely convert numeric fields
  getNumeric(field) {
    const val = this[field];
    if (val == null || isNaN(val)) return 0;
    return Number(val);
  }

  // Format date for frontend display
  formatDate(field) {
    const val = this[field];
    if (!val) return "-";
    return new Date(val).toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "long",
      year: "numeric",
    });
  }
}

Asset.init(
  {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    asset_number: { type: DataTypes.STRING(255), allowNull: false, unique: true },
    category: { type: DataTypes.STRING(255), allowNull: false },
    sub_category: { type: DataTypes.STRING(255), allowNull: true },
    type: { type: DataTypes.STRING(255), allowNull: true },
    brand: { type: DataTypes.STRING(255), allowNull: true },
    model: { type: DataTypes.STRING(255), allowNull: true },
    serial_number: { type: DataTypes.STRING(255), allowNull: true },
    location: { type: DataTypes.STRING(255), allowNull: true },
    assigned_officer: { type: DataTypes.INTEGER, allowNull: true },
    notes: { type: DataTypes.TEXT, allowNull: true },
    status: { type: DataTypes.STRING(255), allowNull: false, defaultValue: "available" },
    warranty: { type: DataTypes.STRING(255), allowNull: true },
    barcode: { type: DataTypes.STRING(255), allowNull: true },
    createdBy: { type: DataTypes.STRING(255), allowNull: true },
    created_at: { type: DataTypes.DATE, allowNull: true },
    updated_at: { type: DataTypes.DATE, allowNull: true },

    fields: {
      type: DataTypes.TEXT,
      allowNull: true,
      get() {
        const raw = this.getDataValue("fields");
        try { return raw ? JSON.parse(raw) : {}; } catch { return {}; }
      },
      set(value) { this.setDataValue("fields", JSON.stringify(value || {})); },
    },

    year_of_purchase: {
      type: DataTypes.DATE,
      allowNull: true,
      set(value) { this.setDataValue("year_of_purchase", normalizeDateTime(value)); },
    },
    purchase_price: { type: DataTypes.FLOAT, allowNull: true, defaultValue: 0 },
    supplier: { type: DataTypes.STRING(255), allowNull: true },
    depreciation: { type: DataTypes.FLOAT, allowNull: true, defaultValue: 0 },
    property_register_sl_no: { type: DataTypes.STRING(255), allowNull: true },
    pr_page_no: { type: DataTypes.STRING(255), allowNull: true },
    pr_date: {
      type: DataTypes.DATE,
      allowNull: true,
      set(value) { this.setDataValue("pr_date", normalizeDateTime(value)); },
    },
    image_url: { type: DataTypes.STRING(510), allowNull: true },
    install_date: {
      type: DataTypes.DATE,
      allowNull: true,
      set(value) { this.setDataValue("install_date", normalizeDateTime(value)); },
    },
    remarks: { type: DataTypes.TEXT, allowNull: true },
    quantity: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 1 },
  },
  {
    sequelize,
    modelName: "Asset",
    tableName: "Assets",
    timestamps: false,
    underscored: true,
    hooks: {
      beforeValidate: (asset) => {
        asset.install_date = normalizeDateTime(asset.install_date);
        asset.pr_date = normalizeDateTime(asset.pr_date);
        asset.year_of_purchase = normalizeDateTime(asset.year_of_purchase);
      },
      beforeCreate: (asset) => {
        if (!asset.status) asset.status = "available";
        if (asset.quantity == null) asset.quantity = 1;
        if (asset.depreciation == null) asset.depreciation = 0;
        if (!asset.created_at) asset.created_at = new Date();
        if (!asset.updated_at) asset.updated_at = new Date();
        asset.populateFields();
      },
      beforeUpdate: (asset) => {
        asset.updated_at = new Date();
        asset.populateFields();
      },
    },
  }
);

module.exports = Asset;

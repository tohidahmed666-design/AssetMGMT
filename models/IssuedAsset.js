// models/IssuedAsset.js
const { DataTypes, Model } = require("sequelize");
const sequelize = require("../config/database");
const Asset = require("./Asset");

// --------------------
// Safe date parser for issued/return dates
// --------------------
function normalizeDateTime(input) {
  if (!input || input === "" || input === "-") return null;

  let d;
  if (input instanceof Date && !isNaN(input)) {
    d = input;
  } else if (typeof input === "string" || typeof input === "number") {
    d = new Date(input);
  } else {
    return null;
  }

  return isNaN(d.getTime()) ? null : d;
}

class IssuedAsset extends Model {
  /**
   * Returns a brief description of the issued asset
   * Example: "ASSET-1024 issued to John Doe"
   */
  get description() {
    return `${this.asset_number} issued to ${this.issued_to}`;
  }

  /**
   * Checks if the asset is returned
   * @returns {boolean}
   */
  isReturned() {
    return this.status === "returned";
  }

  /**
   * Formatted issued date for frontend
   */
  get formattedIssuedAt() {
    return this.issued_at ? new Date(this.issued_at).toLocaleString("en-GB") : "-";
  }

  /**
   * Formatted return date for frontend
   */
  get formattedReturnAt() {
    return this.return_at ? new Date(this.return_at).toLocaleString("en-GB") : "-";
  }

  /**
   * Returns the asset details safely
   */
  get assetInfo() {
    if (!this.assetDetails) return {};
    return {
      serial: this.assetDetails.serial_number || "-",
      type: this.assetDetails.type || "-",
      brand: this.assetDetails.brand || "-",
      model: this.assetDetails.model || "-",
      location: this.assetDetails.location || "-",
      quantity: this.assetDetails.quantity ?? 1,
    };
  }
}

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
      references: {
        model: Asset,
        key: "asset_number",
      },
      onDelete: "NO ACTION",
    },
    issuer_name: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    issuer_email: {
      type: DataTypes.STRING(255),
      allowNull: true,
      validate: {
        isEmail: true,
      },
    },
    issued_to: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    receiver_email: {
      type: DataTypes.STRING(255),
      allowNull: false,
      validate: {
        isEmail: true,
      },
    },
    issued_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: sequelize.literal("GETDATE()"),
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
    status: {
      type: DataTypes.STRING(50),
      allowNull: false,
      defaultValue: "issued",
    },
    notes: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
  },
  {
    sequelize,
    modelName: "IssuedAsset",
    tableName: "issued_assets",
    timestamps: false,
    underscored: true,
    hooks: {
      beforeCreate: (record) => {
        if (!record.status) record.status = "issued";
      },
      beforeUpdate: (record) => {
        if (record.changed("status") && !record.status) record.status = "issued";
      },
    },
    defaultScope: {
      attributes: { exclude: ["notes"] },
    },
    scopes: {
      withNotes: { attributes: {} },
    },
  }
);

// --------------------
// Associations
// --------------------
IssuedAsset.belongsTo(Asset, {
  foreignKey: "asset_number",
  targetKey: "asset_number",
  as: "assetDetails",
});

Asset.hasMany(IssuedAsset, {
  foreignKey: "asset_number",
  sourceKey: "asset_number",
  as: "issuedRecords",
});

module.exports = IssuedAsset;

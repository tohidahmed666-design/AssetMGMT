// models/DeletedAsset.js
const { DataTypes, Model } = require("sequelize");
const sequelize = require("../config/database");

class DeletedAsset extends Model {}

DeletedAsset.init(
  {
    asset_number: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    category: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    type: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    brand: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    model: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    location: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    reason: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    remarks: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    deletedBy: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    deletedAt: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
    fields: {
      type: DataTypes.TEXT, // <-- Change from JSON to TEXT
      allowNull: true,
      get() {
        const raw = this.getDataValue("fields");
        return raw ? JSON.parse(raw) : null;
      },
      set(value) {
        this.setDataValue("fields", value ? JSON.stringify(value) : null);
      },
    },
  },
  {
    sequelize,
    modelName: "DeletedAsset",
    tableName: "DeletedAssets",
    timestamps: false,
  }
);

module.exports = DeletedAsset;

// models/Log.js
const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");
const Asset = require("./Asset");

const Log = sequelize.define("Log", {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  action: {
    type: DataTypes.STRING,
    allowNull: false,   // e.g. "ADD_ASSET", "DELETE_ASSET"
  },
  assetId: {
    type: DataTypes.INTEGER,
    references: {
      model: Asset,
      key: "id",
    },
    allowNull: true,
  },
  user: {
    type: DataTypes.STRING,
    defaultValue: "system", // who performed the action
  },
  timestamp: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
  },
  details: {
    type: DataTypes.JSON,  // flexible extra info
    defaultValue: {},
  },
}, {
  tableName: "Logs",
  timestamps: false, // we already have timestamp field
});

module.exports = Log;

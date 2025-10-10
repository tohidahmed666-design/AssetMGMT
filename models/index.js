"use strict";

const { Sequelize, DataTypes } = require("sequelize");
const config = require("../config/config.js");

// --------------------
// Select environment
// --------------------
const env = process.env.NODE_ENV || "development";
const dbConfig = config[env];

// --------------------
// Initialize Sequelize
// --------------------
const sequelize = new Sequelize(
  dbConfig.database,
  dbConfig.username,
  dbConfig.password,
  {
    host: dbConfig.host,
    port: dbConfig.port,
    dialect: dbConfig.dialect,
    dialectOptions: dbConfig.dialectOptions,
    logging: dbConfig.logging,
  }
);

// --------------------
// Import models (ES6 classes)
// --------------------
const User = require("./User");
const Otp = require("./Otp");
const Asset = require("./Asset");
const IssuedAsset = require("./IssuedAsset");
const LoginHistory = require("./LoginHistory");
const Contact = require("./Contact");

// --------------------
// Initialize each model (important step!)
// --------------------
const models = [User, Otp, Asset, IssuedAsset, LoginHistory, Contact];

for (const model of models) {
  if (model.init && model.fields && model.options) {
    model.init(model.fields, { ...model.options, sequelize });
  }
}

// --------------------
// Define associations (after init!)
// --------------------
User.hasMany(LoginHistory, { foreignKey: "userId", onDelete: "CASCADE" });
LoginHistory.belongsTo(User, { foreignKey: "userId" });

User.hasMany(Asset, { foreignKey: "assigned_officer", onDelete: "SET NULL" });
Asset.belongsTo(User, { foreignKey: "assigned_officer" });

User.hasMany(Contact, { foreignKey: "resolvedBy", onDelete: "SET NULL" });
Contact.belongsTo(User, { foreignKey: "resolvedBy" });

User.hasMany(Otp, { foreignKey: "userId", onDelete: "CASCADE" });
Otp.belongsTo(User, { foreignKey: "userId" });

// --------------------
// Optional: DB Sync Helper
// --------------------
async function syncDB({ force = false } = {}) {
  try {
    await sequelize.authenticate();
    console.log("✅ Database connection established.");
    await sequelize.sync({ alter: !force, force });
    console.log("✅ Models synchronized successfully.");
  } catch (err) {
    console.error("❌ Database sync failed:", err);
    throw err;
  }
}

// --------------------
// Export everything
// --------------------
module.exports = {
  sequelize,
  Sequelize,
  User,
  Otp,
  Asset,
  IssuedAsset,
  LoginHistory,
  Contact,
  syncDB,
};

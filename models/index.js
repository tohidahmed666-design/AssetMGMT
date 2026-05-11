"use strict";

/**
 * 🌐 Centralized Sequelize Model Loader & Association Manager
 * -----------------------------------------------------------
 * - Loads all models (each model defines its own fields)
 * - Injects shared Sequelize instance
 * - Configures all associations
 * - Provides DB sync helper
 */

const { Sequelize } = require("sequelize");
const sequelize = require("../config/database");

// ---------------------------------------------------
// 📦 Import All Models (each one includes its own init)
// ---------------------------------------------------
const User = require("./User");
const Otp = require("./Otp");
const Asset = require("./Asset");                // ✅ fully defined model
const IssuedAsset = require("./IssuedAsset");
const LoginHistory = require("./LoginHistory");
const Contact = require("./Contact");
const DeletedAsset = require("./DeletedAsset");

// ---------------------------------------------------
// 🧠 Initialize All Models (NO FIELD DEFINITIONS HERE)
// ---------------------------------------------------
User.init(User.fields, { ...User.options, sequelize });

// Otp, LoginHistory, Contact, DeletedAsset, Asset, and IssuedAsset 
// are already initialized in their own files.

// IssuedAsset is already initialized in its own file.

// ---------------------------------------------------
// 🔗 Setup Associations
// ---------------------------------------------------

// User ↔ LoginHistory
User.hasMany(LoginHistory, { foreignKey: "userId", as: "loginHistory" });
LoginHistory.belongsTo(User, { foreignKey: "userId", as: "user" });

// User ↔ Asset (owner)
User.hasMany(Asset, { foreignKey: "userId", as: "userAssets" });
Asset.belongsTo(User, { foreignKey: "userId", as: "owner" });

// User ↔ IssuedAsset (issuer)
User.hasMany(IssuedAsset, { foreignKey: "userId", as: "issuedByUser" });
IssuedAsset.belongsTo(User, { foreignKey: "userId", as: "issuer" });

// Asset ↔ IssuedAsset (by asset_number)
Asset.hasMany(IssuedAsset, {
  foreignKey: "asset_number",
  sourceKey: "asset_number",
  as: "issuedAssets",
  constraints: false,
});
IssuedAsset.belongsTo(Asset, {
  foreignKey: "asset_number",
  targetKey: "asset_number",
  as: "asset",
  constraints: false,
});

// User ↔ Contact (resolver)
User.hasMany(Contact, { foreignKey: "resolvedBy", as: "resolvedContacts" });
Contact.belongsTo(User, { foreignKey: "resolvedBy", as: "resolver" });

// User ↔ OTP
User.hasMany(Otp, { foreignKey: "userId", as: "otps" });
Otp.belongsTo(User, { foreignKey: "userId", as: "user" });

// DeletedAsset ↔ User
DeletedAsset.belongsTo(User, { foreignKey: "deletedBy", as: "deletedByUser" });

// ---------------------------------------------------
// 🧮 Sync Helper
// ---------------------------------------------------
async function syncDB({ force = false } = {}) {
  try {
    await sequelize.authenticate();
    console.log("✅ Database connected successfully");

    await sequelize.sync({ alter: !force, force });
    console.log("✅ All models synced");

  } catch (err) {
    console.error("❌ Database sync failed:", err.message);
    throw err;
  }
}

// ---------------------------------------------------
// 📤 Exports
// ---------------------------------------------------
module.exports = {
  sequelize,
  Sequelize,
  User,
  Otp,
  Asset,
  IssuedAsset,
  LoginHistory,
  Contact,
  DeletedAsset,
  syncDB,
};

// list_assets.js
require("dotenv").config();
const mongoose = require("mongoose");
const Asset = require("./models/Asset");

const MONGO_URI = process.env.MONGO_URI || "mongodb://localhost:27017/assetmgmtsys";

mongoose.connect(MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(async () => {
    console.log("✅ Connected to MongoDB");

    const assets = await Asset.find().lean();
    if (assets.length === 0) {
      console.log("⚠️ No assets found in the database.");
    } else {
      console.log(`📦 Found ${assets.length} assets:`);
      assets.forEach((a, i) => {
        console.log(`${i + 1}. Asset Number: ${a.assetNumber}, Type: ${a.type}, Brand: ${a.fields?.brand || a.brand || "-"}, Model: ${a.fields?.model || a.model || "-"}`);
      });
    }

    mongoose.connection.close();
  })
  .catch(err => {
    console.error("❌ MongoDB connection error:", err);
  });

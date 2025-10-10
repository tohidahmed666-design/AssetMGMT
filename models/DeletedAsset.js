const mongoose = require("mongoose");
const AssetSchema = require("./Asset").schema; // reuse the Asset schema
module.exports = mongoose.model("DeletedAsset", AssetSchema);

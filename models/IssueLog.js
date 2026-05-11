/**
 * models/IssueLog.js
 * -----------------------------------------------------
 * This file is kept for backward compatibility.
 * It re-exports the new IssuedAsset model so that
 * existing code referring to "IssueLog" still works.
 * -----------------------------------------------------
 */

const IssuedAsset = require("./IssuedAsset");

module.exports = IssuedAsset;

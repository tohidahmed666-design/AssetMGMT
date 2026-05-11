// scripts/testKeys.js
const XLSX = require("xlsx");
const path = require("path");

function normalizeKey(key) {
  return key.replace(/\s+/g, "_").replace(/_+/g, "_").trim().toUpperCase();
}

const filePath = path.join(__dirname, "assets_data.xlsx");
const workbook = XLSX.readFile(filePath);
const sheet = workbook.Sheets[workbook.SheetNames[0]];
const jsonData = XLSX.utils.sheet_to_json(sheet);

console.log(`Loaded ${jsonData.length} rows\n`);

const firstRow = jsonData[0];
console.log("Original column headers:");
console.log(Object.keys(firstRow));

console.log("\nNormalized column headers:");
console.log(Object.keys(firstRow).map(normalizeKey));

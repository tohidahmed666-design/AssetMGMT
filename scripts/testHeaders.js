const XLSX = require("xlsx");
const path = require("path");

const filePath = path.join(__dirname, "assets_data.xlsx");
const workbook = XLSX.readFile(filePath);
const sheetName = workbook.SheetNames[0];
const sheet = workbook.Sheets[sheetName];
const jsonData = XLSX.utils.sheet_to_json(sheet, { defval: "" });

console.log("Excel columns found:\n", Object.keys(jsonData[0]));

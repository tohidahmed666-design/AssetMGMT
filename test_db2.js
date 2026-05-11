require('dotenv').config();
const { sequelize } = require('./models');

async function test() {
  const result = await sequelize.query("SELECT * FROM otps");
  console.log("Raw OTPs table data:", result[0]);
  process.exit();
}

test();

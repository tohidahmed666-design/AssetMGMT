require('dotenv').config();
const { Otp, User } = require('./models');

async function test() {
  const otps = await Otp.findAll();
  console.log("ALL OTPS:", otps.map(o => o.toJSON()));
  process.exit();
}

test();

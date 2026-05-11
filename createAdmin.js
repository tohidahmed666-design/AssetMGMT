// createAdmin.js
const bcrypt = require("bcrypt");
const sequelize = require("./config/database");
const User = require("./models/User");

async function createAdmin() {
  try {
    await sequelize.authenticate();
    await sequelize.sync();

    const existing = await User.findOne({ where: { username: "admin" } });
    if (existing) {
      console.log("⚠️ Admin already exists");
      process.exit();
    }

    const hash = await bcrypt.hash("P@ssw0rd", 10);
    await User.create({
      name: "Administrator",
      username: "admin",
      password: hash,
    });

    console.log("✅ Admin created: admin / P@ssw0rd");
    process.exit();
  } catch (err) {
    console.error("❌ Error creating admin:", err);
    process.exit(1);
  }
}

createAdmin();

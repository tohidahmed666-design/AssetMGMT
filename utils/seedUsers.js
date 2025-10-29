// utils/seedUsers.js
const bcrypt = require("bcryptjs");
const { User, sequelize } = require("../models");

// ------------------------------
// Default police stations / users
// ------------------------------
const stations = [
  
];

// ------------------------------
// Seeding Function
// ------------------------------
async function seedUsers() {
  console.log("🚀 Starting user seeding...");

  let createdCount = 0;
  let skippedCount = 0;

  const transaction = await sequelize.transaction();

  try {
    for (const station of stations) {
      const normalizedEmail = station.email.trim().toLowerCase();

      // Check if user already exists
      const existing = await User.findOne({
        where: { email: normalizedEmail },
        transaction,
      });

      if (existing) {
        console.log(`ℹ Skipped (already exists): ${station.name}`);
        skippedCount++;
        continue;
      }

      // Create new user
      await User.create(
        {
          username: station.name.trim(),
          email: normalizedEmail,
          password: await bcrypt.hash("default123", 10), // default password
          role: "user",
          status: "active",
          verified: true,
          failed_login_attempts: 0,
          two_factor_enabled: false,
          phone: null,
          department: null,
          profile_image: null,
          notes: null,
          last_password_change: new Date(),
          last_login: null,
        },
        { transaction }
      );

      console.log(`✅ Created: ${station.name}`);
      createdCount++;
    }

    await transaction.commit();
    console.log("🎉 Seeding completed successfully");
    console.log(`📊 Summary -> Created: ${createdCount}, Skipped: ${skippedCount}`);
  } catch (err) {
    await transaction.rollback();
    console.error("❌ Seeding failed, transaction rolled back:", err.message);
    process.exit(1);
  }
}

// ------------------------------
// Run directly from CLI
// ------------------------------
if (require.main === module) {
  (async () => {
    try {
      await sequelize.authenticate();
      console.log("✅ Database connection established.");
      await seedUsers();
      process.exit(0);
    } catch (err) {
      console.error("❌ Database connection failed:", err.message);
      process.exit(1);
    }
  })();
}

// ------------------------------
// Export for programmatic use
// ------------------------------
module.exports = seedUsers;

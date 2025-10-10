// utils/seedUsers.js
const bcrypt = require("bcryptjs");
const { User, sequelize } = require("../models");

// ------------------------------
// Default police stations / users
// ------------------------------
const stations = [
  { name: "Gadag Town PS", email: "towngdg@ksp.gov.in" },
  { name: "Gadag Traffic PS", email: "trafficgdg@ksp.gov.in" },
  { name: "Betageri PS", email: "betageri@ksp.gov.in" },
  { name: "Betageri Extention PS", email: "betageriext@ksp.gov.in" },
  { name: "Gadag Rural PS", email: "gadagrural@ksp.gov.in" },
  { name: "Gadag Women PS", email: "gadagwomen@ksp.gov.in" },
  { name: "Gadag CEN PS", email: "gadagcen@ksp.gov.in" },
  { name: "Mulagund PS", email: "mulagund@ksp.gov.in" },
  { name: "Ron PS", email: "ron@ksp.gov.in" },
  { name: "Naregal PS", email: "naregal@ksp.gov.in" },
  { name: "Gajendragad PS", email: "gajendragad@ksp.gov.in" },
  { name: "Shirahatti PS", email: "shirahatti@ksp.gov.in" },
  { name: "Lakshmeshwar PS", email: "lakshmeshwar@ksp.gov.in" },
  { name: "Nargund PS", email: "nargund@ksp.gov.in" },
  { name: "Mundargi PS", email: "mundargi@ksp.gov.in" },
  { name: "Gadag Sub-Division", email: "gadagsubdiv@ksp.gov.in" },
  { name: "NARAGUND SDPO", email: "naragundsdpo@ksp.gov.in" },
  { name: "Betageri Circle", email: "betagericircle@ksp.gov.in" },
  { name: "Ron Circle", email: "roncircle@ksp.gov.in" },
  { name: "Shirahatti Circle", email: "shirahatticircle@ksp.gov.in" },
  { name: "GADAG DAR", email: "gadagdar@ksp.gov.in" },
  { name: "Gadag Control Room", email: "controlroom@ksp.gov.in" },
  { name: "Computer Section DPO Gadag", email: "compsection@ksp.gov.in" },
  { name: "CDR Section, DPO, Gadag", email: "cdrsection@ksp.gov.in" },
  { name: "SOCO Officers", email: "soco@ksp.gov.in" },
  { name: "SMMC DPO Gadag", email: "smmc@ksp.gov.in" },
  { name: "Passport DPO Gadag", email: "passport@ksp.gov.in" },
  { name: "SS ACT DPO Gadag", email: "ssact@ksp.gov.in" },
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

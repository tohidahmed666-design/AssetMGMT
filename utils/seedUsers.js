// utils/seedUsers.js
const bcrypt = require("bcryptjs");
const { User, sequelize } = require("../models");

// ------------------------------
// Default police stations / users
// ------------------------------
const stations = [
  { name: "Gadag Town PS", email: "towngdg@ksp.gov.in" },
  { name: "Gadag Traffic PS", email: "trafficgdg@ksp.gov.in" },
  { name: "Betageri PS", email: "betagerigdg@ksp.gov.in" },
  { name: "Betageri Extention PS", email: "betageriextn@ksp.gov.in" },
  { name: "Gadag Rural PS", email: "ruralgdggdg@ksp.gov.in" },
  { name: "Gadag Women PS", email: "womengdg@ksp.gov.in" },
  { name: "Gadag CEN PS", email: "cengdg@ksp.gov.in" },
  { name: "Mulagund PS", email: "mulagundgdg@ksp.gov.in" },
  { name: "Ron PS", email: "rongdg@ksp.gov.in" },
  { name: "Naregal PS", email: "naregalgdg@ksp.gov.in" },
  { name: "Gajendragad PS", email: "gajendragadgdg@ksp.gov.in" },
  { name: "Shirahatti PS", email: "shirahattigdg@ksp.gov.in" },
  { name: "Lakshmeshwar PS", email: "lakshmeshwargdg@ksp.gov.in" },
  { name: "Nargund PS", email: "nargundgdg@ksp.gov.in" },
  { name: "Mundargi PS", email: "mundaragigdg@ksp.gov.in" },
  { name: "Gadag Sub-Division", email: "sdpogdg@ksp.gov.in" },
  { name: "NARAGUND SDPO", email: "sdponargundgdg@ksp.gov.in" },
  { name: "Betageri Circle", email: "cpibetagerigdg@ksp.gov.in" },
  { name: "Ron Circle", email: "cpirongdg@ksp.gov.in" },
  { name: "Shirahatti Circle", email: "cpishirahattigdg@ksp.gov.in" },
  { name: "GADAG DAR", email: "dargdg@ksp.gov.in" },
  { name: "Stores, DPO Gadag",email: "storesgdg@ksp.gov.in"},
  { name: "Gadag Control Room", email: "dcgdg@ksp.gov.in" },
  { name: "Computer Section DPO Gadag", email: "gdgsysadm@ksp.gov.in" },
  { name: "CDR Section, DPO, Gadag", email: "cdr1spgdg@ksp.gov.in" },
  { name: "SOCO Officers", email: "socogdg@ksp.gov.in" },
  { name: "SMMC DPO Gadag", email: "smmgdg@ksp.gov.in" },
  { name: "Passport DPO Gadag", email: "passportgdg@ksp.gov.in" },
  { name: "DCRB DPO Gadag", email: "dcrbgdg@ksp.gov.in"},
  { name: "DSB DPO Gadag", email: "dsbgdg@ksp.gov.in"},
  { name: "FPU DPO Gadag", email: "fpugdg@ksp.gov.in"},
  { name: "CB Section DPO Gadag", email: "spgdg@ksp.gov.in"},
  { name: "Crime Section DPO Gadag", email: "sscrmgdg@ksp.gov.in"},
  { name: "SS ACT DPO Gadag", email: "ssactgdg@ksp.gov.in" },
  { name: "PA to ASP Gadag", email: "patospgdg@ksp.gov.in"},
  { name: "AAO DPO Gadag", email: "aaogdg@ksp.gov.in"},
  { name: "SS EST DPO Gadag", email: "ssestgdg@ksp.gov.in"},
  { name: "EST1, DPO, Gadag", email: "est1gdg@ksp.gov.in"},
  { name: "EST2, DPO, Gadag", email: "est2gdg@ksp.gov.in"},
  { name: "EST3, DPO, Gadag", email: "est3gdg@ksp.gov.in"},
  { name: "EST4, DPO, Gadag", email: "est4gdg@ksp.gov.in"},
  { name: "EST5, DPO, Gadag", email: "est5gdg@ksp.gov.in"},
  { name: "EST6, DPO, Gadag", email: "est6gdg@ksp.gov.in"},
  { name: "ACT1, DPO, Gadag", email: "act1gdg@ksp.gov.in"},
  { name: "ACT2, DPO, Gadag", email: "act2gdg@ksp.gov.in"},
  { name: "ACT3, DPO, Gadag", email: "act3gdg@ksp.gov.in"},
  { name: "ACT4, DPO, Gadag", email: "act4gdg@ksp.gov.in"},
  { name: "ACT5, DPO, Gadag", email: "act5gdg@ksp.gov.in"},
  { name: "ACT6, DPO, Gadag", email: "act6gdg@ksp.gov.in"}
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
          password: "default@123", 
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
    if (require.main === module) {
      process.exit(1);
    } else {
      throw err; // Let the caller handle it
    }
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

// fix_passwords.js
const { User } = require("./models");
const bcrypt = require("bcryptjs");

async function cleanup() {
  try {
    const users = await User.scope("withPassword").findAll();
    console.log(`Checking ${users.length} users...`);

    for (const user of users) {
      // If password doesn't start with $2a$, $2b$, or $2y$, it's plain text
      const isHashed = /^\$2[ayb]\$/.test(user.password);

      if (!isHashed) {
        console.log(`🔧 Fixing plain-text password for: ${user.email}`);
        user.password = await bcrypt.hash(user.password, 10);
        await user.save();
      }
    }
    console.log("✅ All passwords are now securely hashed.");
    process.exit(0);
  } catch (err) {
    console.error("❌ Cleanup failed:", err);
    process.exit(1);
  }
}

cleanup();
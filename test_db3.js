require('dotenv').config();
const { sequelize } = require('./models');

async function dropTables() {
  try {
    await sequelize.query('DROP TABLE IF EXISTS otps CASCADE');
    await sequelize.query('DROP TABLE IF EXISTS login_history CASCADE');
    await sequelize.query('DROP TABLE IF EXISTS contacts CASCADE');
    await sequelize.query('DROP TABLE IF EXISTS deleted_assets CASCADE');
    console.log("Dropped bad tables");
  } catch(e) {
    console.error(e);
  }
  process.exit();
}

dropTables();

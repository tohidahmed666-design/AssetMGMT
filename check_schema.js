const sequelize = require('./config/database');
async function test() {
  try {
    const [results] = await sequelize.query("SELECT COLUMN_NAME, DATA_TYPE FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'Assets'");
    console.log(results);
  } catch(e) {
    console.error(e);
  }
  process.exit();
}
test();

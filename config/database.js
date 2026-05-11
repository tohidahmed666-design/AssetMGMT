// config/database.js
const { Sequelize } = require("sequelize");

let sequelize;
const dbUrl = process.env.DATABASE_URL ? process.env.DATABASE_URL.trim() : null;

if (dbUrl) {
  console.log("🌐 Database: Using PostgreSQL (Supabase/Render)");
  sequelize = new Sequelize(dbUrl, {
    dialect: "postgres",
    logging: false,
    dialectOptions: {
      ssl: {
        require: true,
        rejectUnauthorized: false
      }
    }
  });
} else {
  console.log("🏠 Database: Using local SQL Server");
  sequelize = new Sequelize("AssetDB", "sa", "Project@123", {
    host: "localhost",
    port: 1433, 
    dialect: "mssql",
    dialectOptions: {
      options: {
        encrypt: false,
        trustServerCertificate: true
      }
    },
    logging: false,
  });
}

module.exports = sequelize;


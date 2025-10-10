// config/database.js
const { Sequelize } = require("sequelize");

const sequelize = new Sequelize("AssetDB", "sa", "Project@123", {
  host: "localhost",
  port: 1433, 
  dialect: "mssql",
  dialectOptions: {
    options: {
       // your SQL Server instance
      encrypt: false,             // for local server
      trustServerCertificate: true
    }
  },
  logging: false, // disable SQL logging
});

module.exports = sequelize;

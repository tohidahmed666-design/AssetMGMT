// config/config.js

/**
 * Sequelize configuration file
 * Used by sequelize-cli for migrations and seeders.
 *
 * Supports SQL Server (MSSQL) with explicit port handling.
 * Each environment can use separate databases and credentials.
 */

module.exports = {
  development: {
    username: process.env.DB_USER || "sa",
    password: process.env.DB_PASS || "Project@123",
    database: process.env.DB_NAME || "AssetDB",
    host: process.env.DB_HOST || "localhost",
    port: process.env.DB_PORT ? parseInt(process.env.DB_PORT, 10) : 1433, // Ensure numeric port
    dialect: "mssql",
    dialectOptions: {
      options: {
        encrypt: false,               // Disable SSL for local dev
        trustServerCertificate: true, // Allow self-signed certs
        enableArithAbort: true,       // Recommended for newer SQL Server
        port: process.env.DB_PORT ? parseInt(process.env.DB_PORT, 10) : 1433,
      },
    },
    logging: console.log, // Set to false to disable query logging
    define: {
      timestamps: false,
      underscored: true,
    },
  },

  test: {
    username: process.env.DB_USER || "sa",
    password: process.env.DB_PASS || "Project@123",
    database: process.env.DB_NAME_TEST || "AssetDB_test",
    host: process.env.DB_HOST || "localhost",
    port: process.env.DB_PORT ? parseInt(process.env.DB_PORT, 10) : 1433,
    dialect: "mssql",
    dialectOptions: {
      options: {
        encrypt: false,
        trustServerCertificate: true,
        enableArithAbort: true,
        port: process.env.DB_PORT ? parseInt(process.env.DB_PORT, 10) : 1433,
      },
    },
    logging: false,
    define: {
      timestamps: false,
      underscored: true,
    },
  },

  production: {
    username: process.env.DB_USER || "sa",
    password: process.env.DB_PASS || "Project@123",
    database: process.env.DB_NAME_PROD || "AssetDB_prod",
    host: process.env.DB_HOST || "localhost",
    port: process.env.DB_PORT ? parseInt(process.env.DB_PORT, 10) : 1433,
    dialect: "mssql",
    dialectOptions: {
      options: {
        encrypt: true,               // Recommended for production
        trustServerCertificate: true,
        enableArithAbort: true,
        port: process.env.DB_PORT ? parseInt(process.env.DB_PORT, 10) : 1433,
      },
    },
    logging: false,
    define: {
      timestamps: false,
      underscored: true,
    },
  },
};

"use strict";

/**
 * Migration: create-assets
 * Defines the schema for the Assets table.
 */

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("Assets", {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false,
      },

      asset_number: {
        type: Sequelize.STRING(255),
        allowNull: false,
        unique: true, // ✅ Prevent duplicates
      },

      category: {
        type: Sequelize.STRING(255),
        allowNull: false,
      },

      sub_category: {
        type: Sequelize.STRING(255),
        allowNull: true,
      },

      type: {
        type: Sequelize.STRING(255),
        allowNull: true,
      },

      brand: {
        type: Sequelize.STRING(255),
        allowNull: true,
      },

      model: {
        type: Sequelize.STRING(255),
        allowNull: true,
      },

      serial_number: {
        type: Sequelize.STRING(255),
        allowNull: true,
      },

      location: {
        type: Sequelize.STRING(255),
        allowNull: true,
      },

      assigned_officer: {
        type: Sequelize.INTEGER,
        allowNull: true,
      },

      notes: {
        type: Sequelize.TEXT,
        allowNull: true,
      },

      status: {
        type: Sequelize.STRING(255),
        allowNull: false,
        defaultValue: "available",
      },

      warranty: {
        type: Sequelize.STRING(255),
        allowNull: true,
      },

      barcode: {
        type: Sequelize.STRING(255),
        allowNull: true,
      },

      fields: {
        type: Sequelize.TEXT, // JSON string of extra fields
        allowNull: true,
      },

      purchase_price: {
        type: Sequelize.FLOAT,
        allowNull: true,
        defaultValue: 0,
      },

      supplier: {
        type: Sequelize.STRING(255),
        allowNull: true,
      },

      depreciation: {
        type: Sequelize.FLOAT,
        allowNull: true,
        defaultValue: 0,
      },

      property_register_sl_no: {
        type: Sequelize.STRING(255),
        allowNull: true,
      },

      pr_page_no: {
        type: Sequelize.STRING(255),
        allowNull: true,
      },

      // ✅ DATE FIELDS
      pr_date: {
        type: Sequelize.DATEONLY, // stores only YYYY-MM-DD
        allowNull: true,
      },

      install_date: {
        type: Sequelize.DATEONLY,
        allowNull: true,
      },

      year_of_purchase: {
        type: Sequelize.INTEGER, // store only the year
        allowNull: true,
      },

      image_url: {
        type: Sequelize.STRING(510),
        allowNull: true,
      },

      remarks: {
        type: Sequelize.TEXT,
        allowNull: true,
      },

      created_by: {
        type: Sequelize.STRING(255),
        allowNull: true,
      },

      quantity: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 1,
      },

      created_at: {
        type: Sequelize.DATE,
        allowNull: true,
        defaultValue: Sequelize.fn("GETDATE"), // ✅ auto set in MSSQL
      },

      updated_at: {
        type: Sequelize.DATE,
        allowNull: true,
        defaultValue: Sequelize.fn("GETDATE"),
      },
    });

    // ✅ Useful indexes
    await queryInterface.addIndex("Assets", ["asset_number"]);
    await queryInterface.addIndex("Assets", ["category"]);
    await queryInterface.addIndex("Assets", ["status"]);
    await queryInterface.addIndex("Assets", ["location"]);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable("Assets");
  },
};

// models/Contact.js
const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const Contact = sequelize.define(
  "Contact",
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: { notEmpty: true },
    },
    email: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: { isEmail: true, notEmpty: true },
    },
    subject: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: { notEmpty: true },
    },
    message: {
      type: DataTypes.TEXT,
      allowNull: false,
      validate: { notEmpty: true },
    },
    screenshotUrl: {
      type: DataTypes.STRING,
      allowNull: true, // optional screenshot
    },
    status: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: "new", // new, in_progress, resolved
    },
    respondedAt: {
      type: DataTypes.DATE,
      allowNull: true,
    },
  },
  {
    tableName: "contacts",
    timestamps: true,
    underscored: true,
  }
);

module.exports = Contact;

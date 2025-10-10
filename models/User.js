"use strict";

const { DataTypes, Model } = require("sequelize");
const bcrypt = require("bcryptjs");

class User extends Model {
  /**
   * Returns display name for UI or logs.
   * Example: "john_doe <john@example.com>"
   */
  get displayName() {
    return `${this.username || ""} <${this.email}>`;
  }

  /**
   * Compare plain password with hashed password in DB
   * @param {string} password
   * @returns {Promise<boolean>}
   */
  async checkPassword(password) {
    return await bcrypt.compare(password, this.password);
  }

  /**
   * Returns true if user has admin role
   */
  isAdmin() {
    return this.role === "admin";
  }

  /**
   * Auto-update timestamps when record changes
   */
  static updateTimestamps(user) {
    user.updated_at = new Date();
  }

  /**
   * Automatically hash passwords if changed
   */
  static async hashPasswordIfNeeded(user) {
    if (user.password && !user.password.startsWith("$2a$")) {
      user.password = await bcrypt.hash(user.password, 10);
      user.last_password_change = new Date();
    }
  }
}

/**
 * Sequelize Field Definitions
 * Used in models/index.js via: User.init(User.fields, { sequelize, modelName: 'User' })
 */
User.fields = {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  username: {
    type: DataTypes.STRING(100),
    allowNull: false,
  },
  email: {
    type: DataTypes.STRING(510),
    allowNull: false,
    set(value) {
      this.setDataValue("email", value.trim().toLowerCase());
    },
    validate: {
      isEmail: true,
    },
  },
  password: {
    type: DataTypes.STRING(255),
    allowNull: false,
  },
  role: {
    type: DataTypes.STRING(100),
    allowNull: false,
    defaultValue: "user",
  },
  status: {
    type: DataTypes.STRING(255),
    allowNull: false,
    defaultValue: "active",
  },
  verified: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: true,
  },
  phone: {
    type: DataTypes.STRING(40),
    allowNull: true,
  },
  department: {
    type: DataTypes.STRING(200),
    allowNull: true,
  },
  profile_image: {
    type: DataTypes.STRING(255),
    allowNull: true,
  },
  notes: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  last_login: {
    type: DataTypes.DATE,
    allowNull: true,
  },
  failed_login_attempts: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0,
  },
  last_password_change: {
    type: DataTypes.DATE,
    allowNull: true,
  },
  two_factor_enabled: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false,
  },
  created_at: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW,
  },
  updated_at: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW,
  },
};

/**
 * Sequelize Model Options
 */
User.options = {
  tableName: "Users",
  timestamps: false, // We manage created_at and updated_at manually
  hooks: {
    beforeCreate: async (user) => {
      await User.hashPasswordIfNeeded(user);
      user.created_at = new Date();
      user.updated_at = new Date();
    },
    beforeUpdate: async (user) => {
      await User.hashPasswordIfNeeded(user);
      User.updateTimestamps(user);
    },
  },
  defaultScope: {
    attributes: { exclude: ["password"] },
  },
  scopes: {
    withPassword: { attributes: {} },
  },
};

module.exports = User;

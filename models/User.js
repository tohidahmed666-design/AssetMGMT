"use strict";

const { DataTypes, Model } = require("sequelize");
const bcrypt = require("bcryptjs");

class User extends Model {
  /**
   * For UI / debugging
   */
  get displayName() {
    return `${this.username || ""} <${this.email}>`;
  }

  /**
   * Compare given password with hashed password
   */
  async checkPassword(password) {
    if (!password || !this.password) return false;
    return await bcrypt.compare(password, this.password);
  }

  /**
   * Is admin?
   */
  isAdmin() {
    return this.role === "admin";
  }

  /**
   * Hide password field in API responses
   */
  toJSON() {
    const values = { ...this.get() };
    delete values.password;
    return values;
  }

  /**
   * Update timestamp on update
   */
  static updateTimestamps(user) {
    user.updated_at = new Date();
  }

  /**
   * Hash password if needed
   * FIX: Supports $2a$, $2b$, and $2y$ prefixes to prevent double-hashing 
   * or failing to hash on password reset.
   */
  static async hashPasswordIfNeeded(user) {
    if (user.password) {
      // Check if password is already a valid bcrypt hash
      const isAlreadyHashed = /^\$2[ayb]\$/.test(user.password.substring(0, 4));

      if (!isAlreadyHashed) {
        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(user.password, salt);
        user.last_password_change = new Date();
      }
    }
  }
}

/* ---------------------------------------------------
   Sequelize Field Definitions
   Used by models/index.js → User.init(User.fields)
---------------------------------------------------- */
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
    unique: true,
    set(value) {
      if (value) this.setDataValue("email", value.trim().toLowerCase());
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

/* ---------------------------------------------------
   Sequelize Options
---------------------------------------------------- */
User.options = {
  sequelize: null, // set later in models/index.js
  modelName: "User",
  tableName: "Users",

  timestamps: false, // we manually manage created_at + updated_at

  hooks: {
    beforeCreate: async (user) => {
      await User.hashPasswordIfNeeded(user);
      user.created_at = new Date();
      user.updated_at = new Date();
    },
    beforeUpdate: async (user) => {
      // Check if password was changed before attempting to hash
      if (user.changed("password")) {
        await User.hashPasswordIfNeeded(user);
      }
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
// models/LoginHistory.js
const { DataTypes, Model } = require("sequelize");
const sequelize = require("../config/database");

class LoginHistory extends Model {
  /**
   * Returns a summary string like:
   * "john@example.com from 192.168.1.5 - SUCCESS"
   */
  get summary() {
    return `${this.email} from ${this.ip_address || "Unknown IP"} - ${
      this.success ? "SUCCESS" : "FAILED"
    }`;
  }
}

// Define model fields separately
LoginHistory.fields = {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
    comment: "Primary key for LoginHistory",
  },
  user_id: {
    type: DataTypes.INTEGER,
    allowNull: true, // allow null for failed login attempts
    references: {
      model: "Users", // string name (avoid circular import)
      key: "id",
    },
    onDelete: "SET NULL",
    onUpdate: "CASCADE",
    comment: "Reference to User ID",
  },
  email: {
    type: DataTypes.STRING(150),
    allowNull: false,
    validate: { isEmail: true },
    set(value) {
      this.setDataValue("email", value.trim().toLowerCase());
    },
    comment: "Email used for login attempt",
  },
  ip_address: {
    type: DataTypes.STRING(50),
    allowNull: true,
    comment: "IP address of login attempt",
  },
  user_agent: {
    type: DataTypes.STRING(255),
    allowNull: true,
    comment: "Browser or client user agent",
  },
  success: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false,
    comment: "Was login successful?",
  },
  login_at: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW,
    comment: "Timestamp of login attempt",
  },
};

// Model options
LoginHistory.options = {
  sequelize,
  modelName: "LoginHistory",
  tableName: "login_history",
  timestamps: true,
  createdAt: "created_at",
  updatedAt: "updated_at",
  underscored: true,
  indexes: [
    { fields: ["user_id"] },
    { fields: ["email"] },
    { fields: ["login_at"] },
  ],
};

module.exports = LoginHistory;

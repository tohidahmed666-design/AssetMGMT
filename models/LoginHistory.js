// models/LoginHistory.js
const { DataTypes, Model } = require("sequelize");
const sequelize = require("../config/database");

class LoginHistory extends Model {
  get summary() {
    return `${this.email || "Unknown Email"} from ${
      this.ip_address || "Unknown IP"
    } - ${this.success ? "SUCCESS" : "FAILED"}`;
  }
}

LoginHistory.init(
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
      comment: "Primary key for login_history table",
    },

    user_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: "Users",
        key: "id",
      },
      onDelete: "SET NULL",
      onUpdate: "CASCADE",
      comment: "Reference to the user who attempted login",
    },

    email: {
      type: DataTypes.STRING(150),
      allowNull: false,
      validate: {
        isEmail: {
          msg: "Invalid email format in LoginHistory",
        },
      },
      set(value) {
        if (value) {
          this.setDataValue("email", value.trim().toLowerCase());
        }
      },
      comment: "Email address used during login attempt",
    },

    ip_address: {
      type: DataTypes.STRING(50),
      allowNull: true,
      comment: "IP address from which the login attempt was made",
    },

    user_agent: {
      type: DataTypes.STRING(255),
      allowNull: true,
      comment: "Browser or device user agent information",
    },

    success: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
      comment: "Indicates if login attempt was successful",
    },

    login_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
      comment: "Timestamp when the login attempt occurred",
    },
  },
  {
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
  }
);

module.exports = LoginHistory;

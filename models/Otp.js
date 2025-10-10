// models/Otp.js
const { DataTypes, Model } = require("sequelize");
const User = require("./User");

class Otp extends Model {}

Otp.fields = {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
    comment: "Primary key for OTP",
  },
  userId: {
    type: DataTypes.INTEGER,
    allowNull: true, // OTP can exist without a linked user
    field: "user_id",
    references: {
      model: User,
      key: "id",
    },
    onDelete: "SET NULL",
    onUpdate: "CASCADE",
    comment: "Reference to associated User ID",
  },
  email: {
    type: DataTypes.STRING(150),
    allowNull: false,
    validate: { isEmail: true },
    set(value) {
      // Always store email as lowercase
      this.setDataValue("email", value.trim().toLowerCase());
    },
    comment: "Email for which OTP is generated",
  },
  otp: {
    type: DataTypes.STRING(10),
    allowNull: false,
    comment: "The OTP code",
  },
  expiresAt: {
    type: DataTypes.DATE,
    allowNull: false,
    field: "expires_at",
    comment: "Expiration timestamp of OTP",
  },
  used: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false,
    comment: "Indicates whether OTP has been used",
  },
  purpose: {
    type: DataTypes.STRING(50),
    allowNull: true,
    comment: 'Purpose of OTP e.g. "signup", "reset-password"',
  },
};

Otp.options = {
  modelName: "Otp",
  tableName: "otps",
  timestamps: true,
  createdAt: "created_at",
  updatedAt: "updated_at",
  underscored: true,
  indexes: [
    { fields: ["user_id"] },
    { fields: ["email"] },
    { fields: ["otp"] },
    { fields: ["expires_at"] },
  ],
};

// Association setup helper (called in index.js after all models are loaded)
Otp.associate = (models) => {
  Otp.belongsTo(models.User, {
    foreignKey: "user_id",
    as: "user",
  });
  models.User.hasMany(Otp, {
    foreignKey: "user_id",
    as: "otps",
  });
};

module.exports = Otp;

const mongoose = require("mongoose");

const ReceiveLogSchema = new mongoose.Schema(
  {
    serial: String,
    type: String,
    brand: String,
    model: String,
    location: String,
    quantity: Number,
    receiver: String, // who received it back
    notes: String,
    receivedAt: { type: Date, default: Date.now }
  },
  { timestamps: true }
);

module.exports = mongoose.model("ReceiveLog", ReceiveLogSchema);

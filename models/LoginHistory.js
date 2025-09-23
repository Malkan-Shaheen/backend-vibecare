const mongoose = require("mongoose");

const LoginHistorySchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  email: { type: String },
  ip: { type: String },
  device: { type: String }, // parsed from userAgent
  userAgent: { type: String },
  date: { type: String }, // formatted date
  time: { type: String }, // formatted time
  success: { type: Boolean, default: true },
}, { timestamps: true });

module.exports = mongoose.model("LoginHistory", LoginHistorySchema);

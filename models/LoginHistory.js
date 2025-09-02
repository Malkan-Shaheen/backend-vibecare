const mongoose = require("mongoose");

const LoginHistorySchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  email: { type: String, required: true },
  loginAt: { type: Date, default: Date.now },
  ip: { type: String },          
  userAgent: { type: String },   
  success: { type: Boolean, default: true }
});

module.exports = mongoose.model("LoginHistory", LoginHistorySchema);

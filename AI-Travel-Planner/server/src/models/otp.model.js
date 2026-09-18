const mongoose = require("mongoose");

const otpSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
    },
    otp: {
      type: String,
      required: true,
    },
    createdAt: {
      type: Date,
      default: Date.now,
      expires: 300, // Document expires automatically after 5 minutes (300 seconds)
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("OTP", otpSchema);

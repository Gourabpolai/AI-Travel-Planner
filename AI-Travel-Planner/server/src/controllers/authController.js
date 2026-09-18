const User = require("../models/User");
const OTP = require("../models/otp.model");
const generateToken = require("../utils/generateToken");
const { sendOTPEmail } = require("../utils/emailService");
const bcrypt = require("bcryptjs");

const sendOTP = async (req, res) => {
  try {
    let { email } = req.body || {};

    if (!email || typeof email !== "string") {
      return res.status(400).json({ message: "Please provide a valid email" });
    }
    
    email = email.toLowerCase().trim();

    // Check if user already exists
    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ message: "User with this email already exists" });
    }

    // Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    
    // Hash OTP
    const salt = await bcrypt.genSalt(10);
    const hashedOTP = await bcrypt.hash(otp, salt);

    // Save to DB (expires in 5 mins due to TTL on schema)
    await OTP.create({
      email,
      otp: hashedOTP,
    });

    // Send Email
    await sendOTPEmail(email, otp);

    res.status(200).json({
      success: true,
      message: "OTP sent successfully",
    });
  } catch (error) {
    console.error("❌ Send OTP Error:", error);
    res.status(500).json({ message: "Failed to send OTP" });
  }
};

const registerUser = async (req, res) => {
  try {
    let { name, email, password, otp } = req.body || {};

    if (
      !name || typeof name !== "string" ||
      !email || typeof email !== "string" ||
      !password || typeof password !== "string" ||
      !otp
    ) {
      return res.status(400).json({
        message: "Please provide valid name, email, password, and OTP",
      });
    }

    email = email.toLowerCase().trim();

    if (password.length < 8) {
      return res.status(400).json({
        message: "Password must be at least 8 characters long",
      });
    }

    // Check if user already exists
    const userExists = await User.findOne({ email });

    if (userExists) {
      return res.status(400).json({
        message: "User with this email already exists",
      });
    }

    // Verify OTP
    // Find the most recent OTP for the email
    const otpRecord = await OTP.find({ email }).sort({ createdAt: -1 }).limit(1);

    if (otpRecord.length === 0) {
      return res.status(400).json({
        message: "OTP expired or not found. Please request a new one.",
      });
    }

    const isValidOTP = await bcrypt.compare(otp, otpRecord[0].otp);

    if (!isValidOTP) {
      return res.status(400).json({
        message: "Invalid OTP",
      });
    }

    // Create a new user
    const user = await User.create({
      name: name.trim(),
      email,
      password,
    });

    res.status(201).json({
      message: "User registered successfully",
      token: generateToken(user._id),
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
      },
    });
  } catch (error) {
    console.error("❌ Register Error:", error);

    // Handle MongoDB duplicate key error (E11000)
    if (error.code === 11000) {
      return res.status(400).json({
        message: "User with this email already exists",
      });
    }

    // Handle Mongoose validation errors
    if (error.name === "ValidationError") {
      const messages = Object.values(error.errors).map((e) => e.message);
      return res.status(400).json({
        message: messages.join(", ") || "Validation failed",
      });
    }

    res.status(500).json({
      message: error.message || "Registration failed due to server error",
    });
  }
};

const loginUser = async (req, res) => {
  try {
    let { email, password } = req.body || {};

    if (!email || typeof email !== "string" || !password || typeof password !== "string") {
      return res.status(400).json({
        message: "Please provide both valid email and password",
      });
    }

    email = email.toLowerCase().trim();

    // Find user by email
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(401).json({
        message: "Invalid email or password",
      });
    }

    // Compare password
    const isMatch = await user.matchPassword(password);

    if (!isMatch) {
      return res.status(401).json({
        message: "Invalid email or password",
      });
    }

    res.status(200).json({
      message: "Login successful",
      token: generateToken(user._id),
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
      },
    });
  } catch (error) {
    console.error("❌ Login Error:", error);

    if (error.name === "ValidationError") {
      return res.status(400).json({
        message: error.message,
      });
    }

    res.status(500).json({
      message: error.message || "Login failed due to server error",
    });
  }
};

const getProfile = async (req, res) => {
  try {
    res.status(200).json({
      user: req.user,
    });
  } catch (error) {
    console.error("❌ Get Profile Error:", error);
    res.status(500).json({
      message: error.message || "Failed to fetch profile",
    });
  }
};

module.exports = {
  sendOTP,
  registerUser,
  loginUser,
  getProfile,
};
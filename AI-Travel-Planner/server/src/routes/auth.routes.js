const express = require("express");
const router = express.Router();

const { sendOTP, registerUser, loginUser, getProfile } = require("../controllers/authController");
const { protect } = require("../middleware/authMiddleware");
const { authLimiter } = require("../middleware/rateLimiter");

router.post("/send-otp", authLimiter, sendOTP);
router.post("/register", authLimiter, registerUser);
router.post("/login", authLimiter, loginUser);
router.get("/profile", protect, getProfile);

module.exports = router;
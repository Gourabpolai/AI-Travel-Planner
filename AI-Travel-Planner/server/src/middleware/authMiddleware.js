const jwt = require("jsonwebtoken");
const User = require("../models/User");

const protect = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      return res.status(401).json({
        message: "No token provided",
      });
    }

   // Remove "Bearer " from the header
const token = authHeader.split(" ")[1];

// Verify the token
const decoded = jwt.verify(token, process.env.JWT_SECRET);

// Find the user
const user = await User.findById(decoded.id).select("-password");

if (!user) {
  return res.status(401).json({
    message: "User not found",
  });
}

// Attach the user to the request
req.user = user;

next();
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};

module.exports = {
  protect,
};
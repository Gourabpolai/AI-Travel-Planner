const User = require("../models/User");

const registerUser = async (req, res) => {
  try {
    const { name, email, password } = req.body;

// Check if user already exists
const userExists = await User.findOne({ email });

if (userExists) {
  return res.status(400).json({
    message: "User already exists",
  });
}

// Create a new user
const user = await User.create({
  name,
  email,
  password,
});

  res.status(201).json({
  message: "User registered successfully",
  user,
    });
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};

module.exports = {
  registerUser,
};
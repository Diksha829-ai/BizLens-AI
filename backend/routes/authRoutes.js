
const express = require("express");

const {
  registerUser,
  loginUser,
  changePassword,
} = require("../controllers/authController");

const protect = require("../middleware/authMiddleware");

const router = express.Router();

// Register
router.post("/register", registerUser);

// Login
router.post("/login", loginUser);

// Protected profile route
router.get("/profile", protect, (req, res) => {
  res.status(200).json({
    message: "You are authorized",
    user: req.user,
  });
});

// Change password — requires a valid JWT
router.put("/change-password", protect, changePassword);

module.exports = router;

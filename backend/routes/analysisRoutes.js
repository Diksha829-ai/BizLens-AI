const express = require("express");

const {
  analyzeLocation,
} = require("../controllers/analysisController");

const authMiddleware = require("../middleware/authMiddleware");

const router = express.Router();

router.post(
  "/",
  authMiddleware,
  analyzeLocation
);

module.exports = router;
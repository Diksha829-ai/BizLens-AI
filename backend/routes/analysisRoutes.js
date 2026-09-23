const express = require("express");

const {
  analyzeLocation,
  getAnalysisStats,
} = require("../controllers/analysisController");

const authMiddleware = require("../middleware/authMiddleware");

const router = express.Router();


// POST /api/analysis
router.post(
  "/",
  authMiddleware,
  analyzeLocation
);


// GET /api/analysis/stats
router.get(
  "/stats",
  authMiddleware,
  getAnalysisStats
);


module.exports = router;
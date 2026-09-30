const express = require("express");

const {
  analyzeLocation,
  getAnalysisStats,
  getSavedAnalyses,
  getSavedAnalysisById,
  deleteSavedAnalysis,
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

// GET /api/analysis
router.get(
  "/",
  authMiddleware,
  getSavedAnalyses
);


// GET /api/analysis/:id
router.get(
  "/:id",
  authMiddleware,
  getSavedAnalysisById
);


// DELETE /api/analysis/:id
router.delete(
  "/:id",
  authMiddleware,
  deleteSavedAnalysis
);
module.exports = router;
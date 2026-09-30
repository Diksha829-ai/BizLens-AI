const mongoose = require("mongoose");

const analysisSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    latitude: {
      type: Number,
      required: true,
    },

    longitude: {
      type: Number,
      required: true,
    },

    radius: {
      type: Number,
      required: true,
    },

    category: {
      type: String,
      required: true,
    },

    // ============================================================
    // EXISTING BUSINESS ANALYSIS SCORES
    // ============================================================

    successScore: {
      type: Number,
      default: 0,
    },

    competitionScore: {
      type: Number,
      default: 0,
    },

    demandScore: {
      type: Number,
      default: 0,
    },

    riskScore: {
      type: Number,
      default: 0,
    },

    accessibilityScore: {
      type: Number,
      default: 0,
    },

    locationAttractiveness: {
      type: Number,
      default: 0,
    },

    confidenceScore: {
      type: Number,
      default: 0,
    },

    successLevel: {
      type: String,
    },

    riskLevel: {
      type: String,
    },

    confidence: {
      type: String,
    },

    recommendations: {
      type: [String],
      default: [],
    },

    // ============================================================
    // ML GEOGRAPHIC OPPORTUNITY PREDICTION
    // ============================================================

    mlPrediction: {
      prediction: {
        type: Number,
        default: null,
      },

      predictionLabel: {
        type: String,
        default: null,
      },

      opportunityProbability: {
        type: Number,
        default: null,
      },

      opportunityProbabilityPercent: {
        type: Number,
        default: null,
      },

      lowerOpportunityProbability: {
        type: Number,
        default: null,
      },

      geographicFeatures: {
        type: mongoose.Schema.Types.Mixed,
        default: null,
      },

      interpretation: {
        type: String,
        default: null,
      },
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model(
  "Analysis",
  analysisSchema
);
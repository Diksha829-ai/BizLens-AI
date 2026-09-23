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
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model(
  "Analysis",
  analysisSchema
);
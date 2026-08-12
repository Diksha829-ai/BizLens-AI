// =====================================================
// BizLens-AI
// Business Success Score Service
// =====================================================

// -----------------------------------------------------
// Calculate Business Success Score
// -----------------------------------------------------
// Current prototype model:
//
// Demand Score       = 60%
// Competition Score  = 40%
//
// IMPORTANT:
// This is currently a heuristic opportunity score.
// It is NOT a statistically validated probability yet.
// Later, this can be replaced with an ML model such as
// XGBoost / Random Forest trained on historical outcomes.
// -----------------------------------------------------

const calculateSuccessScore = ({
  demandScore,
  competitionScore,
}) => {
  // Make sure scores are valid numbers
  const demand = Number(demandScore) || 0;
  const competition =
    Number(competitionScore) || 0;

  // Keep values between 0 and 100
  const normalizedDemand = Math.max(
    0,
    Math.min(100, demand)
  );

  const normalizedCompetition =
    Math.max(
      0,
      Math.min(100, competition)
    );

  // ---------------------------------------------------
  // WEIGHTS
  // ---------------------------------------------------

  const demandWeight = 0.60;
  const competitionWeight = 0.40;

  // ---------------------------------------------------
  // SUCCESS SCORE
  // ---------------------------------------------------

  const rawScore =
    normalizedDemand *
      demandWeight +
    normalizedCompetition *
      competitionWeight;

  const score = Math.round(
    rawScore
  );

  // ---------------------------------------------------
  // SUCCESS LEVEL
  // ---------------------------------------------------

  let level;

  if (score >= 80) {
    level = "Excellent Opportunity";
  } else if (score >= 70) {
    level = "Very Good Opportunity";
  } else if (score >= 60) {
    level = "Good Opportunity";
  } else if (score >= 50) {
    level = "Moderate Opportunity";
  } else if (score >= 40) {
    level = "Risky Opportunity";
  } else {
    level = "Poor Opportunity";
  }

  // ---------------------------------------------------
  // CONFIDENCE
  // ---------------------------------------------------

  /*
   * Current confidence is based on the availability
   * of the two primary analysis dimensions.
   *
   * Later we will calculate confidence using:
   *
   * - data completeness
   * - source reliability
   * - sample size
   * - ML probability calibration
   * - historical validation
   */

  let confidence;

  if (
    normalizedDemand > 0 &&
    normalizedCompetition > 0
  ) {
    confidence = "Medium";
  } else {
    confidence = "Low";
  }

  // ---------------------------------------------------
  // RISK SCORE
  // ---------------------------------------------------

  /*
   * A high success score means lower estimated risk.
   *
   * Risk = inverse of success opportunity.
   */

  const riskScore =
    Math.round(100 - score);

  let riskLevel;

  if (riskScore <= 20) {
    riskLevel = "Very Low";
  } else if (riskScore <= 35) {
    riskLevel = "Low";
  } else if (riskScore <= 50) {
    riskLevel = "Moderate";
  } else if (riskScore <= 70) {
    riskLevel = "High";
  } else {
    riskLevel = "Very High";
  }

  return {
    score,
    level,
    confidence,
    riskScore,
    riskLevel,

    weights: {
      demand: demandWeight,
      competition: competitionWeight,
    },
  };
};

// =====================================================
// Generate Business Recommendation
// =====================================================

const generateSuccessRecommendation = ({
  score,
  demandScore,
  competitionScore,
  category,
}) => {
  const businessCategory =
    String(category || "business")
      .trim()
      .toLowerCase();

  // ---------------------------------------------------
  // Excellent
  // ---------------------------------------------------

  if (score >= 80) {
    return (
      `This location appears highly suitable for a ${businessCategory}. ` +
      `Demand indicators are strong and competition conditions are favorable. ` +
      `The location should be considered for further financial and operational validation before investment.`
    );
  }

  // ---------------------------------------------------
  // Very Good
  // ---------------------------------------------------

  if (score >= 70) {
    return (
      `This location shows strong potential for a ${businessCategory}. ` +
      `Demand is favorable and competition is manageable. ` +
      `The business may have a good opportunity if pricing, differentiation and operating costs are appropriate.`
    );
  }

  // ---------------------------------------------------
  // Good
  // ---------------------------------------------------

  if (score >= 60) {
    return (
      `This location appears to be a good opportunity for a ${businessCategory}. ` +
      `Demand is relatively strong, although competition should be considered. ` +
      `A differentiated business offering could improve the chance of success.`
    );
  }

  // ---------------------------------------------------
  // Moderate
  // ---------------------------------------------------

  if (score >= 50) {
    return (
      `This location shows moderate potential for a ${businessCategory}. ` +
      `The available demand and competition indicators are relatively balanced. ` +
      `Additional research into foot traffic, customer spending and rental costs is recommended.`
    );
  }

  // ---------------------------------------------------
  // Risky
  // ---------------------------------------------------

  if (score >= 40) {
    return (
      `This location presents a relatively risky opportunity for a ${businessCategory}. ` +
      `The current demand and competition indicators do not provide strong evidence of market opportunity. ` +
      `Consider comparing nearby locations before making an investment decision.`
    );
  }

  // ---------------------------------------------------
  // Poor
  // ---------------------------------------------------

  return (
    `This location currently appears unsuitable for a ${businessCategory}. ` +
    `Demand indicators are weak and/or competition conditions are unfavorable. ` +
    `Consider exploring alternative locations with stronger demand characteristics.`
  );
};

// =====================================================
// Generate Strengths
// =====================================================

const generateStrengths = ({
  demandScore,
  competitionScore,
  demandCounts,
}) => {
  const strengths = [];

  // Demand
  if (demandScore >= 70) {
    strengths.push(
      "Strong overall demand indicators"
    );
  } else if (demandScore >= 60) {
    strengths.push(
      "Good overall demand indicators"
    );
  }

  // Competition
  if (competitionScore >= 70) {
    strengths.push(
      "Competition appears relatively favorable"
    );
  } else if (competitionScore >= 60) {
    strengths.push(
      "Competition is manageable"
    );
  }

  // Education
  if (
    demandCounts &&
    demandCounts.education >= 10
  ) {
    strengths.push(
      "Strong presence of educational institutions"
    );
  }

  // Offices
  if (
    demandCounts &&
    demandCounts.offices >= 8
  ) {
    strengths.push(
      "Good office activity in the surrounding area"
    );
  }

  // Shopping
  if (
    demandCounts &&
    demandCounts.shopping >= 15
  ) {
    strengths.push(
      "Strong shopping activity"
    );
  }

  // Tourism
  if (
    demandCounts &&
    demandCounts.tourism >= 5
  ) {
    strengths.push(
      "Tourism-related activity may generate customers"
    );
  }

  // Healthcare
  if (
    demandCounts &&
    demandCounts.hospitals >= 2
  ) {
    strengths.push(
      "Healthcare infrastructure is present"
    );
  }

  // Default
  if (strengths.length === 0) {
    strengths.push(
      "Some positive location indicators are present"
    );
  }

  return strengths;
};

// =====================================================
// Generate Weaknesses
// =====================================================

const generateWeaknesses = ({
  demandScore,
  competitionScore,
  demandCounts,
}) => {
  const weaknesses = [];

  // Demand
  if (demandScore < 50) {
    weaknesses.push(
      "Overall demand indicators are relatively weak"
    );
  }

  // Competition
  if (competitionScore < 50) {
    weaknesses.push(
      "Competition pressure is relatively high"
    );
  }

  // Transport
  if (
    demandCounts &&
    demandCounts.transport <= 1
  ) {
    weaknesses.push(
      "Limited public transport indicators were detected"
    );
  }

  // Residential
  if (
    demandCounts &&
    demandCounts.residential === 0
  ) {
    weaknesses.push(
      "Residential population data is not sufficiently represented in the current OSM dataset"
    );
  }

  // Default
  if (weaknesses.length === 0) {
    weaknesses.push(
      "No major weakness detected from the currently available indicators"
    );
  }

  return weaknesses;
};

// =====================================================
// Generate Opportunities
// =====================================================

const generateOpportunities = ({
  demandCounts,
  competitionScore,
  demandScore,
}) => {
  const opportunities = [];

  if (
    demandScore >= 65
  ) {
    opportunities.push(
      "Strong demand conditions may support customer acquisition"
    );
  }

  if (
    competitionScore >= 60
  ) {
    opportunities.push(
      "Manageable competition may provide room for market entry"
    );
  }

  if (
    demandCounts &&
    demandCounts.education >= 10
  ) {
    opportunities.push(
      "Educational institutions may provide a recurring customer base"
    );
  }

  if (
    demandCounts &&
    demandCounts.offices >= 8
  ) {
    opportunities.push(
      "Office workers may create weekday demand"
    );
  }

  if (
    demandCounts &&
    demandCounts.shopping >= 15
  ) {
    opportunities.push(
      "Shopping activity may increase customer exposure"
    );
  }

  if (
    demandCounts &&
    demandCounts.tourism >= 5
  ) {
    opportunities.push(
      "Tourism activity may create additional customer demand"
    );
  }

  if (opportunities.length === 0) {
    opportunities.push(
      "Further market research may reveal niche opportunities"
    );
  }

  return opportunities;
};

// =====================================================
// Generate Threats
// =====================================================

const generateThreats = ({
  competitionScore,
  demandScore,
}) => {
  const threats = [];

  if (
    competitionScore < 60
  ) {
    threats.push(
      "Existing competition could reduce market share"
    );
  }

  if (
    demandScore < 60
  ) {
    threats.push(
      "Demand may not be sufficient to support the business"
    );
  }

  threats.push(
    "Rental cost, pricing, customer spending and operating expenses are not yet included in the model"
  );

  threats.push(
    "The current model does not yet include real-time foot traffic"
  );

  if (threats.length === 0) {
    threats.push(
      "Market conditions may change over time"
    );
  }

  return threats;
};

// =====================================================
// Generate SWOT
// =====================================================

const generateSWOT = ({
  demandScore,
  competitionScore,
  demandCounts,
}) => {
  return {
    strengths: generateStrengths({
      demandScore,
      competitionScore,
      demandCounts,
    }),

    weaknesses: generateWeaknesses({
      demandScore,
      competitionScore,
      demandCounts,
    }),

    opportunities:
      generateOpportunities({
        demandCounts,
        demandScore,
        competitionScore,
      }),

    threats: generateThreats({
      demandScore,
      competitionScore,
    }),
  };
};

// =====================================================
// EXPORT
// =====================================================

module.exports = {
  calculateSuccessScore,
  generateSuccessRecommendation,
  generateStrengths,
  generateWeaknesses,
  generateOpportunities,
  generateThreats,
  generateSWOT,
};
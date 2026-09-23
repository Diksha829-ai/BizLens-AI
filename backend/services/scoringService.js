// ============================================================
// BizLens-AI
// BUSINESS SUCCESS SCORING SERVICE
// ============================================================
//
// Version:
// RULE-BASED LOCATION INTELLIGENCE v2
//
// Purpose:
// Calculate a Business Success / Opportunity Score (0-100)
// using location, demand, competition, accessibility,
// activity generators and data reliability.
//
// IMPORTANT:
// This is NOT a trained ML probability model.
//
// The returned "successScore" represents:
//     Business Opportunity Score: 0-100
//
// It should NOT be interpreted as:
//     "84% guaranteed chance of success"
//
// Later this service can be extended/replaced with:
// - XGBoost
// - Random Forest
// - Logistic Regression
// - Geospatial ML
// - Time-series forecasting
// - SHAP explainability
//
// ============================================================


// ============================================================
// HELPER: SAFE NUMBER
// ============================================================

function safeNumber(value, fallback = 0) {
  const number = Number(value);

  return Number.isFinite(number)
    ? number
    : fallback;
}


// ============================================================
// HELPER: NON-NEGATIVE NUMBER
// ============================================================

function nonNegative(value, fallback = 0) {
  return Math.max(
    0,
    safeNumber(value, fallback)
  );
}


// ============================================================
// HELPER: CLAMP SCORE
// ============================================================

function clampScore(value) {
  const number = safeNumber(value, 0);

  return Math.max(
    0,
    Math.min(
      100,
      Math.round(number)
    )
  );
}


// ============================================================
// HELPER: NORMALIZE CATEGORY
// ============================================================

function normalizeCategory(category) {
  return String(category || "gym")
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "_");
}


// ============================================================
// CATEGORY DEMAND WEIGHTS
// ============================================================
//
// Higher weight = stronger relationship with category demand.
//
// These are heuristic weights.
// They should eventually be learned from real business data.
//
// ============================================================

const CATEGORY_WEIGHTS = {

  gym: {
    education: 2.0,
    offices: 2.5,
    hospitals: 0.5,
    clinics: 0.5,
    pharmacies: 0.5,
    shopping: 1.0,
    transport: 2.5,
    tourism: 1.0,
    residential: 3.0,
    sports: 3.0,
    food: 0.5,
    entertainment: 1.0,
  },

  cafe: {
    education: 3.0,
    offices: 3.0,
    hospitals: 1.0,
    clinics: 1.0,
    pharmacies: 0.5,
    shopping: 2.5,
    transport: 3.0,
    tourism: 2.0,
    residential: 2.0,
    sports: 1.0,
    food: 1.0,
    entertainment: 2.0,
  },

  restaurant: {
    education: 2.0,
    offices: 3.0,
    hospitals: 1.5,
    clinics: 1.0,
    pharmacies: 0.5,
    shopping: 3.0,
    transport: 3.0,
    tourism: 3.0,
    residential: 2.5,
    sports: 1.0,
    food: 0.5,
    entertainment: 2.5,
  },

  pharmacy: {
    education: 1.0,
    offices: 1.5,
    hospitals: 4.0,
    clinics: 3.5,
    pharmacies: 0.5,
    shopping: 1.5,
    transport: 2.5,
    tourism: 0.5,
    residential: 4.0,
    sports: 0.5,
    food: 0.5,
    entertainment: 0.5,
  },

  salon: {
    education: 1.5,
    offices: 2.0,
    hospitals: 1.0,
    clinics: 0.5,
    pharmacies: 0.5,
    shopping: 3.0,
    transport: 2.0,
    tourism: 1.5,
    residential: 3.0,
    sports: 1.0,
    food: 1.0,
    entertainment: 1.5,
  },

  grocery: {
    education: 1.5,
    offices: 1.0,
    hospitals: 1.0,
    clinics: 0.5,
    pharmacies: 1.0,
    shopping: 2.0,
    transport: 2.0,
    tourism: 0.5,
    residential: 5.0,
    sports: 0.5,
    food: 0.5,
    entertainment: 0.5,
  },

  clothing: {
    education: 2.0,
    offices: 2.0,
    hospitals: 0.5,
    clinics: 0.5,
    pharmacies: 0.5,
    shopping: 5.0,
    transport: 2.5,
    tourism: 2.0,
    residential: 2.0,
    sports: 0.5,
    food: 1.0,
    entertainment: 2.0,
  },

  hotel: {
    education: 0.5,
    offices: 2.0,
    hospitals: 1.0,
    clinics: 0.5,
    pharmacies: 0.5,
    shopping: 2.0,
    transport: 4.0,
    tourism: 5.0,
    residential: 0.5,
    sports: 1.0,
    food: 2.0,
    entertainment: 3.0,
  },

};


// ============================================================
// DEFAULT WEIGHTS
// ============================================================

const DEFAULT_CATEGORY_WEIGHTS = {

  education: 1.5,
  offices: 1.5,
  hospitals: 1.0,
  clinics: 1.0,
  pharmacies: 0.5,
  shopping: 2.0,
  transport: 2.0,
  tourism: 1.5,
  residential: 2.0,
  sports: 1.0,
  food: 1.0,
  entertainment: 1.5,

};


// ============================================================
// GET CATEGORY WEIGHTS
// ============================================================

function getCategoryWeights(category) {

  const normalizedCategory =
    normalizeCategory(category);

  return (
    CATEGORY_WEIGHTS[
      normalizedCategory
    ] ||
    DEFAULT_CATEGORY_WEIGHTS
  );
}


// ============================================================
// DEMAND SCORE
// ============================================================
//
// Diminishing returns are used.
//
// Example:
//
// 1 hospital = useful signal
// 10 hospitals != 10x demand
//
// log1p() prevents very large counts from dominating.
//
// ============================================================

function calculateDemandScore(
  demand = {},
  category = "gym"
) {

  const weights =
    getCategoryWeights(category);

  const categories =
    Object.keys(weights);

  let rawScore = 0;

  let maximumPossibleScore = 0;

  categories.forEach(
    (key) => {

      const count =
        nonNegative(
          demand[key],
          0
        );

      const weight =
        nonNegative(
          weights[key],
          0
        );

      const effectiveCount =
        Math.min(
          Math.log1p(count) * 2,
          10
        );

      rawScore +=
        effectiveCount * weight;

      maximumPossibleScore +=
        10 * weight;
    }
  );

  if (
    maximumPossibleScore <= 0
  ) {
    return 0;
  }

  const score =
    (
      rawScore /
      maximumPossibleScore
    ) * 100;

  return clampScore(score);
}


// ============================================================
// CATEGORY-SPECIFIC DEMAND SCORE
// ============================================================

function calculateCategoryDemandScore(
  demand = {},
  category = "gym"
) {

  const weights =
    getCategoryWeights(category);

  let weightedScore = 0;

  let maximumScore = 0;

  Object.entries(
    weights
  ).forEach(
    ([key, weight]) => {

      const count =
        nonNegative(
          demand[key],
          0
        );

      const effectiveCount =
        Math.min(
          Math.log1p(count) * 2,
          10
        );

      weightedScore +=
        effectiveCount *
        weight;

      maximumScore +=
        10 * weight;
    }
  );

  if (
    maximumScore <= 0
  ) {
    return 0;
  }

  return clampScore(
    (
      weightedScore /
      maximumScore
    ) * 100
  );
}


// ============================================================
// FOOT TRAFFIC SCORE
// ============================================================
//
// Optional input.
//
// Supports:
// - estimated foot traffic
// - pedestrian count
// - traffic index
// - crowd density
//
// If unavailable, return a neutral score.
//
// ============================================================

function calculateFootTrafficScore(
  footTraffic = {}
) {

  const directScore =
  footTraffic.score !== undefined &&
  footTraffic.score !== null &&
  Number.isFinite(Number(footTraffic.score))
    ? Number(footTraffic.score)
    : null;

if (directScore !== null) {
  return clampScore(directScore);
}

  const pedestrianCount =
    nonNegative(
      footTraffic.pedestrianCount,
      0
    );

  const trafficIndex =
    nonNegative(
      footTraffic.trafficIndex,
      0
    );

  const crowdDensity =
    nonNegative(
      footTraffic.crowdDensity,
      0
    );

  if (
    pedestrianCount === 0 &&
    trafficIndex === 0 &&
    crowdDensity === 0
  ) {
    return 50;
  }

  let score = 20;

  score +=
    Math.min(
      Math.log1p(
        pedestrianCount
      ) * 7,
      35
    );

  score +=
    Math.min(
      trafficIndex * 0.3,
      25
    );

  score +=
    Math.min(
      crowdDensity * 0.5,
      20
    );

  return clampScore(score);
}


// ============================================================
// COMPETITION SCORE
// ============================================================
//
// HIGH SCORE = GOOD OPPORTUNITY
//
// 100 = very little competition
// 0   = extremely competitive
//
// ============================================================

function calculateCompetitionScore(
  competition = {}
) {

  const competitors =
    nonNegative(
      competition.count,
      0
    );

  const density =
    nonNegative(
      competition.density,
      0
    );

  const within500m =
    nonNegative(
      competition.within500m,
      0
    );

  const within1km =
    nonNegative(
      competition.within1km,
      0
    );

  const within2km =
    nonNegative(
      competition.within2km,
      0
    );

  let score = 100;


  // ----------------------------------------------------------
  // Total competition
  // ----------------------------------------------------------

  score -=
    Math.min(
      competitors * 5,
      45
    );


  // ----------------------------------------------------------
  // Competition density
  // ----------------------------------------------------------

  score -=
    Math.min(
      density * 12,
      20
    );


  // ----------------------------------------------------------
  // Immediate competition
  // ----------------------------------------------------------

  score -=
    Math.min(
      within500m * 12,
      25
    );


  // ----------------------------------------------------------
  // 500m - 1km
  // ----------------------------------------------------------

  const outside500m =
    Math.max(
      0,
      within1km -
      within500m
    );

  score -=
    Math.min(
      outside500m * 5,
      15
    );


  // ----------------------------------------------------------
  // 1km - 2km
  // ----------------------------------------------------------

  const outside1km =
    Math.max(
      0,
      within2km -
      within1km
    );

  score -=
    Math.min(
      outside1km * 2,
      10
    );


  return clampScore(score);
}


// ============================================================
// COMPETITION RELIABILITY
// ============================================================

function calculateCompetitionReliability({
  competition = {},
  dataCoverageScore = 0,
  businessCount = 0,
}) {

  const competitorCount =
    nonNegative(
      competition.count,
      0
    );

  const businesses =
    nonNegative(
      businessCount,
      0
    );


  // Strong mapped evidence

  if (
    dataCoverageScore >= 80 &&
    businesses >= 20 &&
    competitorCount >= 3
  ) {
    return "High";
  }


  // Strong business mapping but zero competitors
  //
  // Zero competitors does NOT mean zero real businesses.

  if (
    dataCoverageScore >= 80 &&
    businesses >= 20 &&
    competitorCount === 0
  ) {
    return "Medium";
  }


  // Moderate evidence

  if (
    dataCoverageScore >= 50 &&
    businesses >= 10
  ) {
    return "Medium";
  }


  return "Low";
}


// ============================================================
// ACCESSIBILITY SCORE
// ============================================================
//
// Factors:
//
// - public transport
// - roads
// - parking
// - walkability
// - crossings
// - cycleways
//
// ============================================================

function calculateAccessibilityScore(
  data = {}
) {

  const transport =
    nonNegative(
      data.transport,
      0
    );

  const roads =
    nonNegative(
      data.roads,
      0
    );

  const parking =
    nonNegative(
      data.parking,
      0
    );

  const walkable =
    nonNegative(
      data.walkable,
      0
    );

  const crossings =
    nonNegative(
      data.crossings,
      0
    );

  const cycleways =
    nonNegative(
      data.cycleways,
      0
    );


  let score = 20;


  // Public transport

  score +=
    Math.min(
      transport * 7,
      25
    );


  // Roads

  score +=
    Math.min(
      roads * 0.15,
      20
    );


  // Parking

  score +=
    Math.min(
      parking * 4,
      15
    );


  // Walkability

  score +=
    Math.min(
      walkable * 2,
      10
    );


  // Crossings

  score +=
    Math.min(
      crossings,
      5
    );


  // Cycleways

  score +=
    Math.min(
      cycleways,
      5
    );


  return clampScore(score);
}


// ============================================================
// LOCATION ATTRACTIVENESS
// ============================================================

function calculateLocationAttractiveness(
  demand = {},
  locationIndicators = {}
) {

  const education =
    nonNegative(
      demand.education,
      0
    );

  const offices =
    nonNegative(
      demand.offices,
      0
    );

  const shopping =
    nonNegative(
      demand.shopping,
      0
    );

  const tourism =
    nonNegative(
      demand.tourism,
      0
    );

  const residential =
    nonNegative(
      demand.residential,
      0
    );

  const transport =
    nonNegative(
      demand.transport,
      0
    );

  const parks =
    nonNegative(
      locationIndicators.parks,
      0
    );

  const sports =
    nonNegative(
      locationIndicators.sportsFacilities,
      0
    );

  const markets =
    nonNegative(
      locationIndicators.markets,
      0
    );

  const malls =
    nonNegative(
      locationIndicators.malls,
      0
    );

  const hospitals =
    nonNegative(
      locationIndicators.hospitals,
      0
    );


  let score = 10;


  score +=
    Math.min(
      Math.log1p(
        education
      ) * 3,
      10
    );


  score +=
    Math.min(
      Math.log1p(
        offices
      ) * 4,
      15
    );


  score +=
    Math.min(
      Math.log1p(
        shopping
      ) * 3,
      10
    );


  score +=
    Math.min(
      Math.log1p(
        tourism
      ) * 3,
      10
    );


  score +=
    Math.min(
      Math.log1p(
        residential
      ) * 4,
      15
    );


  score +=
    Math.min(
      Math.log1p(
        transport
      ) * 4,
      10
    );


  score +=
    Math.min(
      parks * 2,
      5
    );


  score +=
    Math.min(
      sports * 2,
      5
    );


  score +=
    Math.min(
      markets,
      5
    );


  score +=
    Math.min(
      malls * 2,
      5
    );


  score +=
    Math.min(
      hospitals,
      5
    );


  return clampScore(score);
}


// ============================================================
// POPULATION / DEMOGRAPHIC SCORE
// ============================================================
//
// Optional.
//
// Supported inputs:
//
// population
// populationDensity
// incomeIndex
// targetPopulation
//
// ============================================================

function calculateDemographicScore(
  demographics = {}
) {

  const directScore =
    safeNumber(
      demographics.score,
      -1
    );

  if (
    directScore >= 0
  ) {
    return clampScore(
      directScore
    );
  }


  const population =
    nonNegative(
      demographics.population,
      0
    );

  const populationDensity =
    nonNegative(
      demographics.populationDensity,
      0
    );

  const incomeIndex =
    nonNegative(
      demographics.incomeIndex,
      0
    );


  if (
    population === 0 &&
    populationDensity === 0 &&
    incomeIndex === 0
  ) {
    return 50;
  }


  let score = 20;


  score +=
    Math.min(
      Math.log1p(
        population
      ) * 4,
      30
    );


  score +=
    Math.min(
      populationDensity * 0.5,
      30
    );


  score +=
    Math.min(
      incomeIndex * 0.2,
      20
    );


  return clampScore(
    score
  );
}


// ============================================================
// DATA COVERAGE SCORE
// ============================================================
//
// Prefer businessCount over total OSM objects.
//
// Roads/buildings are NOT equivalent to businesses.
//
// ============================================================

function calculateDataCoverageScore(
  totalPlaces = 0,
  businessCount = null
) {

  const total =
    nonNegative(
      totalPlaces,
      0
    );

  const businesses =
    businessCount === null
      ? null
      : nonNegative(
          businessCount,
          0
        );


  // ----------------------------------------------------------
  // Preferred: actual business count
  // ----------------------------------------------------------

  if (
    businesses !== null
  ) {

    if (
      businesses >= 50
    ) {
      return 100;
    }

    if (
      businesses >= 30
    ) {
      return 90;
    }

    if (
      businesses >= 20
    ) {
      return 80;
    }

    if (
      businesses >= 10
    ) {
      return 65;
    }

    if (
      businesses >= 5
    ) {
      return 45;
    }

    if (
      businesses >= 1
    ) {
      return 25;
    }

    return 15;
  }


  // ----------------------------------------------------------
  // Fallback: total places
  // ----------------------------------------------------------

  if (
    total >= 500
  ) {
    return 80;
  }

  if (
    total >= 250
  ) {
    return 70;
  }

  if (
    total >= 100
  ) {
    return 60;
  }

  if (
    total >= 50
  ) {
    return 50;
  }

  if (
    total >= 25
  ) {
    return 40;
  }

  if (
    total >= 10
  ) {
    return 30;
  }

  return 15;
}


// ============================================================
// DATA CONFIDENCE SCORE
// ============================================================
//
// Confidence != success.
//
// Success:
// "How attractive is the location?"
//
// Confidence:
// "How trustworthy is the available evidence?"
//
// ============================================================

function calculateConfidenceScore({
  totalPlaces = 0,
  businessCount = null,
  competitorCount = 0,
  demandScore = 0,
  dataCoverageScore = 0,
  footTrafficScore = null,
  demographicScore = null,
}) {

  const total =
    nonNegative(
      totalPlaces,
      0
    );

  const businesses =
    businessCount === null
      ? null
      : nonNegative(
          businessCount,
          0
        );

  const competitors =
    nonNegative(
      competitorCount,
      0
    );


  let confidence = 20;


  // ----------------------------------------------------------
  // Total mapped data
  // ----------------------------------------------------------

  if (
    total >= 1000
  ) {
    confidence += 10;
  } else if (
    total >= 500
  ) {
    confidence += 8;
  } else if (
    total >= 250
  ) {
    confidence += 6;
  } else if (
    total >= 100
  ) {
    confidence += 4;
  }


  // ----------------------------------------------------------
  // Business evidence
  // ----------------------------------------------------------

  if (
    businesses !== null
  ) {

    if (
      businesses >= 50
    ) {
      confidence += 20;
    } else if (
      businesses >= 30
    ) {
      confidence += 16;
    } else if (
      businesses >= 20
    ) {
      confidence += 12;
    } else if (
      businesses >= 10
    ) {
      confidence += 8;
    } else if (
      businesses >= 5
    ) {
      confidence += 4;
    }
  }


  // ----------------------------------------------------------
  // Competition evidence
  // ----------------------------------------------------------

  if (
    competitors >= 5
  ) {
    confidence += 10;
  } else if (
    competitors >= 2
  ) {
    confidence += 7;
  } else if (
    competitors === 1
  ) {
    confidence += 4;
  }


  // ----------------------------------------------------------
  // Demand evidence
  // ----------------------------------------------------------

  if (
    demandScore >= 60
  ) {
    confidence += 10;
  } else if (
    demandScore >= 35
  ) {
    confidence += 7;
  } else if (
    demandScore >= 20
  ) {
    confidence += 4;
  }


  // ----------------------------------------------------------
  // Coverage
  // ----------------------------------------------------------

  if (
    dataCoverageScore >= 80
  ) {
    confidence += 10;
  } else if (
    dataCoverageScore >= 60
  ) {
    confidence += 7;
  } else if (
    dataCoverageScore >= 40
  ) {
    confidence += 4;
  }


  // ----------------------------------------------------------
  // Optional foot traffic evidence
  // ----------------------------------------------------------

  if (
    footTrafficScore !== null &&
    footTrafficScore !== undefined
  ) {
    confidence += 5;
  }


  // ----------------------------------------------------------
  // Optional demographic evidence
  // ----------------------------------------------------------

  if (
    demographicScore !== null &&
    demographicScore !== undefined
  ) {
    confidence += 5;
  }


  return clampScore(
    confidence
  );
}


// ============================================================
// CONFIDENCE LEVEL
// ============================================================

function getConfidenceLevel(
  score
) {

  const value =
    clampScore(score);


  if (
    value >= 75
  ) {
    return "High";
  }


  if (
    value >= 50
  ) {
    return "Medium";
  }


  return "Low";
}


// ============================================================
// RISK SCORE
// ============================================================
//
// HIGH risk = bad
//
// Risk considers:
//
// - competition
// - demand
// - accessibility
// - location attractiveness
// - data uncertainty
//
// ============================================================

function calculateRiskScore({

  competitionScore = 50,

  demandScore = 50,

  accessibilityScore = 50,

  locationAttractiveness = 50,

  dataCoverageScore = 50,

  footTrafficScore = 50,

  demographicScore = 50,

}) {

  const opportunityAverage =
    (
      safeNumber(
        competitionScore,
        50
      ) +

      safeNumber(
        demandScore,
        50
      ) +

      safeNumber(
        accessibilityScore,
        50
      ) +

      safeNumber(
        locationAttractiveness,
        50
      ) +

      safeNumber(
        footTrafficScore,
        50
      ) +

      safeNumber(
        demographicScore,
        50
      )
    ) / 6;


  let risk =
    100 -
    opportunityAverage;


  // ----------------------------------------------------------
  // Data uncertainty penalty
  // ----------------------------------------------------------

  if (
    dataCoverageScore < 30
  ) {

    risk += 15;

  } else if (
    dataCoverageScore < 50
  ) {

    risk += 10;

  } else if (
    dataCoverageScore < 70
  ) {

    risk += 5;
  }


  return clampScore(
    risk
  );
}


// ============================================================
// SUCCESS SCORE
// ============================================================
//
// Core weights:
//
// Demand              = 25%
// Competition         = 22%
// Accessibility       = 13%
// Location             = 13%
// Foot Traffic         = 10%
// Demographics         = 7%
// Risk Safety          = 10%
//
// Total                = 100%
//
// ============================================================

function calculateBusinessSuccessScore({

  demandScore = 0,

  competitionScore = 0,

  accessibilityScore = 0,

  locationAttractiveness = 0,

  footTrafficScore = 50,

  demographicScore = 50,

  riskScore = 50,

}) {

  const riskSafetyScore =
    100 -
    clampScore(
      riskScore
    );


  const successScore =

    safeNumber(
      demandScore,
      0
    ) * 0.25 +

    safeNumber(
      competitionScore,
      0
    ) * 0.22 +

    safeNumber(
      accessibilityScore,
      0
    ) * 0.13 +

    safeNumber(
      locationAttractiveness,
      0
    ) * 0.13 +

    safeNumber(
      footTrafficScore,
      50
    ) * 0.10 +

    safeNumber(
      demographicScore,
      50
    ) * 0.07 +

    riskSafetyScore * 0.10;


  return {

    successScore:
      clampScore(
        successScore
      ),

    riskSafetyScore:
      clampScore(
        riskSafetyScore
      ),

  };
}


// ============================================================
// SUCCESS LEVEL
// ============================================================

function getSuccessLevel(
  score
) {

  const value =
    clampScore(score);


  if (
    value >= 80
  ) {
    return "Excellent Opportunity";
  }


  if (
    value >= 65
  ) {
    return "Good Opportunity";
  }


  if (
    value >= 50
  ) {
    return "Moderate Opportunity";
  }


  if (
    value >= 35
  ) {
    return "High Risk Opportunity";
  }


  return "Poor Opportunity";
}


// ============================================================
// RISK LEVEL
// ============================================================

function getRiskLevel(
  score
) {

  const value =
    clampScore(score);


  if (
    value <= 25
  ) {
    return "Very Low";
  }


  if (
    value <= 40
  ) {
    return "Low";
  }


  if (
    value <= 60
  ) {
    return "Medium";
  }


  if (
    value <= 75
  ) {
    return "High";
  }


  return "Very High";
}


// ============================================================
// GENERATE RECOMMENDATIONS
// ============================================================

function generateRecommendations({

  category,

  demandScore,

  categoryDemandScore,

  competitionScore,

  accessibilityScore,

  locationAttractiveness,

  footTrafficScore,

  demographicScore,

  riskScore,

  successScore,

  competition = {},

  demand = {},

  dataCoverage,

  dataCoverageScore,

  competitionReliability,

}) {

  const recommendations = [];

  const normalizedCategory =
    normalizeCategory(category);


  // ==========================================================
  // DATA COVERAGE
  // ==========================================================

  if (
    dataCoverageScore < 40
  ) {

    recommendations.push(
      "Available location data is limited. The Business Success Score should be treated as a preliminary estimate."
    );

  } else if (
    dataCoverageScore < 70
  ) {

    recommendations.push(
      "The available location data provides moderate evidence. Additional demographic, business and customer-demand data would improve confidence."
    );

  } else {

    recommendations.push(
      "The selected area has relatively strong mapped location data for this analysis."
    );
  }


  // ==========================================================
  // COMPETITION RELIABILITY
  // ==========================================================

  if (
    competitionReliability === "Medium" &&
    nonNegative(
      competition.count,
      0
    ) === 0
  ) {

    recommendations.push(
      `No ${normalizedCategory} competitors were detected in the available mapped data, but this does not prove that no real competitors exist. Verify local businesses before investing.`
    );
  }


  if (
    competitionReliability === "Low"
  ) {

    recommendations.push(
      "Competition data reliability is low. Some businesses may be missing from the available map data."
    );
  }


  // ==========================================================
  // DEMAND
  // ==========================================================

  if (
    demandScore >= 70
  ) {

    recommendations.push(
      `Demand indicators are strong for a ${normalizedCategory}.`
    );

  } else if (
    demandScore >= 50
  ) {

    recommendations.push(
      `Demand indicators are moderate-to-good for a ${normalizedCategory}.`
    );

  } else if (
    demandScore >= 30
  ) {

    recommendations.push(
      `Demand indicators are moderate for a ${normalizedCategory}. Compare nearby locations before making a final decision.`
    );

  } else {

    recommendations.push(
      `Demand indicators are relatively weak for a ${normalizedCategory}. Consider locations with stronger customer-generating activity.`
    );
  }


  // ==========================================================
  // CATEGORY-SPECIFIC RECOMMENDATIONS
  // ==========================================================

  if (
    normalizedCategory === "pharmacy"
  ) {

    if (
      nonNegative(
        demand.hospitals,
        0
      ) > 0
    ) {

      recommendations.push(
        `${demand.hospitals} hospital-related location(s) were detected, which can support pharmacy demand.`
      );
    }


    if (
      nonNegative(
        demand.clinics,
        0
      ) > 0
    ) {

      recommendations.push(
        `${demand.clinics} clinic/doctor-related location(s) were detected, which may generate pharmacy demand.`
      );
    }


    if (
      nonNegative(
        demand.residential,
        0
      ) > 0
    ) {

      recommendations.push(
        "Residential activity can support recurring local pharmacy demand."
      );

    } else {

      recommendations.push(
        "Residential activity was not strongly represented in the extracted demand indicators. Verify the surrounding residential population manually."
      );
    }


    if (
      nonNegative(
        demand.transport,
        0
      ) === 0
    ) {

      recommendations.push(
        "No public transport locations were detected. Check nearby bus stops, auto stands and pedestrian access manually."
      );
    }
  }


  if (
    normalizedCategory === "gym"
  ) {

    if (
      nonNegative(
        demand.residential,
        0
      ) > 0
    ) {

      recommendations.push(
        "Residential activity can support recurring gym memberships."
      );
    }


    if (
      nonNegative(
        demand.offices,
        0
      ) > 0
    ) {

      recommendations.push(
        "Nearby office activity may provide an additional customer segment for a gym."
      );
    }


    if (
      nonNegative(
        demand.sports,
        0
      ) > 0
    ) {

      recommendations.push(
        "Existing sports and fitness activity indicates local interest in fitness-related services."
      );
    }
  }


  if (
    normalizedCategory === "cafe"
  ) {

    if (
      nonNegative(
        demand.education,
        0
      ) > 0
    ) {

      recommendations.push(
        "Nearby educational locations may provide student and staff demand for a café."
      );
    }


    if (
      nonNegative(
        demand.offices,
        0
      ) > 0
    ) {

      recommendations.push(
        "Nearby offices can support breakfast, lunch and evening café demand."
      );
    }
  }


  if (
    normalizedCategory === "restaurant"
  ) {

    if (
      nonNegative(
        demand.offices,
        0
      ) > 0
    ) {

      recommendations.push(
        "Nearby offices may create weekday lunch and evening demand."
      );
    }


    if (
      nonNegative(
        demand.shopping,
        0
      ) > 0
    ) {

      recommendations.push(
        "Shopping activity may generate additional restaurant customers."
      );
    }
  }


  if (
    normalizedCategory === "grocery"
  ) {

    if (
      nonNegative(
        demand.residential,
        0
      ) > 0
    ) {

      recommendations.push(
        "Residential activity is particularly important for grocery businesses and was detected around this location."
      );
    }
  }


  if (
    normalizedCategory === "hotel"
  ) {

    if (
      nonNegative(
        demand.tourism,
        0
      ) > 0
    ) {

      recommendations.push(
        "Tourism activity can support hotel demand in the selected area."
      );
    }


    if (
      nonNegative(
        demand.transport,
        0
      ) > 0
    ) {

      recommendations.push(
        "Nearby transport activity improves accessibility for hotel customers."
      );
    }
  }


  // ==========================================================
  // COMPETITION
  // ==========================================================

  if (
    competitionScore >= 80
  ) {

    recommendations.push(
      `Competition appears relatively low based on detected ${normalizedCategory} businesses.`
    );

  } else if (
    competitionScore >= 60
  ) {

    recommendations.push(
      "Competition is moderate. Differentiation in pricing, service quality, convenience and customer experience is recommended."
    );

  } else if (
    competitionScore >= 40
  ) {

    recommendations.push(
      "Competition is relatively high. A clear competitive advantage will be important."
    );

  } else {

    recommendations.push(
      "Competition is very high. Consider a different micro-location or a strongly differentiated business model."
    );
  }


  // ==========================================================
  // CLOSE COMPETITORS
  // ==========================================================

  if (
    nonNegative(
      competition.within500m,
      0
    ) > 0
  ) {

    recommendations.push(
      `${competition.within500m} competitor(s) were detected within approximately 500 meters.`
    );
  }


  if (
    competition.nearestDistance !== null &&
    competition.nearestDistance !== undefined &&
    nonNegative(
      competition.count,
      0
    ) > 0
  ) {

    recommendations.push(
      `The nearest detected competitor is approximately ${competition.nearestDistance} km away.`
    );
  }


  // ==========================================================
  // FOOT TRAFFIC
  // ==========================================================

  if (
    footTrafficScore >= 75
  ) {

    recommendations.push(
      "Foot-traffic indicators are strong and may support customer acquisition."
    );

  } else if (
    footTrafficScore >= 50
  ) {

    recommendations.push(
      "Foot-traffic indicators are moderate. Validate peak-hour pedestrian activity before finalizing the location."
    );

  } else if (
    footTrafficScore < 50
  ) {

    recommendations.push(
      "Foot-traffic indicators are relatively weak. Consider a location with stronger pedestrian or customer movement."
    );
  }


  // ==========================================================
  // DEMOGRAPHICS
  // ==========================================================

  if (
    demographicScore >= 75
  ) {

    recommendations.push(
      "Available demographic indicators are favorable for the selected business."
    );

  } else if (
    demographicScore < 40
  ) {

    recommendations.push(
      "Available demographic indicators are relatively weak or limited. Additional population and income data would improve the analysis."
    );
  }


  // ==========================================================
  // ACCESSIBILITY
  // ==========================================================

  if (
    accessibilityScore >= 75
  ) {

    recommendations.push(
      "The location has strong accessibility indicators."
    );

  } else if (
    accessibilityScore >= 50
  ) {

    recommendations.push(
      "Accessibility is moderate. Verify parking, pedestrian access and public transport before finalizing the location."
    );

  } else {

    recommendations.push(
      "Accessibility may be a significant constraint for customers."
    );
  }


  // ==========================================================
  // LOCATION ATTRACTIVENESS
  // ==========================================================

  if (
    locationAttractiveness >= 70
  ) {

    recommendations.push(
      "Nearby activity generators strengthen the overall attractiveness of the location."
    );

  } else if (
    locationAttractiveness >= 50
  ) {

    recommendations.push(
      "The location has moderate activity-generating potential."
    );

  } else {

    recommendations.push(
      "The selected area has relatively few strong activity generators."
    );
  }


  // ==========================================================
  // RISK
  // ==========================================================

  if (
    riskScore <= 25
  ) {

    recommendations.push(
      "Overall location risk is relatively low based on the available indicators."
    );

  } else if (
    riskScore <= 50
  ) {

    recommendations.push(
      "Overall location risk is moderate. Compare multiple nearby locations before investing."
    );

  } else {

    recommendations.push(
      "Overall location risk is elevated. Additional market and demographic validation is recommended."
    );
  }


  // ==========================================================
  // SCORE INTERPRETATION
  // ==========================================================

  if (
    successScore >= 80
  ) {

    recommendations.push(
      "Overall, the location appears highly promising based on the available data. Validate rent, licensing, operating costs and real customer behavior before investing."
    );

  } else if (
    successScore >= 65
  ) {

    recommendations.push(
      "Overall, the location shows good potential. Compare it with nearby alternatives and validate operating costs before making a final decision."
    );

  } else if (
    successScore >= 50
  ) {

    recommendations.push(
      "The location has moderate potential. Comparing multiple nearby locations may identify a stronger opportunity."
    );

  } else {

    recommendations.push(
      "The current data suggests a higher-risk opportunity. Consider alternative locations and collect additional demographic and customer-demand data."
    );
  }


  // ==========================================================
  // OSM LIMITATION
  // ==========================================================

  recommendations.push(
    "The analysis relies partly on OpenStreetMap and other mapped location data. These sources may not contain every real-world business, residential population, foot-traffic pattern or commercial activity."
  );


  return recommendations;
}


// ============================================================
// MAIN BUSINESS ANALYSIS
// ============================================================

function calculateBusinessAnalysis({

  category = "gym",

  competition = {},

  demand = {},

  totalPlaces = 0,

  businessCount = null,

  accessibility = {},

  locationIndicators = {},

  demographics = {},

  footTraffic = {},

  dataCoverage = null,

}) {

  // ==========================================================
  // DATA COVERAGE
  // ==========================================================

  const dataCoverageScore =
    dataCoverage !== null
      ? clampScore(
          dataCoverage
        )
      : calculateDataCoverageScore(
          totalPlaces,
          businessCount
        );


  // ==========================================================
  // DEMAND
  // ==========================================================

  const demandScore =
    calculateDemandScore(
      demand,
      category
    );


  const categoryDemandScore =
    calculateCategoryDemandScore(
      demand,
      category
    );


  // ==========================================================
  // COMPETITION
  // ==========================================================

  const competitionScore =
    calculateCompetitionScore(
      competition
    );


  // ==========================================================
  // COMPETITION RELIABILITY
  // ==========================================================

  const competitionReliability =
    calculateCompetitionReliability({

      competition,

      dataCoverageScore,

      businessCount:
        businessCount === null
          ? totalPlaces
          : businessCount,

    });


  // ==========================================================
  // ACCESSIBILITY
  // ==========================================================

  const accessibilityScore =
    calculateAccessibilityScore(
      accessibility
    );


  // ==========================================================
  // LOCATION ATTRACTIVENESS
  // ==========================================================

  const locationAttractiveness =
    calculateLocationAttractiveness(
      demand,
      locationIndicators
    );


  // ==========================================================
  // FOOT TRAFFIC
  // ==========================================================

  const footTrafficScore =
    calculateFootTrafficScore(
      footTraffic
    );


  // ==========================================================
  // DEMOGRAPHICS
  // ==========================================================

  const demographicScore =
    calculateDemographicScore(
      demographics
    );


  // ==========================================================
  // RISK
  // ==========================================================

  const riskScore =
    calculateRiskScore({

      competitionScore,

      demandScore,

      accessibilityScore,

      locationAttractiveness,

      footTrafficScore,

      demographicScore,

      dataCoverageScore,

    });


  // ==========================================================
  // SUCCESS SCORE
  // ==========================================================

  const {

    successScore,

    riskSafetyScore,

  } =
    calculateBusinessSuccessScore({

      demandScore,

      competitionScore,

      accessibilityScore,

      locationAttractiveness,

      footTrafficScore,

      demographicScore,

      riskScore,

    });


  // ==========================================================
  // LEVELS
  // ==========================================================

  const successLevel =
    getSuccessLevel(
      successScore
    );


  const riskLevel =
    getRiskLevel(
      riskScore
    );


  // ==========================================================
  // CONFIDENCE
  // ==========================================================

  const confidenceScore =
    calculateConfidenceScore({

      totalPlaces,

      businessCount,

      competitorCount:
        competition.count || 0,

      demandScore,

      dataCoverageScore,

      footTrafficScore:
        footTraffic &&
        Object.keys(footTraffic).length > 0
          ? footTrafficScore
          : null,

      demographicScore:
        demographics &&
        Object.keys(demographics).length > 0
          ? demographicScore
          : null,

    });


  const confidence =
    getConfidenceLevel(
      confidenceScore
    );


  // ==========================================================
  // RECOMMENDATIONS
  // ==========================================================

  const recommendations =
    generateRecommendations({

      category,

      demandScore,

      categoryDemandScore,

      competitionScore,

      accessibilityScore,

      locationAttractiveness,

      footTrafficScore,

      demographicScore,

      riskScore,

      successScore,

      competition,

      demand,

      dataCoverage,

      dataCoverageScore,

      competitionReliability,

    });


  // ==========================================================
  // RETURN
  // ==========================================================

  return {

    // --------------------------------------------------------
    // Demand
    // --------------------------------------------------------

    demandScore,

    categoryDemandScore,


    // --------------------------------------------------------
    // Competition
    // --------------------------------------------------------

    competitionScore,

    competitionReliability,


    // --------------------------------------------------------
    // Accessibility
    // --------------------------------------------------------

    accessibilityScore,


    // --------------------------------------------------------
    // Location
    // --------------------------------------------------------

    locationAttractiveness,


    // --------------------------------------------------------
    // Foot Traffic
    // --------------------------------------------------------

    footTrafficScore,


    // --------------------------------------------------------
    // Demographics
    // --------------------------------------------------------

    demographicScore,


    // --------------------------------------------------------
    // Risk
    // --------------------------------------------------------

    riskScore,

    riskSafetyScore,

    riskLevel,


    // --------------------------------------------------------
    // Success
    // --------------------------------------------------------

    successScore,

    successLevel,


    // --------------------------------------------------------
    // Confidence
    // --------------------------------------------------------

    confidence,

    confidenceScore,


    // --------------------------------------------------------
    // Coverage
    // --------------------------------------------------------

    dataCoverage,

    dataCoverageScore,


    // --------------------------------------------------------
    // AI-ready recommendations
    // --------------------------------------------------------

    recommendations,

  };
}


// ============================================================
// EXPORT
// ============================================================

module.exports = {

  calculateBusinessAnalysis,

  calculateDemandScore,

  calculateCategoryDemandScore,

  calculateFootTrafficScore,

  calculateCompetitionScore,

  calculateCompetitionReliability,

  calculateAccessibilityScore,

  calculateLocationAttractiveness,

  calculateDemographicScore,

  calculateRiskScore,

  calculateBusinessSuccessScore,

  calculateDataCoverageScore,

  calculateConfidenceScore,

  getConfidenceLevel,

  getSuccessLevel,

  getRiskLevel,

  generateRecommendations,

};
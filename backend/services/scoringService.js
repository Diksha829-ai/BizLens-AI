// ============================================================
// BizLens-AI
// BUSINESS SUCCESS SCORING SERVICE
// ============================================================
//
// Current version:
// RULE-BASED LOCATION INTELLIGENCE
//
// This is NOT an ML prediction yet.
//
// The service combines:
// - Category-specific demand
// - Competition
// - Accessibility
// - Location attractiveness
// - OSM data coverage
// - Data reliability
//
// Final score:
// Business Success Score = 0 - 100
//
// Higher score = better opportunity
//
// Later this service can be replaced/extended with:
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
// CATEGORY DEMAND WEIGHTS
// ============================================================
//
// Higher weight = stronger relationship with category demand.
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
// GET CATEGORY WEIGHTS
// ============================================================

function getCategoryWeights(category) {

  const normalizedCategory =
    String(category || "")
      .toLowerCase()
      .trim();

  return (
    CATEGORY_WEIGHTS[
      normalizedCategory
    ] ||
    CATEGORY_WEIGHTS.gym
  );
}


// ============================================================
// DEMAND SCORE
// ============================================================
//
// IMPORTANT:
//
// We use diminishing returns.
//
// Example:
//
// 1 hospital is valuable.
// 10 hospitals should not produce 10x the demand.
//
// Therefore logarithmic-style saturation is used.
//
// ============================================================

function calculateDemandScore(
  demand = {},
  category = "gym"
) {

  const weights =
    getCategoryWeights(category);

  const categories = Object.keys(
    weights
  );

  let rawScore = 0;

  let maximumPossibleScore = 0;

  categories.forEach(
    (key) => {

      const count =
        Math.max(
          0,
          safeNumber(
            demand[key],
            0
          )
        );

      const weight =
        safeNumber(
          weights[key],
          0
        );

      // ------------------------------------------------------
      // Diminishing returns
      // ------------------------------------------------------

      const effectiveCount =
        Math.log1p(count) * 2;

      rawScore +=
        effectiveCount *
        weight;

      maximumPossibleScore +=
        10 *
        weight;
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
    ) *
    100;

  return clampScore(score);
}


// ============================================================
// CATEGORY-SPECIFIC DEMAND SCORE
// ============================================================
//
// This gives a more understandable sub-score for the selected
// business category.
//
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
        Math.max(
          0,
          safeNumber(
            demand[key],
            0
          )
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
        10 *
        weight;
    }
  );

  if (
    maximumScore === 0
  ) {
    return 0;
  }

  return clampScore(
    (
      weightedScore /
      maximumScore
    ) *
    100
  );
}


// ============================================================
// COMPETITION SCORE
// ============================================================
//
// HIGH score = GOOD opportunity
//
// 100 = very little detected competition
// 0   = extremely competitive
//
// Competition is evaluated using:
// - total competitors
// - density
// - competitors within 500m
// - competitors within 1km
// - competitors within 2km
//
// ============================================================

function calculateCompetitionScore(
  competition = {}
) {

  const competitors =
    Math.max(
      0,
      safeNumber(
        competition.count,
        0
      )
    );

  const density =
    Math.max(
      0,
      safeNumber(
        competition.density,
        0
      )
    );

  const within500m =
    Math.max(
      0,
      safeNumber(
        competition.within500m,
        0
      )
    );

  const within1km =
    Math.max(
      0,
      safeNumber(
        competition.within1km,
        0
      )
    );

  const within2km =
    Math.max(
      0,
      safeNumber(
        competition.within2km,
        0
      )
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
  // Density
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
  // 1 km competition
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
  // 2 km competition
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
//
// IMPORTANT:
//
// Zero detected competitors does NOT automatically mean that
// there are zero real competitors.
//
// Reliability depends on:
// - OSM data coverage
// - number of businesses returned
// - number of competitors
//
// ============================================================

function calculateCompetitionReliability({
  competition = {},
  dataCoverageScore = 0,
  businessCount = 0,
}) {

  const competitorCount =
    Math.max(
      0,
      safeNumber(
        competition.count,
        0
      )
    );

  const businesses =
    Math.max(
      0,
      safeNumber(
        businessCount,
        0
      )
    );


  // ----------------------------------------------------------
  // Strong evidence
  // ----------------------------------------------------------

  if (
    dataCoverageScore >= 80 &&
    businesses >= 20 &&
    competitorCount >= 3
  ) {
    return "High";
  }


  // ----------------------------------------------------------
  // Good mapped data but zero competitors
  // ----------------------------------------------------------
  //
  // We do NOT call this High because absence of a competitor
  // can be caused by missing business mapping.
  //

  if (
    dataCoverageScore >= 80 &&
    businesses >= 20 &&
    competitorCount === 0
  ) {
    return "Medium";
  }


  // ----------------------------------------------------------
  // Moderate evidence
  // ----------------------------------------------------------

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
// Accessibility considers:
//
// - public transport
// - roads
// - parking
// - walkability
// - crossings
// - cycleways
//
// Roads are capped because a large number of OSM road segments
// does NOT necessarily mean good customer accessibility.
//
// ============================================================

function calculateAccessibilityScore(
  data = {}
) {

  const transport =
    Math.max(
      0,
      safeNumber(
        data.transport,
        0
      )
    );

  const roads =
    Math.max(
      0,
      safeNumber(
        data.roads,
        0
      )
    );

  const parking =
    Math.max(
      0,
      safeNumber(
        data.parking,
        0
      )
    );

  const walkable =
    Math.max(
      0,
      safeNumber(
        data.walkable,
        0
      )
    );

  const crossings =
    Math.max(
      0,
      safeNumber(
        data.crossings,
        0
      )
    );

  const cycleways =
    Math.max(
      0,
      safeNumber(
        data.cycleways,
        0
      )
    );


  let score = 20;


  // ----------------------------------------------------------
  // Public transport
  // ----------------------------------------------------------

  score +=
    Math.min(
      transport * 7,
      25
    );


  // ----------------------------------------------------------
  // Roads
  // ----------------------------------------------------------

  score +=
    Math.min(
      roads * 0.15,
      20
    );


  // ----------------------------------------------------------
  // Parking
  // ----------------------------------------------------------

  score +=
    Math.min(
      parking * 4,
      15
    );


  // ----------------------------------------------------------
  // Walkability
  // ----------------------------------------------------------

  score +=
    Math.min(
      walkable * 2,
      10
    );


  // ----------------------------------------------------------
  // Crossings
  // ----------------------------------------------------------

  score +=
    Math.min(
      crossings * 1,
      5
    );


  // ----------------------------------------------------------
  // Cycleways
  // ----------------------------------------------------------

  score +=
    Math.min(
      cycleways * 1,
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
    Math.max(
      0,
      safeNumber(
        demand.education,
        0
      )
    );

  const offices =
    Math.max(
      0,
      safeNumber(
        demand.offices,
        0
      )
    );

  const shopping =
    Math.max(
      0,
      safeNumber(
        demand.shopping,
        0
      )
    );

  const tourism =
    Math.max(
      0,
      safeNumber(
        demand.tourism,
        0
      )
    );

  const residential =
    Math.max(
      0,
      safeNumber(
        demand.residential,
        0
      )
    );

  const transport =
    Math.max(
      0,
      safeNumber(
        demand.transport,
        0
      )
    );

  const parks =
    Math.max(
      0,
      safeNumber(
        locationIndicators.parks,
        0
      )
    );

  const sports =
    Math.max(
      0,
      safeNumber(
        locationIndicators.sportsFacilities,
        0
      )
    );

  const markets =
    Math.max(
      0,
      safeNumber(
        locationIndicators.markets,
        0
      )
    );


  let score = 15;


  score +=
    Math.min(
      Math.log1p(education) * 3,
      10
    );

  score +=
    Math.min(
      Math.log1p(offices) * 4,
      15
    );

  score +=
    Math.min(
      Math.log1p(shopping) * 3,
      10
    );

  score +=
    Math.min(
      Math.log1p(tourism) * 3,
      10
    );

  score +=
    Math.min(
      Math.log1p(residential) * 4,
      15
    );

  score +=
    Math.min(
      Math.log1p(transport) * 4,
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
      markets * 1,
      5
    );


  return clampScore(score);
}


// ============================================================
// DATA COVERAGE SCORE
// ============================================================
//
// IMPORTANT:
//
// Do NOT treat every OSM object as a business.
//
// Buildings + roads can create thousands of objects.
//
// Therefore:
//
// If businessCount is available:
// use businessCount.
//
// Otherwise:
// fall back to totalPlaces.
//
// ============================================================

function calculateDataCoverageScore(
  totalPlaces = 0,
  businessCount = null
) {

  const total =
    Math.max(
      0,
      safeNumber(
        totalPlaces,
        0
      )
    );

  const businesses =
    businessCount === null
      ? null
      : Math.max(
          0,
          safeNumber(
            businessCount,
            0
          )
        );


  // ----------------------------------------------------------
  // Preferred method: business count
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
  // Fallback method
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
// This is different from business success.
//
// Success = opportunity
//
// Confidence = how trustworthy the available evidence is
//
// ============================================================

function calculateConfidenceScore({
  totalPlaces = 0,
  businessCount = null,
  competitorCount = 0,
  demandScore = 0,
  dataCoverageScore = 0,
}) {

  const total =
    Math.max(
      0,
      safeNumber(
        totalPlaces,
        0
      )
    );

  const businesses =
    businessCount === null
      ? null
      : Math.max(
          0,
          safeNumber(
            businessCount,
            0
          )
        );

  const competitors =
    Math.max(
      0,
      safeNumber(
        competitorCount,
        0
      )
    );


  let confidence = 25;


  // ----------------------------------------------------------
  // Total OSM data
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

  if (
    score >= 75
  ) {
    return "High";
  }

  if (
    score >= 50
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
// Risk is based on:
//
// - competition
// - demand
// - accessibility
// - attractiveness
// - data uncertainty
//
// ============================================================

function calculateRiskScore({

  competitionScore = 50,

  demandScore = 50,

  accessibilityScore = 50,

  locationAttractiveness = 50,

  dataCoverageScore = 50,

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
      )
    ) / 4;


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
// Weighted model:
//
// Demand              = 30%
// Competition         = 25%
// Accessibility      = 15%
// Location            = 15%
// Risk safety         = 15%
//
// Total               = 100%
//
// ============================================================

function calculateBusinessSuccessScore({

  demandScore = 0,

  competitionScore = 0,

  accessibilityScore = 0,

  locationAttractiveness = 0,

  riskScore = 50,

}) {

  const riskSafetyScore =
    100 -
    clampScore(
      riskScore
    );


  const successScore =

    safeNumber(
      demandScore
    ) * 0.30 +

    safeNumber(
      competitionScore
    ) * 0.25 +

    safeNumber(
      accessibilityScore
    ) * 0.15 +

    safeNumber(
      locationAttractiveness
    ) * 0.15 +

    riskSafetyScore * 0.15;


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

  riskScore,

  successScore,

  competition = {},

  demand = {},

  dataCoverage,

  dataCoverageScore,

  competitionReliability,

}) {

  const recommendations = [];


  // ==========================================================
  // DATA COVERAGE
  // ==========================================================

  if (
    dataCoverageScore < 40
  ) {

    recommendations.push(
      `Available location data is limited. The Business Success Score should be treated as a preliminary estimate.`
    );

  } else if (
    dataCoverageScore < 70
  ) {

    recommendations.push(
      `The available location data provides moderate evidence. Additional demographic and local business data would improve confidence.`
    );

  } else {

    recommendations.push(
      `The selected area has relatively strong mapped location data for this analysis.`
    );

  }


  // ==========================================================
  // COMPETITION RELIABILITY
  // ==========================================================

  if (
    competitionReliability ===
    "Medium" &&
    competition.count === 0
  ) {

    recommendations.push(
      `No ${category} competitors were detected in the available OSM data, but absence of mapped competitors does not prove that no real competitors exist. Verify local businesses before investing.`
    );

  }


  // ==========================================================
  // DEMAND
  // ==========================================================

  if (
    demandScore >= 70
  ) {

    recommendations.push(
      `Demand indicators are strong for a ${category}.`
    );

  } else if (
    demandScore >= 50
  ) {

    recommendations.push(
      `Demand indicators are moderate-to-good for a ${category}.`
    );

  } else if (
    demandScore >= 30
  ) {

    recommendations.push(
      `Demand indicators are moderate for a ${category}. Compare nearby locations before making a final decision.`
    );

  } else {

    recommendations.push(
      `Demand indicators are relatively weak for a ${category}. Consider locations with stronger customer-generating activity.`
    );

  }


  // ==========================================================
  // CATEGORY-SPECIFIC DEMAND
  // ==========================================================

  if (
    category === "pharmacy"
  ) {

    if (
      demand.hospitals > 0
    ) {

      recommendations.push(
        `${demand.hospitals} hospital-related location(s) were detected, which can support pharmacy demand.`
      );

    }

    if (
      demand.clinics > 0
    ) {

      recommendations.push(
        `${demand.clinics} clinic/doctor-related location(s) were detected, which may generate pharmacy demand.`
      );

    }

    if (
      demand.residential > 0
    ) {

      recommendations.push(
        `Residential activity was detected and can support recurring local pharmacy demand.`
      );

    } else {

      recommendations.push(
        `Residential buildings were not strongly represented in the extracted demand indicators. Verify the surrounding residential population manually.`
      );

    }

    if (
      demand.transport === 0
    ) {

      recommendations.push(
        `No public transport locations were detected. Check nearby bus stops, auto stands and pedestrian access manually.`
      );

    }

  }


  if (
    category === "gym"
  ) {

    if (
      demand.residential > 0
    ) {

      recommendations.push(
        `Residential activity can support recurring gym memberships.`
      );

    }

    if (
      demand.offices > 0
    ) {

      recommendations.push(
        `Nearby office activity may provide an additional customer segment for a gym.`
      );

    }

    if (
      demand.sports > 0
    ) {

      recommendations.push(
        `Existing sports and fitness activity indicates local interest in fitness-related services.`
      );

    }

  }


  if (
    category === "cafe"
  ) {

    if (
      demand.education > 0
    ) {

      recommendations.push(
        `Nearby educational locations may provide student and staff demand for a café.`
      );

    }

    if (
      demand.offices > 0
    ) {

      recommendations.push(
        `Nearby offices can support breakfast, lunch and evening café demand.`
      );

    }

  }


  if (
    category === "restaurant"
  ) {

    if (
      demand.offices > 0
    ) {

      recommendations.push(
        `Nearby offices may create weekday lunch and evening demand.`
      );

    }

    if (
      demand.shopping > 0
    ) {

      recommendations.push(
        `Shopping activity may generate additional restaurant customers.`
      );

    }

  }


  if (
    category === "grocery"
  ) {

    if (
      demand.residential > 0
    ) {

      recommendations.push(
        `Residential activity is particularly important for grocery businesses and was detected around this location.`
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
      `Competition appears relatively low based on detected ${category} businesses.`
    );

  } else if (
    competitionScore >= 60
  ) {

    recommendations.push(
      `Competition is moderate. Differentiation in pricing, service quality, convenience and customer experience is recommended.`
    );

  } else if (
    competitionScore >= 40
  ) {

    recommendations.push(
      `Competition is relatively high. A clear competitive advantage will be important.`
    );

  } else {

    recommendations.push(
      `Competition is very high. Consider a different micro-location or a strongly differentiated business model.`
    );

  }


  // ==========================================================
  // CLOSE COMPETITORS
  // ==========================================================

  if (
    competition.within500m > 0
  ) {

    recommendations.push(
      `${competition.within500m} competitor(s) were detected within approximately 500 meters.`
    );

  }


  if (
    competition.nearestDistance !==
      null &&
    competition.nearestDistance !==
      undefined &&
    competition.count > 0
  ) {

    recommendations.push(
      `The nearest detected competitor is approximately ${competition.nearestDistance} km away.`
    );

  }


  // ==========================================================
  // ACCESSIBILITY
  // ==========================================================

  if (
    accessibilityScore >= 75
  ) {

    recommendations.push(
      `The location has strong accessibility indicators.`
    );

  } else if (
    accessibilityScore >= 50
  ) {

    recommendations.push(
      `Accessibility is moderate. Verify parking, pedestrian access and public transport before finalizing the location.`
    );

  } else {

    recommendations.push(
      `Accessibility may be a significant constraint for customers.`
    );

  }


  // ==========================================================
  // LOCATION ATTRACTIVENESS
  // ==========================================================

  if (
    locationAttractiveness >= 70
  ) {

    recommendations.push(
      `Nearby activity generators strengthen the overall attractiveness of the location.`
    );

  } else if (
    locationAttractiveness >= 50
  ) {

    recommendations.push(
      `The location has moderate activity-generating potential.`
    );

  } else {

    recommendations.push(
      `The selected area has relatively few strong activity generators.`
    );

  }


  // ==========================================================
  // SCORE INTERPRETATION
  // ==========================================================

  if (
    successScore >= 80
  ) {

    recommendations.push(
      `Overall, the location appears highly promising based on the available data. Validate rent, licensing, operating costs and real customer behavior before investing.`
    );

  } else if (
    successScore >= 65
  ) {

    recommendations.push(
      `Overall, the location shows good potential. Compare it with nearby alternatives and validate operating costs before making a final decision.`
    );

  } else if (
    successScore >= 50
  ) {

    recommendations.push(
      `The location has moderate potential. Comparing multiple nearby locations may identify a stronger opportunity.`
    );

  } else {

    recommendations.push(
      `The current data suggests a higher-risk opportunity. Consider alternative locations and collect additional demographic and customer-demand data.`
    );

  }


  // ==========================================================
  // OSM LIMITATION
  // ==========================================================

  recommendations.push(
    `The analysis relies partly on OpenStreetMap. OSM may not contain every real-world business, residential population, foot-traffic pattern or commercial activity.`
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
  // RISK
  // ==========================================================

  const riskScore =
    calculateRiskScore({

      competitionScore,

      demandScore,

      accessibilityScore,

      locationAttractiveness,

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

    // Demand
    demandScore,

    categoryDemandScore,

    // Competition
    competitionScore,

    competitionReliability,

    // Accessibility
    accessibilityScore,

    // Location
    locationAttractiveness,

    // Risk
    riskScore,

    riskSafetyScore,

    riskLevel,

    // Success
    successScore,

    successLevel,

    // Confidence
    confidence,

    confidenceScore,

    // Coverage
    dataCoverage,

    dataCoverageScore,

    // AI-ready recommendations
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

  calculateCompetitionScore,

  calculateCompetitionReliability,

  calculateAccessibilityScore,

  calculateLocationAttractiveness,

  calculateRiskScore,

  calculateBusinessSuccessScore,

  calculateDataCoverageScore,

  calculateConfidenceScore,

  getConfidenceLevel,

  getSuccessLevel,

  getRiskLevel,

  generateRecommendations,

};
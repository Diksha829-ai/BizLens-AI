const {
  getNearbyBusinesses,
} = require("../services/overpassService");

const {
  calculateBusinessAnalysis,
} = require("../services/scoringService");

const Analysis = require("../models/Analysis");

const CATEGORY_TAGS = {
  gym: {
    leisure: [
      "fitness_centre",
      "sports_centre",
    ],

    sport: [
      "fitness",
      "gymnastics",
      "weightlifting",
      "bodybuilding",
    ],

    amenity: [
      "gym",
    ],

    shop: [],
  },

  cafe: {
    amenity: [
      "cafe",
    ],

    shop: [
      "coffee",
    ],
  },

  restaurant: {
    amenity: [
      "restaurant",
      "fast_food",
      "food_court",
    ],

    shop: [],
  },

  pharmacy: {
    amenity: [
      "pharmacy",
    ],

    healthcare: [
      "pharmacy",
    ],

    shop: [
      "pharmacy",
      "chemist",
      "medical",
      "medical_supply",
      "drugstore",
    ],
  },

  salon: {
    shop: [
      "hairdresser",
      "beauty",
      "cosmetics",
    ],
  },

  grocery: {
    shop: [
      "supermarket",
      "convenience",
      "grocery",
      "greengrocer",
      "general",
    ],

    amenity: [
      "marketplace",
    ],
  },

  clothing: {
    shop: [
      "clothes",
      "fashion",
      "boutique",
    ],
  },

  medical_store: {
    amenity: [
      "pharmacy",
    ],

    healthcare: [
      "pharmacy",
    ],

    shop: [
      "pharmacy",
      "chemist",
      "medical",
      "medical_supply",
      "drugstore",
    ],
  },
};
const CATEGORY_NAME_KEYWORDS = {
  pharmacy: [
    "pharmacy",
    "chemist",
    "pharma",
    "medico",
    "medical store",
    "medical shop",
    "medical & general",
    "medical and general",
    "drug store",
    "drugstore",
  ],

  medical_store: [
    "pharmacy",
    "chemist",
    "pharma",
    "medico",
    "medical store",
    "medical shop",
    "medical & general",
    "medical and general",
    "drug store",
    "drugstore",
  ],

  gym: [
    "gym",
    "fitness",
    "fitness centre",
    "fitness center",
    "workout",
    "bodybuilding",
  ],

  cafe: [
    "cafe",
    "café",
    "coffee",
  ],

  restaurant: [
    "restaurant",
    "dhaba",
    "biryani",
  ],

  salon: [
    "salon",
    "beauty",
    "parlour",
    "parlor",
    "hair",
  ],

  grocery: [
    "grocery",
    "supermarket",
    "mart",
    "kirana",
    "general store",
    "provision",
  ],

  clothing: [
    "clothing",
    "fashion",
    "garments",
    "boutique",
    "apparel",
  ],
};


// ============================================================
// EXCLUSION KEYWORDS
// ============================================================

const CATEGORY_EXCLUSIONS = {
  pharmacy: [
    "hospital",
    "college",
    "school",
    "clinic",
    "laboratory",
    "lab",
    "doctor",
    "dentist",
    "veterinary",
    "university",
    "medical college",
    "medical centre",
    "medical center",
  ],

  medical_store: [
    "hospital",
    "college",
    "school",
    "clinic",
    "laboratory",
    "lab",
    "doctor",
    "dentist",
    "veterinary",
    "university",
    "medical college",
  ],

  gym: [
    "school gym",
    "college gym",
    "gymnasium hall",
  ],

  cafe: [
    "cafe inside",
  ],
};


function normalizeCategory(category) {
  const value = String(category || "")
    .toLowerCase()
    .trim();

  const aliases = {
    "medical store": "pharmacy",
    "medical shop": "pharmacy",
    medical: "pharmacy",
    chemist: "pharmacy",
    pharmacy: "pharmacy",

    gym: "gym",
    "fitness center": "gym",
    "fitness centre": "gym",

    "coffee shop": "cafe",
    coffee: "cafe",

    restaurant: "restaurant",

    salon: "salon",

    grocery: "grocery",
    kirana: "grocery",

    clothing: "clothing",
    clothes: "clothing",
  };

  return aliases[value] || value;
}


// ============================================================
// NORMALIZE TEXT
// ============================================================

function normalizeText(value) {
  return String(value || "")
    .toLowerCase()
    .trim()
    .replace(/\s+/g, " ");
}


function hasMatchingTag(tags, mapping) {
  if (!mapping) {
    return false;
  }

  return Object.entries(mapping).some(
    ([tagName, values]) => {
      const tagValue = normalizeText(
        tags[tagName]
      );

      if (!tagValue) {
        return false;
      }

      return values
        .map((value) =>
          normalizeText(value)
        )
        .includes(tagValue);
    }
  );
}

function getSearchableText(place) {
  return [
    place.name,
    place.brand,
    place.operator,
    place.description,
  ]
    .map(normalizeText)
    .filter(Boolean)
    .join(" ");
}

function hasNameKeyword(place, category) {
  const keywords =
    CATEGORY_NAME_KEYWORDS[category];

  if (
    !keywords ||
    keywords.length === 0
  ) {
    return false;
  }

  const text =
    getSearchableText(place);

  return keywords.some(
    (keyword) =>
      text.includes(
        normalizeText(keyword)
      )
  );
}

function hasExclusionKeyword(place, category) {
  const exclusions =
    CATEGORY_EXCLUSIONS[category];

  if (
    !exclusions ||
    exclusions.length === 0
  ) {
    return false;
  }

  const text = [
    place.name,
    place.brand,
    place.operator,
    place.description,
  ]
    .map(normalizeText)
    .filter(Boolean)
    .join(" ");

  return exclusions.some(
    (keyword) =>
      text.includes(
        normalizeText(keyword)
      )
  );
}


// ============================================================
// COMPETITOR DETECTION
// ============================================================

function detectCompetitor(place, category) {
  const tags =
    place.tags || {};

  const mapping =
    CATEGORY_TAGS[category];

  if (
    hasExclusionKeyword(
      place,
      category
    )
  ) {
    return {
      isCompetitor: false,
      detectionMethod: "excluded",
      detectionConfidence: "High",
    };
  }

  if (
    mapping &&
    hasMatchingTag(
      tags,
      mapping
    )
  ) {
    return {
      isCompetitor: true,
      detectionMethod: "osm_tag",
      detectionConfidence: "High",
    };
  }


  if (
    normalizeCategory(
      place.category
    ) === category
  ) {
    return {
      isCompetitor: true,
      detectionMethod:
        "normalized_category",
      detectionConfidence: "High",
    };
  }

  if (
    hasNameKeyword(
      place,
      category
    )
  ) {
    return {
      isCompetitor: true,
      detectionMethod: "name_match",
      detectionConfidence: "Medium",
    };
  }

  return {
    isCompetitor: false,
    detectionMethod: "none",
    detectionConfidence: "None",
  };
}
function calculateDistance(
  lat1,
  lon1,
  lat2,
  lon2
) {
  const earthRadius = 6371;

  const dLat =
    ((lat2 - lat1) *
      Math.PI) /
    180;

  const dLon =
    ((lon2 - lon1) *
      Math.PI) /
    180;

  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(
      (lat1 * Math.PI) / 180
    ) *
      Math.cos(
        (lat2 * Math.PI) / 180
      ) *
      Math.sin(dLon / 2) ** 2;

  const c =
    2 *
    Math.atan2(
      Math.sqrt(a),
      Math.sqrt(1 - a)
    );

  return earthRadius * c;
}

function calculateDataCoverage(
  totalPlaces,
  radius
) {
  let score;

  if (totalPlaces >= 500) {
    score = 100;
  } else if (totalPlaces >= 250) {
    score = 85;
  } else if (totalPlaces >= 100) {
    score = 70;
  } else if (totalPlaces >= 50) {
    score = 55;
  } else if (totalPlaces >= 25) {
    score = 40;
  } else if (totalPlaces >= 10) {
    score = 25;
  } else if (totalPlaces >= 5) {
    score = 15;
  } else {
    score = 5;
  }

  if (
    radius >= 5 &&
    totalPlaces < 25
  ) {
    score = Math.min(
      score,
      15
    );
  }

  if (
    radius >= 3 &&
    totalPlaces < 15
  ) {
    score = Math.min(
      score,
      15
    );
  }

  let level = "Very Low";

  if (score >= 75) {
    level = "High";
  } else if (score >= 50) {
    level = "Medium";
  } else if (score >= 25) {
    level = "Low";
  }

  return {
    score,
    level,
  };
}

function calculateDemandRelevance(
  demand,
  category
) {
  let rawScore = 0;

  switch (category) {
   
    case "pharmacy":

      rawScore =
        demand.hospitals * 8 +
        demand.clinics * 5 +
        demand.education * 1 +
        demand.offices * 2 +
        demand.shopping * 2 +
        demand.transport * 3 +
        demand.residential * 5 +
        demand.tourism * 1;

      break;

    case "gym":

      rawScore =
        demand.residential * 5 +
        demand.offices * 4 +
        demand.education * 3 +
        demand.sports * 2 +
        demand.shopping * 1;

      break;
    case "cafe":

      rawScore =
        demand.offices * 5 +
        demand.education * 4 +
        demand.shopping * 3 +
        demand.transport * 3 +
        demand.tourism * 3 +
        demand.residential * 2;

      break;

    case "restaurant":

      rawScore =
        demand.offices * 4 +
        demand.education * 3 +
        demand.shopping * 3 +
        demand.tourism * 4 +
        demand.residential * 3 +
        demand.transport * 3;

      break;

    default:

      rawScore =
        demand.education * 2 +
        demand.offices * 2 +
        demand.hospitals * 3 +
        demand.clinics * 3 +
        demand.shopping * 2 +
        demand.transport * 2 +
        demand.tourism * 2 +
        demand.residential * 3 +
        demand.sports +
        demand.food;
  }

  const normalized = Math.min(
    100,
    Math.round(rawScore / 2)
  );

  return normalized;
}



const analyzeLocation = async (
  req,
  res
) => {
  try {


    const {
      latitude,
      longitude,
      radius,
      category,
    } = req.body;


    if (
      latitude === undefined ||
      longitude === undefined ||
      radius === undefined ||
      !category
    ) {
      return res.status(400).json({
        success: false,
        message:
          "latitude, longitude, radius and category are required.",
      });
    }


    const parsedLatitude =
      Number(latitude);

    const parsedLongitude =
      Number(longitude);

    const parsedRadius =
      Number(radius);


    if (
      !Number.isFinite(
        parsedLatitude
      ) ||
      !Number.isFinite(
        parsedLongitude
      ) ||
      !Number.isFinite(
        parsedRadius
      )
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Latitude, longitude and radius must be valid numbers.",
      });
    }


    if (
      parsedLatitude < -90 ||
      parsedLatitude > 90
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Invalid latitude.",
      });
    }


    if (
      parsedLongitude < -180 ||
      parsedLongitude > 180
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Invalid longitude.",
      });
    }


    if (
      parsedRadius <= 0 ||
      parsedRadius > 10
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Radius must be greater than 0 and less than or equal to 10 km.",
      });
    }


    const normalizedCategory =
      normalizeCategory(category);


    console.log(
      "======================================"
    );

    console.log(
      "BizLens-AI Location Analysis"
    );

    console.log(
      "======================================"
    );

    console.log(
      `Latitude: ${parsedLatitude}`
    );

    console.log(
      `Longitude: ${parsedLongitude}`
    );

    console.log(
      `Radius: ${parsedRadius} km`
    );

    console.log(
      `Requested Category: ${category}`
    );

    console.log(
      `Normalized Category: ${normalizedCategory}`
    );


    // ========================================================
    // FETCH OSM
    // ========================================================

    console.log(
      "\nFetching OpenStreetMap data..."
    );


    const osmResult =
      await getNearbyBusinesses(
        parsedLatitude,
        parsedLongitude,
        parsedRadius
      );


    // ========================================================
    // NORMALIZE OSM RESPONSE
    // ========================================================
    //
    // Supports both:
    //
    // 1. Array response:
    //    [...]
    //
    // 2. Object response:
    //    {
    //      places: [...],
    //      dataQuality: {...}
    //    }
    //
    // ========================================================

    let places = [];
    let osmQuality = {};

    if (
      Array.isArray(osmResult)
    ) {
      places = osmResult;

      osmQuality =
        osmResult.dataQuality ||
        {};
    } else if (
      osmResult &&
      typeof osmResult ===
        "object"
    ) {
      places =
        Array.isArray(
          osmResult.places
        )
          ? osmResult.places
          : Array.isArray(
              osmResult.businesses
            )
          ? osmResult.businesses
          : [];

      osmQuality =
        osmResult.dataQuality ||
        osmResult.statistics ||
        {};
    }


    if (
      !Array.isArray(places)
    ) {
      return res.status(500).json({
        success: false,
        message:
          "Invalid data received from OpenStreetMap.",
      });
    }


    console.log(
      `Total OSM objects: ${places.length}`
    );


    // ========================================================
    // DATA COVERAGE
    // ========================================================

    const coverage =
      calculateDataCoverage(
        places.length,
        parsedRadius
      );


    console.log(
      "\n---------- DATA COVERAGE ----------"
    );

    console.log(
      `OSM objects: ${places.length}`
    );

    console.log(
      `Businesses: ${
        osmQuality.businesses ??
        0
      }`
    );

    console.log(
      `Buildings: ${
        osmQuality.buildings ??
        0
      }`
    );

    console.log(
      `Roads: ${
        osmQuality.roads ??
        0
      }`
    );

    console.log(
      `Railways: ${
        osmQuality.railways ??
        0
      }`
    );

    console.log(
      `Landuse: ${
        osmQuality.landuse ??
        0
      }`
    );

    console.log(
      `Named places: ${
        osmQuality.namedPlaces ??
        0
      }`
    );

    console.log(
      `Data coverage: ${coverage.level}`
    );

    console.log(
      `Coverage score: ${coverage.score}`
    );


    // ========================================================
    // COMPETITOR DETECTION
    // ========================================================

    const detectedCompetitors =
      places
        .map((place) => {

          const detection =
            detectCompetitor(
              place,
              normalizedCategory
            );

          return {
            ...place,
            ...detection,
          };
        })
        .filter(
          (place) =>
            place.isCompetitor
        );


    // ========================================================
    // ADD DISTANCE
    // ========================================================

    const competitorsWithDistance =
      detectedCompetitors
        .map((competitor) => {

          const competitorLatitude =
            Number(
              competitor.latitude ??
              competitor.lat
            );

          const competitorLongitude =
            Number(
              competitor.longitude ??
              competitor.lon ??
              competitor.lng
            );


          if (
            !Number.isFinite(
              competitorLatitude
            ) ||
            !Number.isFinite(
              competitorLongitude
            )
          ) {
            return {
              ...competitor,
              distance: null,
            };
          }


          const distance =
            calculateDistance(
              parsedLatitude,
              parsedLongitude,
              competitorLatitude,
              competitorLongitude
            );


          return {
            ...competitor,

            latitude:
              competitorLatitude,

            longitude:
              competitorLongitude,

            distance:
              Number(
                distance.toFixed(3)
              ),
          };
        })
        .filter(
          (place) =>
            place.distance !== null
        )
        .sort(
          (a, b) =>
            a.distance -
            b.distance
        );


    // ========================================================
    // COMPETITION METRICS
    // ========================================================

    const competitorCount =
      competitorsWithDistance.length;


    const analysisArea =
      Math.PI *
      parsedRadius *
      parsedRadius;


    const competitionDensity =
      analysisArea > 0
        ? Number(
            (
              competitorCount /
              analysisArea
            ).toFixed(2)
          )
        : 0;


    const within500m =
      competitorsWithDistance.filter(
        (place) =>
          place.distance <= 0.5
      ).length;


    const within1km =
      competitorsWithDistance.filter(
        (place) =>
          place.distance <= 1
      ).length;


    const within2km =
      competitorsWithDistance.filter(
        (place) =>
          place.distance <= 2
      ).length;


    const nearestCompetitor =
      competitorsWithDistance.length
        ? competitorsWithDistance[0]
        : null;


    const averageCompetitorDistance =
      competitorsWithDistance.length
        ? Number(
            (
              competitorsWithDistance.reduce(
                (sum, place) =>
                  sum +
                  place.distance,
                0
              ) /
              competitorsWithDistance.length
            ).toFixed(3)
          )
        : null;


    // ========================================================
    // COMPETITION RELIABILITY
    // ========================================================

    let competitionReliability =
      "Low";


    if (
      coverage.score >= 75
    ) {
      competitionReliability =
        "Medium";
    }


    if (
      coverage.score >= 85 &&
      Number(
        osmQuality.businesses ??
        0
      ) >= 10
    ) {
      competitionReliability =
        "High";
    }


    if (
      competitorCount === 0
    ) {

      if (
        coverage.score >= 75 &&
        Number(
          osmQuality.businesses ??
          0
        ) >= 10
      ) {
        competitionReliability =
          "Medium";
      } else {
        competitionReliability =
          "Low";
      }
    }


    const competition = {

      count:
        competitorCount,

      density:
        competitionDensity,

      within500m,

      within1km,

      within2km,

      nearestDistance:
        nearestCompetitor
          ? nearestCompetitor.distance
          : null,

      averageDistance:
        averageCompetitorDistance,

      businesses:
        competitorsWithDistance,

      reliability:
        competitionReliability,
    };


    // ========================================================
    // DEMAND
    // ========================================================

    const demand = {

      education: 0,

      offices: 0,

      hospitals: 0,

      clinics: 0,

      pharmacies: 0,

      shopping: 0,

      transport: 0,

      tourism: 0,

      residential: 0,

      sports: 0,

      food: 0,

      entertainment: 0,
    };


    // ========================================================
    // ACCESSIBILITY
    // ========================================================

    const accessibility = {

      transport: 0,

      roads: 0,

      parking: 0,

      walkable: 0,

      crossings: 0,

      cycleways: 0,
    };


    // ========================================================
    // OBJECT ANALYSIS
    // ========================================================

    places.forEach(
      (place) => {

        const tags =
          place.tags || {};


        const amenity =
          normalizeText(
            tags.amenity
          );


        const shop =
          normalizeText(
            tags.shop
          );


        const office =
          normalizeText(
            tags.office
          );


        const tourism =
          normalizeText(
            tags.tourism
          );


        const building =
          normalizeText(
            tags.building
          );


        const highway =
          normalizeText(
            tags.highway
          );


        const leisure =
          normalizeText(
            tags.leisure
          );


        const sport =
          normalizeText(
            tags.sport
          );


        const healthcare =
          normalizeText(
            tags.healthcare
          );


        const publicTransport =
          normalizeText(
            tags.public_transport
          );


        const railway =
          normalizeText(
            tags.railway
          );


        // ====================================================
        // EDUCATION
        // ====================================================

        if (
          [
            "school",
            "college",
            "university",
            "kindergarten",
            "language_school",
          ].includes(
            amenity
          )
        ) {
          demand.education++;
        }


        // ====================================================
        // OFFICES
        // ====================================================

        if (
          office ||
          [
            "office",
            "commercial",
          ].includes(
            building
          )
        ) {
          demand.offices++;
        }


        // ====================================================
        // HOSPITAL
        // ====================================================

        if (
          amenity ===
            "hospital" ||
          healthcare ===
            "hospital"
        ) {
          demand.hospitals++;
        }


        // ====================================================
        // CLINICS
        // ====================================================

        if (
          [
            "clinic",
            "doctors",
            "dentist",
          ].includes(
            amenity
          ) ||
          [
            "clinic",
            "doctor",
            "dentist",
          ].includes(
            healthcare
          )
        ) {
          demand.clinics++;
        }


        // ====================================================
        // PHARMACIES
        // ====================================================

        if (
          [
            "pharmacy",
            "chemist",
            "medical",
            "medical_supply",
            "drugstore",
          ].includes(
            shop
          ) ||
          amenity ===
            "pharmacy" ||
          healthcare ===
            "pharmacy"
        ) {
          demand.pharmacies++;
        }


        // ====================================================
        // SHOPPING
        // ====================================================

        if (
          shop ||
          [
            "marketplace",
            "market",
          ].includes(
            amenity
          )
        ) {
          demand.shopping++;
        }


        // ====================================================
        // TRANSPORT
        // ====================================================

        if (
          [
            "bus_station",
            "bus_stop",
            "taxi",
            "train_station",
            "subway",
            "tram_stop",
          ].includes(
            amenity
          ) ||
          [
            "platform",
            "station",
          ].includes(
            publicTransport
          ) ||
          [
            "station",
            "halt",
            "tram_stop",
            "subway",
            "subway_entrance",
          ].includes(
            railway
          ) ||
          highway ===
            "bus_stop"
        ) {

          demand.transport++;

          accessibility.transport++;
        }


        // ====================================================
        // TOURISM
        // ====================================================

        if (
          tourism
        ) {
          demand.tourism++;
        }


        // ====================================================
        // RESIDENTIAL
        // ====================================================

        if (
          [
            "apartments",
            "residential",
            "house",
            "dormitory",
            "terrace",
            "detached",
            "semidetached_house",
          ].includes(
            building
          )
        ) {
          demand.residential++;
        }
        if (
          leisure ===
            "sports_centre" ||
          leisure ===
            "fitness_centre" ||
          sport
        ) {
          demand.sports++;
        }

        if (
          [
            "restaurant",
            "cafe",
            "fast_food",
            "food_court",
          ].includes(
            amenity
          )
        ) {
          demand.food++;
        }

        if (
          [
            "cinema",
            "theatre",
            "arts_centre",
            "nightclub",
          ].includes(
            amenity
          ) ||
          [
            "amusement_arcade",
            "water_park",
            "park",
          ].includes(
            leisure
          )
        ) {
          demand.entertainment++;
        }


        if (
          amenity ===
          "parking"
        ) {
          accessibility.parking++;
        }
        if (
          highway
        ) {
          accessibility.roads++;
        }
        if (
          [
            "footway",
            "pedestrian",
            "path",
            "living_street",
            "steps",
          ].includes(
            highway
          )
        ) {
          accessibility.walkable++;
        }

        if (
          highway ===
            "crossing" ||
          tags.crossing
        ) {
          accessibility.crossings++;
        }

        if (
          highway ===
          "cycleway"
        ) {
          accessibility.cycleways++;
        }

      }
    );

    const categoryDemandScore =
      calculateDemandRelevance(
        demand,
        normalizedCategory
      );

    const scoring =
      await calculateBusinessAnalysis({

        category:
          normalizedCategory,

        competition,

        demand,

        categoryDemandScore,

        totalPlaces:
          places.length,

        accessibility,

        dataCoverage:
          coverage.score,
      });

    const savedAnalysis =
      await Analysis.create({

        user:
          req.user.userId,

        latitude:
          parsedLatitude,

        longitude:
          parsedLongitude,

        radius:
          parsedRadius,

        category:
          normalizedCategory,

        successScore:
          scoring.successScore,

        competitionScore:
          scoring.competitionScore,

        demandScore:
          scoring.demandScore,

        riskScore:
          scoring.riskScore,

        accessibilityScore:
          scoring.accessibilityScore,

        locationAttractiveness:
          scoring.locationAttractiveness,

        confidenceScore:
          scoring.confidenceScore,

        successLevel:
          scoring.successLevel,

        riskLevel:
          scoring.riskLevel,

        confidence:
          scoring.confidence,

        recommendations:
          scoring.recommendations,
      });

    console.log(
      "\n---------- COMPETITION ----------"
    );

    console.log(
      `Competitors: ${competitorCount}`
    );

    console.log(
      `Competition density: ${competitionDensity}`
    );

    console.log(
      `Within 500m: ${within500m}`
    );

    console.log(
      `Within 1km: ${within1km}`
    );

    console.log(
      `Within 2km: ${within2km}`
    );

    console.log(
      `Nearest competitor: ${
        nearestCompetitor
          ? `${nearestCompetitor.name || "Unnamed"} (${nearestCompetitor.distance} km)`
          : "None found"
      }`
    );

    console.log(
      `Average competitor distance: ${
        averageCompetitorDistance ??
        "N/A"
      }`
    );

    console.log(
      `Competition reliability: ${competitionReliability}`
    );

    console.log(
      `Competition score: ${scoring.competitionScore}`
    );

    console.log(
      "\n---------- DEMAND ----------"
    );

    Object.entries(
      demand
    ).forEach(
      ([key, value]) => {

        console.log(
          `${key}: ${value}`
        );

      }
    );


    console.log(
      `Category demand score: ${categoryDemandScore}`
    );

    console.log(
      `Demand score: ${scoring.demandScore}`
    );


    console.log(
      "\n---------- ACCESSIBILITY ----------"
    );

    Object.entries(
      accessibility
    ).forEach(
      ([key, value]) => {

        console.log(
          `${key}: ${value}`
        );

      }
    );


    console.log(
      `Accessibility score: ${scoring.accessibilityScore}`
    );

    console.log(
      "\n---------- BUSINESS SUCCESS ----------"
    );

    console.log(
      `Demand: ${scoring.demandScore} × 30%`
    );

    console.log(
      `Competition: ${scoring.competitionScore} × 25%`
    );

    console.log(
      `Accessibility: ${scoring.accessibilityScore} × 15%`
    );

    console.log(
      `Location attractiveness: ${scoring.locationAttractiveness} × 15%`
    );

    console.log(
      `Risk safety: ${scoring.riskScore} × 15%`
    );

    console.log(
      `Business Success Score: ${scoring.successScore}`
    );

    console.log(
      `Success Level: ${scoring.successLevel}`
    );

    console.log(
      `Confidence: ${scoring.confidence}`
    );

    console.log(
      `Confidence Score: ${scoring.confidenceScore}`
    );

    console.log(
      `Risk Score: ${scoring.riskScore}`
    );

    console.log(
      `Risk Level: ${scoring.riskLevel}`
    );

    console.log(
      `Analysis ID: ${savedAnalysis._id}`
    );

    console.log(
      "======================================"
    );

    return res
      .status(200)
      .json({

        success: true,

        message:
          "Location analysis completed successfully.",

        data: {

          analysisId:
            savedAnalysis._id,
          location: {

            latitude:
              parsedLatitude,

            longitude:
              parsedLongitude,
          },

          radius:
            parsedRadius,

          requestedCategory:
            category,

          normalizedCategory:
            normalizedCategory,

          totalPlaces:
            places.length,

          osmStatistics: {

            totalObjects:
              places.length,

            businesses:
              osmQuality.businesses ??
              0,

            buildings:
              osmQuality.buildings ??
              0,

            roads:
              osmQuality.roads ??
              0,

            railways:
              osmQuality.railways ??
              0,

            landuse:
              osmQuality.landuse ??
              0,

            namedPlaces:
              osmQuality.namedPlaces ??
              0,
          },
          dataCoverage: {

            score:
              coverage.score,

            level:
              coverage.level,

            description:
              "Estimated completeness of returned OpenStreetMap records. It does not represent complete real-world business coverage.",
          },
          competitors: {

            count:
              competitorCount,

            density:
              competitionDensity,

            within500m,

            within1km,

            within2km,

            nearest:
              nearestCompetitor,

            nearestDistance:
              nearestCompetitor
                ? nearestCompetitor.distance
                : null,

            averageDistance:
              averageCompetitorDistance,

            reliability:
              competitionReliability,

            score:
              scoring.competitionScore,
          },


          competitorBusinesses:
            competitorsWithDistance,
          demand: {

            ...demand,

            categoryDemandScore,

            score:
              scoring.demandScore,
          },

          accessibility: {

            ...accessibility,

            score:
              scoring.accessibilityScore,
          },


          locationAttractiveness:
            scoring.locationAttractiveness,

          businessSuccess: {

            score:
              scoring.successScore,

            level:
              scoring.successLevel,

            confidence:
              scoring.confidence,

            confidenceScore:
              scoring.confidenceScore,

            confidenceReason:
              scoring.confidenceReason,
          },
          risk: {

            score:
              scoring.riskScore,

            level:
              scoring.riskLevel,
          },

          recommendations:
            scoring.recommendations,
        },
      });

  } catch (error) {

    console.error(
      "Analysis controller error:",
      error
    );

    return res
      .status(500)
      .json({

        success: false,

        message:
          error.message ||
          "Location analysis failed.",
      });
  }
};
const getAnalysisStats = async (
  req,
  res
) => {

  try {
    const userId =
      req.user.userId;
    const stats =
      await Analysis.aggregate([

        {
          $match: {
            user: userId,
          },
        },

        {
          $group: {

            _id: null,

            totalAnalyses: {
              $sum: 1,
            },

            averageSuccessScore: {
              $avg:
                "$successScore",
            },

            averageCompetitionScore: {
              $avg:
                "$competitionScore",
            },

            averageDemandScore: {
              $avg:
                "$demandScore",
            },

            averageRiskScore: {
              $avg:
                "$riskScore",
            },
          },
        },

      ]);
    const result =
      stats.length
        ? stats[0]
        : {
            totalAnalyses: 0,
            averageSuccessScore: 0,
            averageCompetitionScore: 0,
            averageDemandScore: 0,
            averageRiskScore: 0,
          };
    return res
      .status(200)
      .json({

        success: true,

        data: {

          totalAnalyses:
            result.totalAnalyses,

          averageSuccessScore:
            Number(
              (
                result.averageSuccessScore ||
                0
              ).toFixed(2)
            ),

          averageCompetitionScore:
            Number(
              (
                result.averageCompetitionScore ||
                0
              ).toFixed(2)
            ),

          averageDemandScore:
            Number(
              (
                result.averageDemandScore ||
                0
              ).toFixed(2)
            ),

          averageRiskScore:
            Number(
              (
                result.averageRiskScore ||
                0
              ).toFixed(2)
            ),
        },
      });

  } catch (error) {

    console.error(
      "Analysis stats error:",
      error
    );

    return res
      .status(500)
      .json({

        success: false,

        message:
          "Failed to fetch analysis statistics.",
      });
  }
};
module.exports = {
  analyzeLocation,
  getAnalysisStats,
};
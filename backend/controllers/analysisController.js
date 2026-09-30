const mongoose = require("mongoose");
const axios = require("axios");
const {
  getNearbyBusinesses,
} = require("../services/overpassService");

const {
  calculateBusinessAnalysis,
} = require("../services/scoringService");

const Analysis = require("../models/Analysis");

// ============================================================
// BUSINESS CATEGORY → OPENSTREETMAP TAGS
// ============================================================

// ============================================================
// ML SERVICE
// ============================================================

const ML_SERVICE_URL = process.env.ML_SERVICE_URL || "http://localhost:8000";

const getMLPrediction = async ({
  latitude,
  longitude,
  category,
}) => {
  try {
    const response = await axios.post(
      `${ML_SERVICE_URL}/predict`,
      {
        latitude,
        longitude,
        category,
      },
      {
        timeout: 30000,
      }
    );

    if (!response.data || !response.data.success) {
      console.error(
        "ML service returned an unsuccessful response:",
        response.data
      );

      return null;
    }

    return response.data;
  } catch (error) {
    console.error(
      "ML service error:",
      error.response?.data || error.message
    );

    return null;
  }
};

const CATEGORY_TAGS = {
  cafe: {
    amenity: ["cafe"],
    shop: ["coffee"],
  },

  restaurant: {
    amenity: ["restaurant"],
    shop: [],
  },

  bakery: {
    shop: ["bakery"],
    craft: ["bakery"],
  },

  fast_food: {
    amenity: ["fast_food"],
    shop: [],
  },

  juice_shop: {
    amenity: ["juice_bar", "cafe"],
    shop: ["juice", "beverages"],
  },

  grocery: {
    shop: ["convenience", "grocery", "greengrocer"],
    amenity: ["marketplace"],
  },

  supermarket: {
    shop: ["supermarket"],
    amenity: [],
  },

  vegetable_fruit: {
    shop: ["greengrocer", "farm"],
    amenity: ["marketplace"],
  },

  dairy: {
    shop: ["dairy", "cheese", "milk"],
    amenity: [],
  },

  meat: {
    shop: ["butcher", "seafood"],
    amenity: [],
  },

  pharmacy: {
    amenity: ["pharmacy"],
    healthcare: ["pharmacy"],
    shop: ["pharmacy", "chemist", "medical", "drugstore"],
  },

  clinic: {
    amenity: ["clinic"],
    healthcare: ["clinic"],
    shop: [],
  },

  dentist: {
    amenity: ["dentist"],
    healthcare: ["dentist"],
    shop: [],
  },

  diagnostic: {
    healthcare: ["laboratory"],
    amenity: ["clinic"],
    shop: [],
  },

  optical: {
    shop: ["optician", "medical"],
    healthcare: ["optometrist"],
    amenity: [],
  },

  salon: {
    shop: ["hairdresser", "beauty"],
    amenity: [],
  },

  beauty_parlour: {
    shop: ["beauty", "cosmetics"],
    amenity: [],
  },

  spa: {
    leisure: ["spa"],
    shop: ["massage"],
    amenity: [],
  },

  gym: {
    leisure: ["fitness_centre", "sports_centre"],
    sport: [
      "fitness",
      "gymnastics",
      "weightlifting",
      "bodybuilding",
    ],
    amenity: ["gym"],
    shop: [],
  },

  yoga: {
    leisure: ["fitness_centre", "sports_centre"],
    sport: ["yoga"],
    amenity: [],
    shop: [],
  },

  sports_center: {
    leisure: ["sports_centre", "stadium", "pitch"],
    sport: ["multi"],
    amenity: [],
    shop: [],
  },

  clothing: {
    shop: ["clothes", "fashion", "boutique"],
    amenity: [],
  },

  footwear: {
    shop: ["shoes"],
    amenity: [],
  },

  mobile_store: {
    shop: ["mobile_phone", "electronics"],
    amenity: [],
  },

  electronics: {
    shop: ["electronics", "appliance"],
    amenity: [],
  },

  furniture: {
    shop: ["furniture", "interior_decoration"],
    amenity: [],
  },

  hardware: {
    shop: ["hardware", "doityourself", "tools"],
    amenity: [],
  },

  electrical: {
    shop: ["electronics", "electrical"],
    craft: ["electrician"],
    amenity: [],
  },

  plumbing: {
    shop: ["plumbing", "trade"],
    craft: ["plumber"],
    amenity: [],
  },

  laundry: {
    shop: ["laundry", "dry_cleaning"],
    amenity: ["laundry"],
  },

  tuition: {
    amenity: ["school"],
    office: ["educational_institution"],
    shop: [],
  },

  computer_institute: {
    amenity: ["school", "college"],
    office: ["educational_institution"],
    shop: [],
  },

  stationery: {
    shop: ["stationery", "books"],
    amenity: [],
  },

  petrol_pump: {
    amenity: ["fuel"],
    shop: [],
  },

  car_service: {
    shop: ["car_repair"],
    craft: ["car_repair"],
    amenity: ["vehicle_inspection"],
  },

  bike_service: {
    shop: ["motorcycle"],
    craft: ["mechanic"],
    amenity: [],
  },

  car_wash: {
    amenity: ["car_wash"],
    shop: [],
  },

  pet_shop: {
    shop: ["pet"],
    amenity: [],
  },

  mobile_repair: {
    shop: ["mobile_phone"],
    craft: ["electronics_repair"],
    amenity: [],
  },

  courier: {
    amenity: ["post_office", "parcel_locker"],
    office: ["courier"],
    shop: [],
  },

  printing: {
    shop: ["copyshop", "printer"],
    craft: ["printing"],
    amenity: [],
  },

  general_store: {
    shop: [
      "general",
      "convenience",
      "variety_store",
    ],
    amenity: [],
  },
};

// ============================================================
// CATEGORY NAME KEYWORDS
// ============================================================

const CATEGORY_NAME_KEYWORDS = {
  cafe: [
    "cafe",
    "café",
    "coffee",
    "coffee shop",
    "espresso",
  ],

  restaurant: [
    "restaurant",
    "dining",
    "dhaba",
    "biryani",
    "hotel",
    "eatery",
  ],

  bakery: [
    "bakery",
    "baker",
    "cakes",
    "cake shop",
    "bread",
    "pastry",
  ],

  fast_food: [
    "fast food",
    "burger",
    "pizza",
    "takeaway",
    "food corner",
  ],

  juice_shop: [
    "juice",
    "juices",
    "shake",
    "shakes",
    "smoothie",
    "beverages",
  ],

  grocery: [
    "grocery",
    "kirana",
    "provision",
    "grocery store",
  ],

  supermarket: [
    "supermarket",
    "super market",
    "hypermarket",
  ],

  vegetable_fruit: [
    "fruit",
    "fruits",
    "vegetable",
    "vegetables",
    "greengrocer",
  ],

  dairy: [
    "dairy",
    "milk",
    "dudh",
    "doodh",
    "milk products",
  ],

  meat: [
    "meat",
    "chicken",
    "mutton",
    "butcher",
    "poultry",
  ],

  pharmacy: [
    "pharmacy",
    "chemist",
    "pharma",
    "medico",
    "medical store",
    "medical shop",
    "drug store",
    "drugstore",
  ],

  clinic: [
    "clinic",
    "polyclinic",
    "health clinic",
    "medical clinic",
  ],

  dentist: [
    "dentist",
    "dental",
    "dental clinic",
    "tooth",
  ],

  diagnostic: [
    "diagnostic",
    "diagnostics",
    "pathology",
    "laboratory",
    "lab",
    "scan centre",
    "scan center",
  ],

  optical: [
    "optical",
    "optician",
    "eyewear",
    "spectacles",
    "vision",
  ],

  salon: [
    "salon",
    "hairdresser",
    "hair cutting",
    "barber",
    "beauty salon",
  ],

  beauty_parlour: [
    "beauty parlour",
    "beauty parlor",
    "makeup",
    "cosmetics",
  ],

  spa: [
    "spa",
    "massage",
    "wellness",
  ],

  gym: [
    "gym",
    "fitness",
    "fitness centre",
    "fitness center",
    "workout",
    "bodybuilding",
  ],

  yoga: [
    "yoga",
    "yoga centre",
    "yoga center",
    "yoga classes",
  ],

  sports_center: [
    "sports centre",
    "sports center",
    "sports club",
    "stadium",
    "sports complex",
  ],

  clothing: [
    "clothing",
    "fashion",
    "garments",
    "boutique",
    "apparel",
    "dress",
  ],

  footwear: [
    "footwear",
    "shoes",
    "shoe shop",
    "sandal",
    "footwear store",
  ],

  mobile_store: [
    "mobile",
    "mobiles",
    "mobile shop",
    "smartphone",
    "accessories",
  ],

  electronics: [
    "electronics",
    "electronic",
    "appliances",
    "electrical appliances",
  ],

  furniture: [
    "furniture",
    "sofa",
    "interiors",
    "furnishing",
  ],

  hardware: [
    "hardware",
    "tools",
    "building materials",
    "construction supplies",
  ],

  electrical: [
    "electrical",
    "electric",
    "electrical goods",
    "electric goods",
  ],

  plumbing: [
    "plumbing",
    "plumber",
    "sanitary",
    "pipe fittings",
  ],

  laundry: [
    "laundry",
    "dry cleaning",
    "washing",
    "wash and iron",
  ],

  tuition: [
    "tuition",
    "tutorial",
    "coaching",
    "classes",
    "academy",
  ],

  computer_institute: [
    "computer institute",
    "computer classes",
    "computer training",
    "IT institute",
  ],

  stationery: [
    "stationery",
    "stationary",
    "book shop",
    "school supplies",
  ],

  petrol_pump: [
    "petrol pump",
    "fuel station",
    "petrol",
    "gas station",
    "bharat petroleum",
    "indian oil",
  ],

  car_service: [
    "car service",
    "car repair",
    "automobile service",
    "car mechanic",
    "auto garage",
  ],

  bike_service: [
    "bike service",
    "motorcycle repair",
    "two wheeler",
    "two-wheeler",
    "bike repair",
  ],

  car_wash: [
    "car wash",
    "vehicle wash",
    "car cleaning",
    "auto spa",
  ],

  pet_shop: [
    "pet shop",
    "pet store",
    "pet supplies",
    "pet animals",
  ],

  mobile_repair: [
    "mobile repair",
    "mobile servicing",
    "phone repair",
    "mobile service",
  ],

  courier: [
    "courier",
    "parcel",
    "delivery service",
    "logistics",
  ],

  printing: [
    "printing",
    "xerox",
    "photocopy",
    "copy centre",
    "copy center",
    "print shop",
  ],

  general_store: [
    "general store",
    "kirana",
    "provision store",
    "departmental store",
    "variety store",
  ],
};

// ============================================================
// CATEGORY EXCLUSIONS
// ============================================================

const CATEGORY_EXCLUSIONS = {
  cafe: [
    "cafe inside",
    "coffee vending machine",
  ],

  restaurant: [
    "restaurant inside",
    "food court stall",
  ],

  bakery: [
    "bakery inside",
    "bakery counter",
  ],

  fast_food: [
    "fast food inside",
  ],

  juice_shop: [
    "juice inside",
  ],

  grocery: [
    "grocery delivery office",
  ],

  supermarket: [
    "supermarket warehouse",
  ],

  vegetable_fruit: [
    "fruit processing factory",
  ],

  dairy: [
    "dairy farm",
    "milk factory",
  ],

  meat: [
    "meat processing factory",
    "slaughterhouse",
  ],

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

  clinic: [
    "pharmacy",
    "chemist",
    "medical store",
    "hospital",
    "medical shop",
  ],

  dentist: [
    "dental college",
    "dental laboratory",
  ],

  diagnostic: [
    "school laboratory",
    "college laboratory",
    "research laboratory",
  ],

  optical: [
    "optical fiber",
    "optical equipment factory",
  ],

  salon: [
    "salon inside",
    "beauty supply warehouse",
  ],

  beauty_parlour: [
    "beauty products warehouse",
  ],

  spa: [
    "spa inside",
  ],

  gym: [
    "school gym",
    "college gym",
    "gymnasium hall",
  ],

  yoga: [
    "yoga products shop",
  ],

  sports_center: [
    "sports goods shop",
  ],

  clothing: [
    "clothing warehouse",
    "clothing factory",
  ],

  footwear: [
    "footwear warehouse",
    "shoe factory",
  ],

  mobile_store: [
    "mobile tower",
    "mobile network office",
  ],

  electronics: [
    "electronics factory",
    "electronics warehouse",
  ],

  furniture: [
    "furniture factory",
    "furniture warehouse",
  ],

  hardware: [
    "hardware manufacturing plant",
  ],

  electrical: [
    "electric substation",
    "power station",
  ],

  plumbing: [
    "plumbing contractor office",
  ],

  laundry: [
    "laundry detergent shop",
  ],

  tuition: [
    "school",
    "college",
    "university",
  ],

  computer_institute: [
    "computer repair",
    "computer shop",
    "internet cafe",
  ],

  stationery: [
    "stationery warehouse",
  ],

  petrol_pump: [
    "petrol pump office",
  ],

  car_service: [
    "car showroom",
    "car dealer",
    "car rental",
  ],

  bike_service: [
    "motorcycle showroom",
    "motorcycle dealer",
  ],

  car_wash: [
    "car wash equipment shop",
  ],

  pet_shop: [
    "veterinary clinic",
    "animal hospital",
  ],

  mobile_repair: [
    "mobile phone showroom",
    "mobile store",
  ],

  courier: [
    "post office",
    "parcel locker",
  ],

  printing: [
    "printing press factory",
  ],

  general_store: [
    "general store warehouse",
  ],
};

// ============================================================
// NORMALIZE CATEGORY
// ============================================================

function normalizeCategory(category) {
  const value = String(category || "")
    .toLowerCase()
    .trim();

  const aliases = {
    "medical store": "pharmacy",
    "medical shop": "pharmacy",
    medical: "pharmacy",
    chemist: "pharmacy",

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

// ============================================================
// OSM TAG MATCHING
// ============================================================

function hasMatchingTag(tags, mapping) {
  if (!mapping) {
    return false;
  }

  return Object.entries(mapping).some(
    ([tagName, values]) => {
      const tagValue = normalizeText(tags[tagName]);

      if (!tagValue) {
        return false;
      }

      return values
        .map(normalizeText)
        .includes(tagValue);
    }
  );
}

// ============================================================
// SEARCHABLE BUSINESS TEXT
// ============================================================

function getSearchableText(place) {
  return [
    place.name,
    place.brand,
    place.operator,
    place.description,
    place.category,
    place.type,
    place.businessType,
  ]
    .map(normalizeText)
    .filter(Boolean)
    .join(" ");
}

// ============================================================
// NAME KEYWORD MATCH
// ============================================================

function hasNameKeyword(place, category) {
  const keywords =
    CATEGORY_NAME_KEYWORDS[category];

  if (!keywords || keywords.length === 0) {
    return false;
  }

  const text = getSearchableText(place);

  return keywords.some((keyword) =>
    text.includes(normalizeText(keyword))
  );
}

// ============================================================
// EXCLUSION MATCH
// ============================================================

function hasExclusionKeyword(place, category) {
  const exclusions =
    CATEGORY_EXCLUSIONS[category];

  if (!exclusions || exclusions.length === 0) {
    return false;
  }

  const text = getSearchableText(place);

  return exclusions.some((keyword) =>
    text.includes(normalizeText(keyword))
  );
}

// ============================================================
// COMPETITOR DETECTION
// ============================================================

function detectCompetitor(place, category) {
  const tags = place.tags || {};

  const normalizedSelectedCategory =
    normalizeCategory(category);

  const mapping =
    CATEGORY_TAGS[normalizedSelectedCategory];

  // 1. Exclusion
  if (
    hasExclusionKeyword(
      place,
      normalizedSelectedCategory
    )
  ) {
    return {
      isCompetitor: false,
      detectionMethod: "excluded",
      detectionConfidence: "High",
    };
  }

  // 2. OSM tag
  if (
    mapping &&
    hasMatchingTag(tags, mapping)
  ) {
    return {
      isCompetitor: true,
      detectionMethod: "osm_tag",
      detectionConfidence: "High",
    };
  }

  // 3. Existing normalized category
  if (
    normalizeCategory(place.category) ===
    normalizedSelectedCategory
  ) {
    return {
      isCompetitor: true,
      detectionMethod: "normalized_category",
      detectionConfidence: "High",
    };
  }

  // 4. Business name
  if (
    hasNameKeyword(
      place,
      normalizedSelectedCategory
    )
  ) {
    return {
      isCompetitor: true,
      detectionMethod: "name_match",
      detectionConfidence: "Medium",
    };
  }

  // 5. Fallback keywords
  const searchableText = [
    place.name || "",
    place.category || "",
    place.type || "",
    place.businessType || "",
    ...Object.entries(tags).flatMap(
      ([key, value]) => [
        key,
        String(value ?? ""),
      ]
    ),
  ]
    .join(" ")
    .toLowerCase()
    .replace(/[_-]/g, " ");

  const fallbackKeywords = {
    bakery: [
      "bakery",
      "baker",
      "bakeshop",
      "bake shop",
      "cake shop",
      "pastry shop",
      "bread shop",
    ],

    cafe: [
      "cafe",
      "coffee shop",
      "coffeehouse",
      "coffee house",
    ],

    restaurant: [
      "restaurant",
      "dining",
      "eatery",
    ],

    pharmacy: [
      "pharmacy",
      "chemist",
      "medical store",
      "drugstore",
    ],

    salon: [
      "salon",
      "hairdresser",
      "beauty salon",
    ],

    gym: [
      "gym",
      "fitness center",
      "fitness centre",
    ],

    grocery: [
      "grocery",
      "supermarket",
      "convenience store",
    ],
  };

  const keywords =
    fallbackKeywords[
      normalizedSelectedCategory
    ] || [];

  const fallbackMatch = keywords.some(
    (keyword) =>
      searchableText.includes(
        keyword.toLowerCase()
      )
  );

  if (fallbackMatch) {
    return {
      isCompetitor: true,
      detectionMethod: "fallback_keyword",
      detectionConfidence: "Medium",
    };
  }

  return {
    isCompetitor: false,
    detectionMethod: "none",
    detectionConfidence: "None",
  };
}

// ============================================================
// DISTANCE CALCULATION
// ============================================================

function calculateDistance(
  lat1,
  lon1,
  lat2,
  lon2
) {
  const toRad = (value) =>
    (value * Math.PI) / 180;

  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);

  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) *
      Math.cos(toRad(lat2)) *
      Math.sin(dLon / 2) ** 2;

  const safeA = Math.max(
    0,
    Math.min(1, a)
  );

  const c =
    2 *
    Math.atan2(
      Math.sqrt(safeA),
      Math.sqrt(1 - safeA)
    );

  return 6371 * c;
}

// ============================================================
// DATA COVERAGE
// ============================================================

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

  if (radius >= 5 && totalPlaces < 25) {
    score = Math.min(score, 15);
  }

  if (radius >= 3 && totalPlaces < 15) {
    score = Math.min(score, 15);
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

// ============================================================
// DEMAND RELEVANCE
// ============================================================

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

  return Math.min(
    100,
    Math.round(rawScore / 2)
  );
}

// ============================================================
// ANALYZE LOCATION
// ============================================================

const analyzeLocation = async (req, res) => {
  try {
    // --------------------------------------------------------
    // AUTHENTICATION
    // --------------------------------------------------------

    if (!req.user || !req.user.userId) {
      return res.status(401).json({
        success: false,
        message: "Authentication required.",
      });
    }

    const userId = req.user.userId;

    // --------------------------------------------------------
    // REQUEST VALIDATION
    // --------------------------------------------------------

    const {
      latitude,
      longitude,
      radius,
      category,
    } = req.body || {};

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

    const parsedLatitude = Number(latitude);
    const parsedLongitude = Number(longitude);
    const parsedRadius = Number(radius);

    if (
      !Number.isFinite(parsedLatitude) ||
      !Number.isFinite(parsedLongitude) ||
      !Number.isFinite(parsedRadius)
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
        message: "Invalid latitude.",
      });
    }

    if (
      parsedLongitude < -180 ||
      parsedLongitude > 180
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid longitude.",
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

    // --------------------------------------------------------
    // CATEGORY VALIDATION
    // --------------------------------------------------------

    const normalizedCategory =
      normalizeCategory(category);

    if (
      !Object.prototype.hasOwnProperty.call(
        CATEGORY_TAGS,
        normalizedCategory
      )
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Unsupported business category. Please select a valid category.",
      });
    }
    // --------------------------------------------------------
    // ML GEOGRAPHIC OPPORTUNITY PREDICTION
    // --------------------------------------------------------

    console.log(
      "Calling BizLens AI ML prediction service..."
    );

    const mlPrediction = await getMLPrediction({
      latitude: parsedLatitude,
      longitude: parsedLongitude,
      category: normalizedCategory,
    });

    if (mlPrediction) {
      console.log(
        "ML prediction received:",
        mlPrediction.prediction_label ||
          mlPrediction.predictionLabel ||
          "Prediction received"
      );
    } else {
      console.log(
        "ML prediction unavailable. Continuing existing analysis."
      );
    }
    
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

    // --------------------------------------------------------
    // FETCH OSM DATA
    // --------------------------------------------------------

    console.log(
      "\nFetching OpenStreetMap data..."
    );

    const osmResult =
      await getNearbyBusinesses(
        parsedLatitude,
        parsedLongitude,
        parsedRadius
      );

    // --------------------------------------------------------
    // NORMALIZE OSM RESPONSE
    // --------------------------------------------------------

    let places = [];
    let osmQuality = {};

    if (Array.isArray(osmResult)) {
      places = osmResult;

      // Important:
      // If getNearbyBusinesses attaches dataQuality
      // directly to the array, this still works.
      osmQuality =
        osmResult.dataQuality || {};
    } else if (
      osmResult &&
      typeof osmResult === "object"
    ) {
      places = Array.isArray(
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

    if (!Array.isArray(places)) {
      return res.status(502).json({
        success: false,
        message:
          "Invalid data received from OpenStreetMap.",
      });
    }

    console.log(
      `Total OSM objects: ${places.length}`
    );

    // --------------------------------------------------------
    // DATA COVERAGE
    // --------------------------------------------------------

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
        osmQuality.businesses ?? 0
      }`
    );

    console.log(
      `Buildings: ${
        osmQuality.buildings ?? 0
      }`
    );

    console.log(
      `Roads: ${osmQuality.roads ?? 0}`
    );

    console.log(
      `Railways: ${
        osmQuality.railways ?? 0
      }`
    );

    console.log(
      `Landuse: ${
        osmQuality.landuse ?? 0
      }`
    );

    console.log(
      `Named places: ${
        osmQuality.namedPlaces ?? 0
      }`
    );

    console.log(
      `Data coverage: ${coverage.level}`
    );

    console.log(
      `Coverage score: ${coverage.score}`
    );

    // --------------------------------------------------------
    // COMPETITOR DETECTION
    // --------------------------------------------------------

    console.log(
      "\n========== COMPETITOR DEBUG =========="
    );

    console.log(
      "Selected category:",
      normalizedCategory
    );

    console.log(
      "Total places received:",
      places.length
    );

    console.log(
      "Sample OSM places:",
      places.slice(0, 25).map(
        (place) => ({
          name: place.name,
          type: place.type,
          category: place.category,
          latitude: place.latitude,
          longitude: place.longitude,
          tags: place.tags,
        })
      )
    );

    const competitorResults =
      places.map((place) => {
        const detection =
          detectCompetitor(
            place,
            normalizedCategory
          );

        return {
          ...place,
          ...detection,
        };
      });

    const detectedCompetitors =
      competitorResults.filter(
        (place) => place.isCompetitor
      );

    console.log(
      "Total detected competitors:",
      detectedCompetitors.length
    );

    console.log(
      "Detected competitor names:",
      detectedCompetitors.map(
        (place) => place.name
      )
    );

    // Bakery debugging
    console.log(
      "Bakery matching debug:",
      competitorResults
        .filter((place) => {
          const text = [
            place.name,
            place.category,
            place.type,
            JSON.stringify(
              place.tags || {}
            ),
          ]
            .join(" ")
            .toLowerCase();

          return (
            text.includes("bakery") ||
            text.includes("baker") ||
            text.includes("cake") ||
            text.includes("bread")
          );
        })
        .map((place) => ({
          name: place.name,
          category: place.category,
          type: place.type,
          tags: place.tags,
          isCompetitor:
            place.isCompetitor,
        }))
    );

    console.log(
      "======================================\n"
    );

    // --------------------------------------------------------
    // ADD DISTANCE TO COMPETITORS
    // --------------------------------------------------------

    const competitorsWithDistance =
      detectedCompetitors
        .map((place) => {
          const rawLat =
            place.latitude ??
            place.lat;

          const rawLon =
            place.longitude ??
            place.lon;

          if (
            rawLat === null ||
            rawLat === undefined ||
            rawLat === "" ||
            rawLon === null ||
            rawLon === ""
          ) {
            return null;
          }

          const lat = Number(rawLat);
          const lon = Number(rawLon);

          if (
            !Number.isFinite(lat) ||
            !Number.isFinite(lon) ||
            lat < -90 ||
            lat > 90 ||
            lon < -180 ||
            lon > 180
          ) {
            return null;
          }

          const distance =
            calculateDistance(
              parsedLatitude,
              parsedLongitude,
              lat,
              lon
            );

          return {
            ...place,
            lat,
            lon,
            distance: Number(
              distance.toFixed(3)
            ),
          };
        })
        .filter(
          (place) =>
            place !== null &&
            place.distance <=
              parsedRadius
        );

    console.log(
      "Competitors within selected radius:",
      competitorsWithDistance.length
    );

    console.log(
      "Competitor distances:",
      competitorsWithDistance.map(
        (place) => ({
          name: place.name,
          distance:
            `${place.distance} km`,
        })
      )
    );

    // --------------------------------------------------------
    // COMPETITION METRICS
    // --------------------------------------------------------

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

    const sortedCompetitors = [
      ...competitorsWithDistance,
    ].sort(
      (a, b) =>
        a.distance - b.distance
    );

    const nearestCompetitor =
      sortedCompetitors.length > 0
        ? sortedCompetitors[0]
        : null;

    const averageCompetitorDistance =
      competitorsWithDistance.length
        ? Number(
            (
              competitorsWithDistance.reduce(
                (sum, place) =>
                  sum + place.distance,
                0
              ) /
              competitorsWithDistance.length
            ).toFixed(3)
          )
        : null;

    // --------------------------------------------------------
    // COMPETITION RELIABILITY
    // --------------------------------------------------------

    let competitionReliability =
      "Low";

    if (coverage.score >= 75) {
      competitionReliability =
        "Medium";
    }

    if (
      coverage.score >= 85 &&
      Number(
        osmQuality.businesses ?? 0
      ) >= 10
    ) {
      competitionReliability =
        "High";
    }

    if (competitorCount === 0) {
      if (
        coverage.score >= 75 &&
        Number(
          osmQuality.businesses ?? 0
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
      count: competitorCount,

      density: competitionDensity,

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

    // --------------------------------------------------------
    // DEMAND INITIALIZATION
    // --------------------------------------------------------

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

    // --------------------------------------------------------
    // ACCESSIBILITY INITIALIZATION
    // --------------------------------------------------------

    const accessibility = {
      transport: 0,
      roads: 0,
      parking: 0,
      walkable: 0,
      crossings: 0,
      cycleways: 0,
    };

    // --------------------------------------------------------
    // OBJECT ANALYSIS
    // --------------------------------------------------------

    places.forEach((place) => {
      const tags = place.tags || {};

      // Basic OSM tags
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

      // Accessibility / transport tags
      const publicTransport =
        normalizeText(
          tags.public_transport ??
          place.public_transport
        );

      const railway =
        normalizeText(
          tags.railway ??
          place.railway
        );

      const crossing =
        normalizeText(
          tags.crossing ??
          place.crossing
        );

      const cycleway =
        normalizeText(
          tags.cycleway ??
          place.cycleway
        );

      const bicycle =
        normalizeText(
          tags.bicycle ??
          place.bicycle
        );

      const bus =
        normalizeText(
          tags.bus ??
          place.bus
        );

      // ------------------------------------------------------
      // EDUCATION
      // ------------------------------------------------------

      if (
        [
          "school",
          "college",
          "university",
          "kindergarten",
          "language_school",
        ].includes(amenity)
      ) {
        demand.education++;
      }

      // ------------------------------------------------------
      // OFFICES
      // ------------------------------------------------------

      if (
        office ||
        ["office", "commercial"].includes(
          building
        )
      ) {
        demand.offices++;
      }

      // ------------------------------------------------------
      // HOSPITALS
      // ------------------------------------------------------

      if (
        amenity === "hospital" ||
        healthcare === "hospital"
      ) {
        demand.hospitals++;
      }

      // ------------------------------------------------------
      // CLINICS
      // ------------------------------------------------------

      if (
        [
          "clinic",
          "doctors",
          "dentist",
        ].includes(amenity) ||
        [
          "clinic",
          "doctor",
          "dentist",
        ].includes(healthcare)
      ) {
        demand.clinics++;
      }

      // ------------------------------------------------------
      // PHARMACIES
      // ------------------------------------------------------

      if (
        [
          "pharmacy",
          "chemist",
          "medical",
          "medical_supply",
          "drugstore",
        ].includes(shop) ||
        amenity === "pharmacy" ||
        healthcare === "pharmacy"
      ) {
        demand.pharmacies++;
      }

      // ------------------------------------------------------
      // SHOPPING
      // ------------------------------------------------------

      if (
        shop ||
        [
          "marketplace",
          "market",
        ].includes(amenity)
      ) {
        demand.shopping++;
      }

      // ------------------------------------------------------
      // TRANSPORT
      // ------------------------------------------------------

      if (
        [
          "bus_station",
          "bus_stop",
          "taxi",
          "train_station",
          "subway",
          "tram_stop",
        ].includes(amenity) ||

        [
          "platform",
          "station",
        ].includes(publicTransport) ||

        [
          "station",
          "halt",
          "tram_stop",
          "subway",
          "subway_entrance",
        ].includes(railway) ||

        highway === "bus_stop" ||

        bus === "yes"
      ) {
        accessibility.transport++;
        demand.transport++;
      }

      // ------------------------------------------------------
      // PARKING
      // ------------------------------------------------------

      if (
        amenity === "parking" ||
        normalizeText(
          tags.park_ride
        ) === "yes"
      ) {
        accessibility.parking++;
      }

      // ------------------------------------------------------
      // TOURISM
      // ------------------------------------------------------

      if (tourism) {
        demand.tourism++;
      }

      // ------------------------------------------------------
      // RESIDENTIAL
      // ------------------------------------------------------

      if (
        [
          "apartments",
          "residential",
          "house",
          "dormitory",
          "terrace",
          "detached",
          "semidetached_house",
        ].includes(building)
      ) {
        demand.residential++;
      }

      // ------------------------------------------------------
      // SPORTS
      // ------------------------------------------------------

      if (
        leisure === "sports_centre" ||
        leisure === "fitness_centre" ||
        sport
      ) {
        demand.sports++;
      }

      // ------------------------------------------------------
      // FOOD
      // ------------------------------------------------------

      if (
        [
          "restaurant",
          "cafe",
          "fast_food",
          "food_court",
        ].includes(amenity)
      ) {
        demand.food++;
      }

      // ------------------------------------------------------
      // ENTERTAINMENT
      // ------------------------------------------------------

      if (
        [
          "cinema",
          "theatre",
          "arts_centre",
          "nightclub",
        ].includes(amenity) ||
        [
          "amusement_arcade",
          "water_park",
          "park",
        ].includes(leisure)
      ) {
        demand.entertainment++;
      }

      // ------------------------------------------------------
      // ROADS
      // ------------------------------------------------------

      if (highway) {
        accessibility.roads++;
      }

      // ------------------------------------------------------
      // WALKABLE
      // ------------------------------------------------------

      const walkableTypes = [
        "footway",
        "pedestrian",
        "path",
        "living_street",
        "steps",
        "bridleway",
      ];

      if (
        walkableTypes.includes(
          highway
        )
      ) {
        accessibility.walkable++;
      }

      // ------------------------------------------------------
      // CROSSINGS
      // ------------------------------------------------------

      if (
        highway === "crossing" ||
        crossing ||
        normalizeText(
          tags.footway
        ) === "crossing"
      ) {
        accessibility.crossings++;
      }

      // ------------------------------------------------------
      // CYCLEWAYS
      // ------------------------------------------------------

      if (
        highway === "cycleway" ||
        cycleway ||
        bicycle === "designated"
      ) {
        accessibility.cycleways++;
      }

      // ------------------------------------------------------
      // ACCESSIBILITY DEBUG
      // ------------------------------------------------------

      if (
        tags.highway ||
        tags.railway ||
        tags.public_transport ||
        tags.amenity === "parking" ||
        tags.crossing ||
        tags.cycleway ||
        tags.bus
      ) {
        console.log(
          "ACCESSIBILITY OSM OBJECT:",
          {
            name: place.name,
            objectType:
              place.objectType,
            highway:
              tags.highway,
            amenity:
              tags.amenity,
            public_transport:
              tags.public_transport,
            railway:
              tags.railway,
            crossing:
              tags.crossing,
            cycleway:
              tags.cycleway,
            bus:
              tags.bus,
          }
        );
      }
    });

    // --------------------------------------------------------
    // CATEGORY DEMAND SCORE
    // --------------------------------------------------------

    const categoryDemandScore =
      calculateDemandRelevance(
        demand,
        normalizedCategory
      );

    // --------------------------------------------------------
    // BUSINESS SCORING
    // --------------------------------------------------------

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

    // --------------------------------------------------------
    // SAVE ANALYSIS
    // --------------------------------------------------------

    const savedAnalysis =
      await Analysis.create({
        user: userId,

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
                recommendations:
          scoring.recommendations,

        mlPrediction:
          mlPrediction
            ? {
                prediction:
                  mlPrediction.prediction,

                predictionLabel:
                  mlPrediction.prediction_label,

                opportunityProbability:
                  mlPrediction.opportunity_probability,

                opportunityProbabilityPercent:
                  mlPrediction.opportunity_probability_percent,

                lowerOpportunityProbability:
                  mlPrediction.lower_opportunity_probability,

                geographicFeatures:
                  mlPrediction.geographic_features,

                interpretation:
                  mlPrediction.interpretation,
              }
            : null,
      });

    // --------------------------------------------------------
    // SERVER LOGGING
    // --------------------------------------------------------

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
          ? `${
              nearestCompetitor.name ||
              "Unnamed"
            } (${
              nearestCompetitor.distance
            } km)`
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
      `Competition reliability: ${
        competitionReliability
      }`
    );

    console.log(
      `Competition score: ${
        scoring.competitionScore
      }`
    );

    console.log(
      "\n---------- DEMAND ----------"
    );

    Object.entries(demand).forEach(
      ([key, value]) => {
        console.log(
          `${key}: ${value}`
        );
      }
    );

    console.log(
      `Category demand score: ${
        categoryDemandScore
      }`
    );

    console.log(
      `Demand score: ${
        scoring.demandScore
      }`
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
      `Accessibility score: ${
        scoring.accessibilityScore
      }`
    );

    console.log(
      "\n---------- BUSINESS SUCCESS ----------"
    );

    console.log(
      `Demand: ${
        scoring.demandScore
      } × 30%`
    );

    console.log(
      `Competition: ${
        scoring.competitionScore
      } × 25%`
    );

    console.log(
      `Accessibility: ${
        scoring.accessibilityScore
      } × 15%`
    );

    console.log(
      `Location attractiveness: ${
        scoring.locationAttractiveness
      } × 15%`
    );

    console.log(
      `Risk safety: ${
        scoring.riskScore
      } × 15%`
    );

    console.log(
      `Business Success Score: ${
        scoring.successScore
      }`
    );

    console.log(
      `Success Level: ${
        scoring.successLevel
      }`
    );

    console.log(
      `Confidence: ${
        scoring.confidence
      }`
    );

    console.log(
      `Confidence Score: ${
        scoring.confidenceScore
      }`
    );

    console.log(
      `Risk Score: ${
        scoring.riskScore
      }`
    );

    console.log(
      `Risk Level: ${
        scoring.riskLevel
      }`
    );

    console.log(
      `Analysis ID: ${
        savedAnalysis._id
      }`
    );

    console.log(
      "======================================"
    );

    // --------------------------------------------------------
    // API RESPONSE
    // --------------------------------------------------------

    return res.status(200).json({
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

        normalizedCategory,

        totalPlaces:
          places.length,

        osmStatistics: {
          totalObjects:
            places.length,

          businesses:
            osmQuality.businesses ?? 0,

          buildings:
            osmQuality.buildings ?? 0,

          roads:
            osmQuality.roads ?? 0,

          railways:
            osmQuality.railways ?? 0,

          landuse:
            osmQuality.landuse ?? 0,

          namedPlaces:
            osmQuality.namedPlaces ?? 0,
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
          sortedCompetitors,

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

        // ----------------------------------------------------
        // ML GEOGRAPHIC OPPORTUNITY PREDICTION
        // ----------------------------------------------------

        mlPrediction:
          savedAnalysis.mlPrediction,
      },
     
    });
  } catch (error) {
    console.error(
      "Analysis controller error:",
      error
    );

    return res.status(500).json({
      success: false,

      message:
        "Location analysis failed. Please try again later.",
    });
  }
};

// ============================================================
// GET ANALYSIS STATISTICS
// ============================================================

const getAnalysisStats = async (
  req,
  res
) => {
  try {
    // --------------------------------------------------------
    // AUTHENTICATION
    // --------------------------------------------------------

    if (
      !req.user ||
      !req.user.userId
    ) {
      return res.status(401).json({
        success: false,
        message:
          "Authentication required.",
      });
    }

    const userId =
      req.user.userId;

    // --------------------------------------------------------
    // VALIDATE MONGODB USER ID
    // --------------------------------------------------------

    if (
      !mongoose.Types.ObjectId.isValid(
        userId
      )
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Invalid user ID.",
      });
    }

    // --------------------------------------------------------
    // AGGREGATE STATISTICS
    // --------------------------------------------------------

    const stats =
      await Analysis.aggregate([
        {
          $match: {
            user:
              new mongoose.Types.ObjectId(
                userId
              ),
          },
        },

        {
          $group: {
            _id: null,

            totalAnalyses: {
              $sum: 1,
            },

            averageSuccessScore: {
              $avg: "$successScore",
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
              $avg: "$riskScore",
            },
          },
        },
      ]);

    // --------------------------------------------------------
    // DEFAULT VALUES
    // --------------------------------------------------------

    const result =
      stats.length > 0
        ? stats[0]
        : {
            totalAnalyses: 0,
            averageSuccessScore: 0,
            averageCompetitionScore: 0,
            averageDemandScore: 0,
            averageRiskScore: 0,
          };

    // --------------------------------------------------------
    // RESPONSE
    // --------------------------------------------------------

    return res.status(200).json({
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

    return res.status(500).json({
      success: false,

      message:
        "Failed to fetch analysis statistics.",
    });
  }
};

// ============================================================
// EXPORT CONTROLLERS
// ============================================================

module.exports = {
  analyzeLocation,
  getAnalysisStats,
};
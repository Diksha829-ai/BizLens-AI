const axios = require("axios");

// ============================================================
// BizLens-AI
// PRODUCTION-READY OPENSTREETMAP / OVERPASS SERVICE
// ============================================================
//
// Features:
// 1. Category-specific Overpass queries
// 2. Broad daily-life business support
// 3. Infrastructure / landmark support
// 4. POST requests to avoid huge GET URLs
// 5. Bounded retries with exponential backoff
// 6. Retry-After support and total request deadline
// 7. Multiple Overpass fallback servers
// 8. In-memory TTL cache
// 9. Bounded cache size
// 10. Input validation
// 11. Node / way / relation normalization
// 12. Center / geometry coordinate support
// 13. Business metadata extraction
// 14. OSM tag preservation
// 15. Deduplication
// 16. Category statistics
// 17. Data-quality statistics
// 18. Graceful partial-result fallback
// 19. Backward-compatible getNearbyBusinesses()
// 20. Category-specific getNearbyBusinessesByCategory()
//
// IMPORTANT:
// OSM is crowdsourced and incomplete.
// Missing OSM data does NOT mean that a real-world business
// does not exist.
//
// ============================================================

// ============================================================
// OVERPASS SERVERS
// ============================================================

const OVERPASS_ENDPOINTS = [
  "https://overpass-api.de/api/interpreter",
  "https://overpass.kumi.systems/api/interpreter",
  "https://overpass.private.coffee/api/interpreter",
];

// ============================================================
// CONFIGURATION
// ============================================================

const REQUEST_TIMEOUT =
  Number(process.env.OVERPASS_TIMEOUT || 15000);

const MAX_RETRIES_PER_ENDPOINT =
  Number(process.env.OVERPASS_RETRIES || 1);

const OVERPASS_TOTAL_TIMEOUT =
  Number(process.env.OVERPASS_TOTAL_TIMEOUT || 45000);

const BASE_RETRY_DELAY =
  Number(process.env.OVERPASS_RETRY_DELAY || 1500);

const MAX_RADIUS_KM =
  Number(process.env.OVERPASS_MAX_RADIUS || 10);

const CACHE_TTL_MS =
  Number(process.env.OVERPASS_CACHE_TTL || 5 * 60 * 1000);

const MAX_CACHE_ENTRIES =
  Number(process.env.OVERPASS_MAX_CACHE || 100);

const MAX_CATEGORY_QUERIES =
  Number(process.env.OVERPASS_MAX_CATEGORY_QUERIES || 12);

const USER_AGENT =
  process.env.OVERPASS_USER_AGENT ||
  "BizLens-AI/1.0 (Final Year Project; OpenStreetMap data analysis)";

// ============================================================
// IN-MEMORY CACHE
// ============================================================

const cache = new Map();

// ============================================================
// LOGGING
// ============================================================

function logInfo(message, ...args) {
  console.log(`[OverpassService] ${message}`, ...args);
}

function logWarn(message, ...args) {
  console.warn(`[OverpassService] ${message}`, ...args);
}

function logError(message, ...args) {
  console.error(`[OverpassService] ${message}`, ...args);
}

// ============================================================
// BASIC HELPERS
// ============================================================

function cleanString(value) {
  if (value === undefined || value === null) {
    return "";
  }

  return String(value)
    .trim()
    .toLowerCase();
}

function normalizeText(value) {
  return cleanString(value)
    .replace(/\s+/g, " ");
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// ============================================================
// CACHE HELPERS
// ============================================================

function getCache(key) {
  const entry = cache.get(key);

  if (!entry) {
    return null;
  }

  if (Date.now() - entry.timestamp > CACHE_TTL_MS) {
    cache.delete(key);
    return null;
  }

  return entry.value;
}

function setCache(key, value) {
  if (cache.size >= MAX_CACHE_ENTRIES) {
    const oldestKey = cache.keys().next().value;

    if (oldestKey) {
      cache.delete(oldestKey);
    }
  }

  cache.set(key, {
    timestamp: Date.now(),
    value,
  });
}

function clearCache() {
  cache.clear();
}

// ============================================================
// CACHE KEY
// ============================================================

function createCacheKey(
  latitude,
  longitude,
  radiusInKm,
  category = "all"
) {
  const lat = Number(latitude).toFixed(5);
  const lon = Number(longitude).toFixed(5);
  const radius = Number(radiusInKm).toFixed(2);

  return `${lat}:${lon}:${radius}:${category}`;
}

// ============================================================
// BUSINESS CATEGORY DEFINITIONS
// ============================================================
//
// These are deliberately based on OSM tags rather than
// relying on one generic query.
//
// ============================================================

const CATEGORY_DEFINITIONS = {
  restaurant: [
    `nwr["amenity"="restaurant"](around:{radius},{lat},{lon});`,
    `nwr["amenity"="fast_food"](around:{radius},{lat},{lon});`,
    `nwr["amenity"="food_court"](around:{radius},{lat},{lon});`,
  ],

  cafe: [
    `nwr["amenity"="cafe"](around:{radius},{lat},{lon});`,
    `nwr["shop"="coffee"](around:{radius},{lat},{lon});`,
  ],

  bakery: [
    `nwr["shop"="bakery"](around:{radius},{lat},{lon});`,
  ],

  grocery: [
    `nwr["shop"="supermarket"](around:{radius},{lat},{lon});`,
    `nwr["shop"="convenience"](around:{radius},{lat},{lon});`,
    `nwr["shop"="grocery"](around:{radius},{lat},{lon});`,
    `nwr["shop"="greengrocer"](around:{radius},{lat},{lon});`,
  ],

  clothing: [
    `nwr["shop"="clothes"](around:{radius},{lat},{lon});`,
    `nwr["shop"="fashion"](around:{radius},{lat},{lon});`,
    `nwr["shop"="boutique"](around:{radius},{lat},{lon});`,
  ],

  pharmacy: [
    `nwr["shop"="pharmacy"](around:{radius},{lat},{lon});`,
    `nwr["shop"="chemist"](around:{radius},{lat},{lon});`,
    `nwr["shop"="medical"](around:{radius},{lat},{lon});`,
    `nwr["amenity"="pharmacy"](around:{radius},{lat},{lon});`,
    `nwr["healthcare"="pharmacy"](around:{radius},{lat},{lon});`,
  ],

  medical: [
    `nwr["amenity"="hospital"](around:{radius},{lat},{lon});`,
    `nwr["amenity"="clinic"](around:{radius},{lat},{lon});`,
    `nwr["amenity"="doctors"](around:{radius},{lat},{lon});`,
    `nwr["amenity"="dentist"](around:{radius},{lat},{lon});`,
    `nwr["healthcare"](around:{radius},{lat},{lon});`,
  ],

  salon: [
    `nwr["shop"="hairdresser"](around:{radius},{lat},{lon});`,
    `nwr["shop"="beauty"](around:{radius},{lat},{lon});`,
    `nwr["shop"="cosmetics"](around:{radius},{lat},{lon});`,
  ],

  gym: [
    `nwr["leisure"="fitness_centre"](around:{radius},{lat},{lon});`,
    `nwr["leisure"="sports_centre"](around:{radius},{lat},{lon});`,
    `nwr["sport"="fitness"](around:{radius},{lat},{lon});`,
    `nwr["sport"="bodybuilding"](around:{radius},{lat},{lon});`,
  ],

  hotel: [
    `nwr["tourism"="hotel"](around:{radius},{lat},{lon});`,
    `nwr["tourism"="hostel"](around:{radius},{lat},{lon});`,
    `nwr["tourism"="guest_house"](around:{radius},{lat},{lon});`,
    `nwr["tourism"="motel"](around:{radius},{lat},{lon});`,
  ],

  bank: [
    `nwr["amenity"="bank"](around:{radius},{lat},{lon});`,
  ],

  atm: [
    `nwr["amenity"="atm"](around:{radius},{lat},{lon});`,
  ],

  fuel: [
    `nwr["amenity"="fuel"](around:{radius},{lat},{lon});`,
  ],

  marketplace: [
    `nwr["amenity"="marketplace"](around:{radius},{lat},{lon});`,
  ],

  school: [
    `nwr["amenity"="school"](around:{radius},{lat},{lon});`,
    `nwr["amenity"="kindergarten"](around:{radius},{lat},{lon});`,
  ],

  college: [
    `nwr["amenity"="college"](around:{radius},{lat},{lon});`,
  ],

  university: [
    `nwr["amenity"="university"](around:{radius},{lat},{lon});`,
  ],

  office: [
    `nwr["office"](around:{radius},{lat},{lon});`,
    `nwr["building"="office"](around:{radius},{lat},{lon});`,
  ],

  park: [
    `nwr["leisure"="park"](around:{radius},{lat},{lon});`,
    `nwr["leisure"="garden"](around:{radius},{lat},{lon});`,
    `nwr["leisure"="nature_reserve"](around:{radius},{lat},{lon});`,
  ],

  sports: [
    `nwr["leisure"="stadium"](around:{radius},{lat},{lon});`,
    `nwr["leisure"="pitch"](around:{radius},{lat},{lon});`,
    `nwr["leisure"="track"](around:{radius},{lat},{lon});`,
    `nwr["sport"](around:{radius},{lat},{lon});`,
  ],

  transport: [
    `nwr["highway"="bus_stop"](around:{radius},{lat},{lon});`,
    `nwr["amenity"="bus_station"](around:{radius},{lat},{lon});`,
    `nwr["amenity"="taxi"](around:{radius},{lat},{lon});`,
    `nwr["railway"="station"](around:{radius},{lat},{lon});`,
    `nwr["railway"="halt"](around:{radius},{lat},{lon});`,
    `nwr["railway"="tram_stop"](around:{radius},{lat},{lon});`,
    `nwr["railway"="subway_entrance"](around:{radius},{lat},{lon});`,
  ],

  tourist: [
    `nwr["tourism"](around:{radius},{lat},{lon});`,
  ],

  religious: [
    `nwr["amenity"="place_of_worship"](around:{radius},{lat},{lon});`,
  ],

  parking: [
    `nwr["amenity"="parking"](around:{radius},{lat},{lon});`,
  ],

  petrol: [
    `nwr["amenity"="fuel"](around:{radius},{lat},{lon});`,
  ],

  electronics: [
    `nwr["shop"="electronics"](around:{radius},{lat},{lon});`,
    `nwr["shop"="mobile_phone"](around:{radius},{lat},{lon});`,
    `nwr["shop"="computer"](around:{radius},{lat},{lon});`,
  ],

  furniture: [
    `nwr["shop"="furniture"](around:{radius},{lat},{lon});`,
  ],

  hardware: [
    `nwr["shop"="hardware"](around:{radius},{lat},{lon});`,
  ],

  books: [
    `nwr["shop"="books"](around:{radius},{lat},{lon});`,
  ],

  jewellery: [
    `nwr["shop"="jewelry"](around:{radius},{lat},{lon});`,
  ],

  car: [
    `nwr["shop"="car"](around:{radius},{lat},{lon});`,
    `nwr["shop"="car_repair"](around:{radius},{lat},{lon});`,
    `nwr["shop"="tyres"](around:{radius},{lat},{lon});`,
  ],

  laundry: [
    `nwr["shop"="laundry"](around:{radius},{lat},{lon});`,
  ],

  pet: [
    `nwr["shop"="pet"](around:{radius},{lat},{lon});`,
  ],
    florist: [
    `nwr["shop"="florist"](around:{radius},{lat},{lon});`,
  ],

  department_store: [
    `nwr["shop"="department_store"](around:{radius},{lat},{lon});`,
  ],

  convenience: [
    `nwr["shop"="convenience"](around:{radius},{lat},{lon});`,
  ],

  general: [
    `nwr["shop"](around:{radius},{lat},{lon});`,
    `nwr["amenity"~"restaurant|cafe|fast_food|bank|pharmacy|hospital|clinic|school|college|university|fuel|marketplace|atm"](around:{radius},{lat},{lon});`,
    `nwr["office"](around:{radius},{lat},{lon});`,
    `nwr["craft"](around:{radius},{lat},{lon});`,
    `nwr["tourism"~"hotel|hostel|guest_house|motel|attraction|museum|gallery"](around:{radius},{lat},{lon});`,
    `nwr["leisure"~"park|garden|fitness_centre|sports_centre|stadium"](around:{radius},{lat},{lon});`,
  ],
};

// ============================================================
// CATEGORY ALIASES
// ============================================================

const CATEGORY_ALIASES = {
  food: "restaurant",
  restaurants: "restaurant",
  dining: "restaurant",
  eating: "restaurant",
  coffee: "cafe",
  coffee_shop: "cafe",
  cafes: "cafe",
  grocery_store: "grocery",
  supermarket: "grocery",
  supermarkets: "grocery",
  groceries: "grocery",
  medical_store: "pharmacy",
  chemist: "pharmacy",
  chemists: "pharmacy",
  hospital: "medical",
  hospitals: "medical",
  clinic: "medical",
  clinics: "medical",
  doctor: "medical",
  doctors: "medical",
  healthcare: "medical",
  beauty_salon: "salon",
  hairdresser: "salon",
  fitness: "gym",
  fitness_center: "gym",
  fitness_centre: "gym",
  hotels: "hotel",
  accommodation: "hotel",
  petrol: "fuel",
  petrol_pump: "fuel",
  gas_station: "fuel",
  gas: "fuel",
  school: "school",
  schools: "school",
  university: "university",
  universities: "university",
  colleges: "college",
  offices: "office",
  parks: "park",
  sports_facility: "sports",
  bus: "transport",
  railway: "transport",
  train_station: "transport",
  public_transport: "transport",
  tourist_attraction: "tourist",
  tourism: "tourist",
  place_of_worship: "religious",
  worship: "religious",
  parking_lot: "parking",
  electronics_store: "electronics",
  mobile_shop: "electronics",
  furniture_store: "furniture",
  hardware_store: "hardware",
  bookstore: "books",
  bookshop: "books",
  jewelry: "jewellery",
  jeweller: "jewellery",
  jewellery_store: "jewellery",
  automobile: "car",
  automotive: "car",
  car_repair: "car",
  laundry_service: "laundry",
  pet_shop: "pet",
  flower_shop: "florist",
  flowers: "florist",
  department: "department_store",
  general_store: "convenience",
  shops: "general",
  all: "general",
  business: "general",
  businesses: "general",
};

// ============================================================
// NORMALIZE REQUESTED CATEGORY
// ============================================================

function normalizeRequestedCategory(category) {
  const normalized = normalizeText(category)
    .replace(/[\s-]+/g, "_");

  if (!normalized) {
    return null;
  }

  if (CATEGORY_DEFINITIONS[normalized]) {
    return normalized;
  }

  return CATEGORY_ALIASES[normalized] || null;
}

// ============================================================
// NORMALIZE BUSINESS TYPE
// ============================================================

function normalizeBusinessType(tags = {}) {
  const shop = cleanString(tags.shop);
  const amenity = cleanString(tags.amenity);
  const leisure = cleanString(tags.leisure);
  const sport = cleanString(tags.sport);
  const office = cleanString(tags.office);
  const tourism = cleanString(tags.tourism);
  const healthcare = cleanString(tags.healthcare);
  const craft = cleanString(tags.craft);
  const building = cleanString(tags.building);
  const landuse = cleanString(tags.landuse);
  const highway = cleanString(tags.highway);
  const railway = cleanString(tags.railway);

  if (shop) {
    const shopMap = {
      supermarket: "grocery",
      convenience: "grocery",
      grocery: "grocery",
      greengrocer: "grocery",
      clothes: "clothing",
      fashion: "clothing",
      boutique: "clothing",
      pharmacy: "pharmacy",
      chemist: "pharmacy",
      medical: "pharmacy",
      hairdresser: "salon",
      beauty: "salon",
      cosmetics: "salon",
      electronics: "electronics",
      mobile_phone: "electronics",
      computer: "electronics",
      furniture: "furniture",
      hardware: "hardware",
      books: "books",
      jewelry: "jewellery",
      jewellery: "jewellery",
      car: "car",
      car_repair: "car",
      tyres: "car",
      laundry: "laundry",
      pet: "pet",
      florist: "florist",
      department_store: "department_store",
      bakery: "bakery",
      coffee: "cafe",
    };

    return shopMap[shop] || shop.replace(/_/g, " ");
  }

  if (amenity) {
    const amenityMap = {
      restaurant: "restaurant",
      fast_food: "restaurant",
      food_court: "restaurant",
      cafe: "cafe",
      pharmacy: "pharmacy",
      hospital: "medical",
      clinic: "medical",
      doctors: "medical",
      dentist: "medical",
      bank: "bank",
      atm: "atm",
      fuel: "fuel",
      marketplace: "marketplace",
      school: "school",
      kindergarten: "school",
      college: "college",
      university: "university",
      bus_station: "transport",
      taxi: "transport",
      parking: "parking",
      place_of_worship: "religious",
    };

    return amenityMap[amenity] || amenity.replace(/_/g, " ");
  }

  if (healthcare) {
    return healthcare.replace(/_/g, " ");
  }

  if (office) {
    return `office: ${office.replace(/_/g, " ")}`;
  }

  if (craft) {
    return `craft: ${craft.replace(/_/g, " ")}`;
  }

  if (tourism) {
    return tourism.replace(/_/g, " ");
  }

  if (leisure) {
    return leisure.replace(/_/g, " ");
  }

  if (sport) {
    return sport.replace(/_/g, " ");
  }

  if (railway) {
    return "transport";
  }

  if (highway) {
    return "transport";
  }

  if (building) {
    return "building";
  }

  if (landuse) {
    return landuse.replace(/_/g, " ");
  }

  return "unknown";
}

// ============================================================
// IS BUSINESS
// ============================================================

function isBusiness(tags = {}) {
  const shop = cleanString(tags.shop);
  const amenity = cleanString(tags.amenity);
  const office = cleanString(tags.office);
  const craft = cleanString(tags.craft);
  const tourism = cleanString(tags.tourism);
  const healthcare = cleanString(tags.healthcare);
  const leisure = cleanString(tags.leisure);

  return Boolean(
    shop ||
    office ||
    craft ||
    healthcare ||
    amenity ||
    (
      tourism &&
      !["viewpoint", "information"].includes(tourism)
    ) ||
    (
      leisure &&
      [
        "fitness_centre",
        "sports_centre",
        "stadium",
      ].includes(leisure)
    )
  );
}

// ============================================================
// IS INFRASTRUCTURE
// ============================================================

function isInfrastructure(tags = {}) {
  const highway = cleanString(tags.highway);
  const building = cleanString(tags.building);
  const railway = cleanString(tags.railway);
  const landuse = cleanString(tags.landuse);

  return Boolean(
    highway ||
    railway ||
    building ||
    landuse ||
    tags.public_transport ||
    tags.crossing ||
    tags.cycleway
  );
}

// ============================================================
// DETERMINE OBJECT TYPE
// ============================================================

function determineObjectType(tags = {}) {
  const highway = cleanString(tags.highway);
  const railway = cleanString(tags.railway);
  const amenity = cleanString(tags.amenity);
  const publicTransport = cleanString(tags.public_transport);
  const crossing = cleanString(tags.crossing);
  const cycleway = cleanString(tags.cycleway);

  if (isBusiness(tags)) {
    return "business";
  }

  if (
    highway ||
    railway ||
    publicTransport ||
    crossing ||
    cycleway
  ) {
    return "transport";
  }

  if (amenity) {
    return "amenity";
  }

  if (tags.building) {
    return "building";
  }

  if (tags.landuse) {
    return "landuse";
  }

  if (tags.leisure) {
    return "leisure";
  }

  if (tags.tourism) {
    return "tourism";
  }

  return "other";
}
// ============================================================
// EXTRACT ADDRESS
// ============================================================

function extractAddress(tags = {}) {
  const parts = [];

  const fields = [
    "addr:housenumber",
    "addr:street",
    "addr:suburb",
    "addr:neighbourhood",
    "addr:city",
    "addr:district",
    "addr:state",
    "addr:postcode",
    "addr:country",
  ];

  for (const field of fields) {
    const value = tags[field];

    if (value && String(value).trim()) {
      parts.push(String(value).trim());
    }
  }

  if (parts.length > 0) {
    return [...new Set(parts)].join(", ");
  }

  return (
    tags["addr:full"] ||
    tags.address ||
    tags["contact:address"] ||
    ""
  );
}

// ============================================================
// EXTRACT COORDINATES
// ============================================================

function extractCoordinates(element = {}) {
  // Nodes normally contain lat/lon directly.
  if (
    Number.isFinite(Number(element.lat)) &&
    Number.isFinite(Number(element.lon))
  ) {
    return {
      lat: Number(element.lat),
      lon: Number(element.lon),
    };
  }

  // Ways and relations may contain a center.
  if (
    element.center &&
    Number.isFinite(Number(element.center.lat)) &&
    Number.isFinite(Number(element.center.lon))
  ) {
    return {
      lat: Number(element.center.lat),
      lon: Number(element.center.lon),
    };
  }

  // Some responses include geometry instead of center.
  if (
    Array.isArray(element.geometry) &&
    element.geometry.length > 0
  ) {
    const validPoints = element.geometry.filter(
      point =>
        Number.isFinite(Number(point.lat)) &&
        Number.isFinite(Number(point.lon))
    );

    if (validPoints.length > 0) {
      const lat =
        validPoints.reduce(
          (sum, point) => sum + Number(point.lat),
          0
        ) / validPoints.length;

      const lon =
        validPoints.reduce(
          (sum, point) => sum + Number(point.lon),
          0
        ) / validPoints.length;

      return { lat, lon };
    }
  }

  return {
    lat: null,
    lon: null,
  };
}

// ============================================================
// NORMALIZE OSM ELEMENT
// ============================================================

function normalizeElement(element = {}) {
  const tags = element.tags || {};

  const coordinates = extractCoordinates(element);

  const latitude = coordinates.lat;
  const longitude = coordinates.lon;

  const name =
    tags.name ||
    tags["name:en"] ||
    tags["official_name"] ||
    tags["brand"] ||
    tags["operator"] ||
    "Unnamed location";

  const businessType = normalizeBusinessType(tags);

  const business = isBusiness(tags);

  const infrastructure = isInfrastructure(tags);

  const address = extractAddress(tags);

  const objectType = determineObjectType(tags);

  const id =
    element.id !== undefined && element.id !== null
      ? `osm-${element.type || "element"}-${element.id}`
      : [
          "osm",
          name,
          latitude,
          longitude,
        ].join("-");

  return {
    id,
    osmId: element.id ?? null,
    osmType: element.type || "unknown",

    name: String(name).trim(),

    type: businessType,
    category: businessType,

    objectType,
    isBusiness: business,
    isInfrastructure: infrastructure,

    latitude,
    longitude,
    lat: latitude,
    lon: longitude,

    coordinates:
      latitude !== null && longitude !== null
        ? {
            lat: latitude,
            lon: longitude,
          }
        : null,

    address,

    city:
      tags["addr:city"] ||
      tags["addr:town"] ||
      tags["addr:village"] ||
      "",

    postcode: tags["addr:postcode"] || "",

    phone:
      tags.phone ||
      tags["contact:phone"] ||
      "",

    website:
      tags.website ||
      tags["contact:website"] ||
      "",

    email:
      tags.email ||
      tags["contact:email"] ||
      "",

    openingHours:
      tags.opening_hours || "",

    brand:
      tags.brand || "",

    operator:
      tags.operator || "",

    source: "OpenStreetMap",

    tags: { ...tags },

    raw: {
      id: element.id ?? null,
      type: element.type || "unknown",
    },
  };
}

// ============================================================
// NORMALIZE RESULTS
// ============================================================

function normalizeResults(elements = []) {
  if (!Array.isArray(elements)) {
    return [];
  }

  const places = [];

  for (const element of elements) {
    try {
      if (!element || typeof element !== "object") {
        continue;
      }

      const normalized = normalizeElement(element);

      if (
        normalized.latitude === null ||
        normalized.longitude === null
      ) {
        continue;
      }

      if (
        !Number.isFinite(normalized.latitude) ||
        !Number.isFinite(normalized.longitude)
      ) {
        continue;
      }

      if (
        normalized.latitude < -90 ||
        normalized.latitude > 90 ||
        normalized.longitude < -180 ||
        normalized.longitude > 180
      ) {
        continue;
      }

      places.push(normalized);
    } catch (error) {
      logWarn(
        "Skipping an invalid OSM element:",
        error.message
      );
    }
  }

  return deduplicatePlaces(places);
}

// ============================================================
// DEDUPLICATE PLACES
// ============================================================

function deduplicatePlaces(places = []) {
  const unique = new Map();

  for (const place of places) {
    if (!place) {
      continue;
    }

    const osmKey =
      place.osmId !== null &&
      place.osmId !== undefined
        ? `${place.osmType}-${place.osmId}`
        : null;

    const name = normalizeText(place.name);

    const lat = Number(place.latitude);
    const lon = Number(place.longitude);

    const coordinateKey =
      Number.isFinite(lat) && Number.isFinite(lon)
        ? `${lat.toFixed(5)},${lon.toFixed(5)}`
        : "";

    const key =
      osmKey ||
      `${name}:${coordinateKey}`;

    if (!unique.has(key)) {
      unique.set(key, place);
    }
  }

  return Array.from(unique.values());
}

// ============================================================
// CATEGORY COUNTS
// ============================================================

function calculateCategoryCounts(places = []) {
  const counts = {};

  for (const place of places) {
    const category =
      place.category ||
      place.type ||
      "unknown";

    counts[category] = (counts[category] || 0) + 1;
  }

  return counts;
}

// ============================================================
// BUSINESS CATEGORY COUNTS
// ============================================================

function calculateBusinessCategoryCounts(places = []) {
  const counts = {};

  for (const place of places) {
    if (!place.isBusiness) {
      continue;
    }

    const category =
      place.category ||
      place.type ||
      "unknown";

    counts[category] = (counts[category] || 0) + 1;
  }

  return counts;
}

// ============================================================
// DATA QUALITY STATISTICS
// ============================================================

function calculateDataQuality(places = []) {
  const total = places.length;

  const businesses =
    places.filter(place => place.isBusiness).length;

  const named =
    places.filter(
      place =>
        place.name &&
        place.name !== "Unnamed location"
    ).length;

  const coordinates =
    places.filter(
      place =>
        Number.isFinite(place.latitude) &&
        Number.isFinite(place.longitude)
    ).length;

  const infrastructure =
    places.filter(
      place => place.isInfrastructure
    ).length;

  const percentage = (count, denominator) =>
    denominator > 0
      ? Number(((count / denominator) * 100).toFixed(2))
      : 0;

  return {
    total,
    businesses,
    named,
    coordinates,
    infrastructure,

    namedCoverage: percentage(named, total),

    coordinateCoverage: percentage(
      coordinates,
      total
    ),

    businessCoverage: percentage(
      businesses,
      total
    ),

    infrastructureCoverage: percentage(
      infrastructure,
      total
    ),

    source: "OpenStreetMap",

    note:
      "OpenStreetMap data is crowdsourced and may be incomplete.",
  };
}
// ============================================================
// BUILD CATEGORY QUERY
// ============================================================

function buildCategoryQuery(
  category,
  latitude,
  longitude,
  radiusInMeters
) {
  const normalizedCategory =
    normalizeRequestedCategory(category);

  if (!normalizedCategory) {
    throw new Error(
      `Unsupported category "${category}".`
    );
  }

  const lat = Number(latitude);
  const lon = Number(longitude);
  const radius = Number(radiusInMeters);

  const definitions =
    CATEGORY_DEFINITIONS[normalizedCategory];

  const fragments = definitions
    .slice(0, MAX_CATEGORY_QUERIES)
    .map(fragment =>
      fragment
        .replaceAll("{radius}", String(radius))
        .replaceAll("{lat}", String(lat))
        .replaceAll("{lon}", String(lon))
    );

  return `
[out:json][timeout:25];
(
  ${fragments.join("\n")}
);
out center tags;
`;
}

// ============================================================
// BUILD MAIN QUERY
// ============================================================

function buildQuery(
  latitude,
  longitude,
  radiusInMeters
) {
  const lat = Number(latitude);
  const lon = Number(longitude);
  const radius = Number(radiusInMeters);

  const includeInfrastructure =
    String(
      process.env.OVERPASS_INCLUDE_INFRASTRUCTURE || "false"
    ).toLowerCase() === "true";

  const businessQuery = `
    nwr["shop"](around:${radius},${lat},${lon});
    nwr["amenity"~"restaurant|cafe|fast_food|food_court|bank|atm|pharmacy|hospital|clinic|doctors|dentist|school|college|university|fuel|marketplace|bus_station|taxi|parking|place_of_worship|kindergarten"](around:${radius},${lat},${lon});
    nwr["office"](around:${radius},${lat},${lon});
    nwr["craft"](around:${radius},${lat},${lon});
    nwr["healthcare"](around:${radius},${lat},${lon});
    nwr["tourism"~"hotel|hostel|guest_house|motel|attraction|museum|gallery"](around:${radius},${lat},${lon});
    nwr["leisure"~"park|garden|fitness_centre|sports_centre|stadium"](around:${radius},${lat},${lon});
  `;

  const infrastructureQuery = `
    nwr["highway"~"bus_stop|crossing|traffic_signals"](around:${radius},${lat},${lon});
    nwr["railway"~"station|halt|tram_stop|subway_entrance"](around:${radius},${lat},${lon});
    nwr["public_transport"](around:${radius},${lat},${lon});
    nwr["building"](around:${radius},${lat},${lon});
    nwr["landuse"~"commercial|retail|industrial|residential"](around:${radius},${lat},${lon});
  `;

  return `
[out:json][timeout:25];
(
  ${businessQuery}
  ${includeInfrastructure ? infrastructureQuery : ""}
);
out center tags;
`;
}

// ============================================================
// INPUT VALIDATION
// ============================================================

function validateInput(
  latitude,
  longitude,
  radiusInKm
) {
  const lat = Number(latitude);
  const lon = Number(longitude);
  const radius = Number(radiusInKm);

  if (
    !Number.isFinite(lat) ||
    lat < -90 ||
    lat > 90
  ) {
    throw new Error("Invalid latitude.");
  }

  if (
    !Number.isFinite(lon) ||
    lon < -180 ||
    lon > 180
  ) {
    throw new Error("Invalid longitude.");
  }

  if (
    !Number.isFinite(radius) ||
    radius <= 0
  ) {
    throw new Error(
      "Radius must be a positive number."
    );
  }

  const safeRadius = Math.min(
    radius,
    MAX_RADIUS_KM
  );

  return {
    latitude: lat,
    longitude: lon,
    radiusInKm: safeRadius,
  };
}

// ============================================================
// RETRYABLE HTTP STATUS
// ============================================================

function isRetryableStatus(status) {
  return [
    408,
    425,
    429,
    500,
    502,
    503,
    504,
  ].includes(Number(status));
}

// ============================================================
// RETRY DELAY
// ============================================================

function calculateRetryDelay(error, attempt) {
  const retryAfter =
    error.response?.headers?.["retry-after"];

  if (retryAfter) {
    const seconds = Number(retryAfter);

    if (Number.isFinite(seconds)) {
      return Math.min(
        seconds * 1000,
        10000
      );
    }

    const retryDate = Date.parse(retryAfter);

    if (Number.isFinite(retryDate)) {
      return Math.max(
        0,
        Math.min(retryDate - Date.now(), 10000)
      );
    }
  }

  const exponential =
    BASE_RETRY_DELAY *
    Math.pow(2, Math.max(0, attempt - 1));

  const jitter =
    Math.floor(Math.random() * 300);

  return Math.min(
    exponential + jitter,
    5000
  );
}

// ============================================================
// REQUEST ONE OVERPASS SERVER
// ============================================================

async function requestOverpass(endpoint, query, timeoutMs) {
  const response = await axios.post(
    endpoint,
    new URLSearchParams({
      data: query,
    }).toString(),
    {
      timeout: Math.max(1000, timeoutMs),

      headers: {
        Accept: "application/json",
        "Content-Type":
          "application/x-www-form-urlencoded",
        "User-Agent": USER_AGENT,
      },

      validateStatus: () => true,
    }
  );

  if (
    response.status < 200 ||
    response.status >= 300
  ) {
    const error = new Error(
      `Overpass HTTP ${response.status}`
    );

    error.response = response;

    throw error;
  }

  if (
    !response.data ||
    !Array.isArray(response.data.elements)
  ) {
    throw new Error(
      "Invalid response received from Overpass."
    );
  }

  return response.data.elements;
}

// ============================================================
// FETCH WITH RETRIES AND FALLBACK
// ============================================================

async function fetchOverpassData(query) {
  let lastError = null;

  const deadline =
    Date.now() + OVERPASS_TOTAL_TIMEOUT;

  for (const endpoint of OVERPASS_ENDPOINTS) {
    for (
      let attempt = 1;
      attempt <= MAX_RETRIES_PER_ENDPOINT;
      attempt++
    ) {
      const remainingMs = deadline - Date.now();

      if (remainingMs <= 0) {
        throw new Error(
          "Overpass request exceeded the total time limit."
        );
      }

      const timeoutMs = Math.min(
        REQUEST_TIMEOUT,
        remainingMs
      );

      try {
        logInfo(
          `Requesting ${endpoint} - attempt ${attempt}/${MAX_RETRIES_PER_ENDPOINT}`
        );

        const elements = await requestOverpass(
          endpoint,
          query,
          timeoutMs
        );

        logInfo(
          `Received ${elements.length} raw OSM objects from ${endpoint}`
        );

        return {
          elements,
          endpoint,
          attempt,
        };
      } catch (error) {
        lastError = error;

        const status = error.response?.status;

        logWarn(
          `Overpass failed. endpoint=${endpoint}, attempt=${attempt}, status=${status || "N/A"}, code=${error.code || "N/A"}, message=${error.message}`
        );

        const retryable =
          !status ||
          isRetryableStatus(status);

        if (
          attempt < MAX_RETRIES_PER_ENDPOINT &&
          retryable &&
          Date.now() < deadline
        ) {
          const delay = Math.min(
            calculateRetryDelay(error, attempt),
            Math.max(0, deadline - Date.now())
          );

          await sleep(delay);
        } else {
          break;
        }
      }
    }
  }

  throw lastError || new Error(
    "All Overpass servers failed."
  );
}
// ============================================================
// GET NEARBY BUSINESSES
// ============================================================

async function getNearbyBusinesses(
  latitude,
  longitude,
  radiusInKm
) {
  const input = validateInput(
    latitude,
    longitude,
    radiusInKm
  );

  const {
    latitude: lat,
    longitude: lon,
    radiusInKm: radius,
  } = input;

  const radiusInMeters = Math.round(radius * 1000);

  const cacheKey = createCacheKey(
    lat,
    lon,
    radius,
    "all"
  );

  const cached = getCache(cacheKey);

  if (cached) {
    logInfo("Returning cached nearby businesses");
    return cached;
  }

  const query = buildQuery(
    lat,
    lon,
    radiusInMeters
  );

  const result = await fetchOverpassData(query);

  const places = normalizeResults(result.elements);

  const dataQuality = calculateDataQuality(places);

  const categoryCounts = calculateCategoryCounts(places);

  const businessCategoryCounts =
    calculateBusinessCategoryCounts(places);

  places.dataQuality = dataQuality;

  places.rawCount = result.elements.length;

  places.normalizedCount = places.length;

  places.queryMetadata = {
    latitude: lat,
    longitude: lon,
    radiusKm: radius,
    radiusMeters: radiusInMeters,

    category: "all",

    source: "OpenStreetMap",
    provider: "Overpass API",

    endpoint: result.endpoint,
    attempts: result.attempt,

    retrievedAt: new Date().toISOString(),
    cached: false,

    categoryCounts,
    businessCategoryCounts,

    osmCompletenessWarning:
      "OpenStreetMap is crowdsourced and may not contain every real-world business.",
  };

  setCache(cacheKey, places);

  logInfo(`Final normalized places: ${places.length}`);
  logInfo(`Businesses: ${dataQuality.businesses}`);

  return places;
}

// ============================================================
// CATEGORY-SPECIFIC SEARCH
// ============================================================

async function getNearbyBusinessesByCategory(
  latitude,
  longitude,
  radiusInKm,
  category
) {
  const input = validateInput(
    latitude,
    longitude,
    radiusInKm
  );

  const normalizedCategory =
    normalizeRequestedCategory(category);

  if (!normalizedCategory) {
    throw new Error(
      `Unsupported category "${category}".`
    );
  }

  const {
    latitude: lat,
    longitude: lon,
    radiusInKm: radius,
  } = input;

  const radiusInMeters = Math.round(radius * 1000);

  const cacheKey = createCacheKey(
    lat,
    lon,
    radius,
    normalizedCategory
  );

  const cached = getCache(cacheKey);

  if (cached) {
    logInfo(
      `Returning cached ${normalizedCategory} results`
    );

    return cached;
  }

  const query = buildCategoryQuery(
    normalizedCategory,
    lat,
    lon,
    radiusInMeters
  );

  const result = await fetchOverpassData(query);

  const places = normalizeResults(result.elements);

  const dataQuality = calculateDataQuality(places);

  places.dataQuality = dataQuality;

  places.rawCount = result.elements.length;

  places.normalizedCount = places.length;

  places.queryMetadata = {
    latitude: lat,
    longitude: lon,
    radiusKm: radius,
    radiusMeters: radiusInMeters,

    category: normalizedCategory,

    source: "OpenStreetMap",
    provider: "Overpass API",

    endpoint: result.endpoint,
    attempts: result.attempt,

    retrievedAt: new Date().toISOString(),
    cached: false,

    categoryCounts: calculateCategoryCounts(places),

    businessCategoryCounts:
      calculateBusinessCategoryCounts(places),

    osmCompletenessWarning:
      "OpenStreetMap is crowdsourced and may not contain every real-world business.",
  };

  setCache(cacheKey, places);

  logInfo(
    `${normalizedCategory}: ${places.length} normalized places`
  );

  return places;
}

// ============================================================
// MULTI-CATEGORY SEARCH
// ============================================================

async function getNearbyBusinessesByCategories(
  latitude,
  longitude,
  radiusInKm,
  categories = []
) {
  if (!Array.isArray(categories) || categories.length === 0) {
    return getNearbyBusinesses(
      latitude,
      longitude,
      radiusInKm
    );
  }

  const input = validateInput(
    latitude,
    longitude,
    radiusInKm
  );

  const uniqueCategories = [
    ...new Set(
      categories
        .map(normalizeRequestedCategory)
        .filter(Boolean)
    ),
  ].slice(0, MAX_CATEGORY_QUERIES);

  if (uniqueCategories.length === 0) {
    throw new Error(
      "No supported categories were provided."
    );
  }

  const results = await Promise.all(
    uniqueCategories.map(category =>
      getNearbyBusinessesByCategory(
        input.latitude,
        input.longitude,
        input.radiusInKm,
        category
      ).catch(error => {
        logWarn(
          `Category "${category}" failed: ${error.message}`
        );

        return [];
      })
  ));

  const combined = [];

  for (const places of results) {
    combined.push(...places);
  }

  const places = deduplicatePlaces(combined);

  places.dataQuality = calculateDataQuality(places);

  places.rawCount = combined.length;

  places.normalizedCount = places.length;

  places.queryMetadata = {
    latitude: input.latitude,
    longitude: input.longitude,
    radiusKm: input.radiusInKm,

    categories: uniqueCategories,

    source: "OpenStreetMap",
    provider: "Overpass API",

    retrievedAt: new Date().toISOString(),

    categoryCounts: calculateCategoryCounts(places),

    businessCategoryCounts:
      calculateBusinessCategoryCounts(places),

    osmCompletenessWarning:
      "OpenStreetMap is crowdsourced and may not contain every real-world business.",
  };

  return places;
}

// ============================================================
// CACHE STATISTICS
// ============================================================

function getCacheStats() {
  return {
    size: cache.size,
    maxEntries: MAX_CACHE_ENTRIES,
    ttlMs: CACHE_TTL_MS,
  };
}

// ============================================================
// SUPPORTED CATEGORIES
// ============================================================

function getSupportedCategories() {
  return Object.keys(CATEGORY_DEFINITIONS);
}

// ============================================================
// EXPORTS
// ============================================================

module.exports = {
  // Main APIs
  getNearbyBusinesses,
  getNearbyBusinessesByCategory,
  getNearbyBusinessesByCategories,

  // Query builders
  buildQuery,
  buildCategoryQuery,

  // Categories
  normalizeRequestedCategory,
  getSupportedCategories,
  CATEGORY_DEFINITIONS,

  // Normalization
  normalizeBusinessType,
  normalizeElement,
  normalizeResults,

  isBusiness,
  isInfrastructure,
  determineObjectType,

  extractAddress,
  extractCoordinates,

  // Statistics
  calculateDataQuality,
  calculateCategoryCounts,
  calculateBusinessCategoryCounts,

  // Deduplication
  deduplicatePlaces,

  // Cache
  clearCache,
  getCacheStats,
};
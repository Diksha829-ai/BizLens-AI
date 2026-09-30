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
// 5. Retry with exponential backoff
// 6. Retry-After support
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
  Number(process.env.OVERPASS_TIMEOUT || 60000);

const MAX_RETRIES_PER_ENDPOINT =
  Number(process.env.OVERPASS_RETRIES || 2);

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
    `nwr["amenity"="veterinary"](around:{radius},{lat},{lon});`,
  ],

  childcare: [
    `nwr["amenity"="childcare"](around:{radius},{lat},{lon});`,
    `nwr["amenity"="kindergarten"](around:{radius},{lat},{lon});`,
  ],

  generic_shops: [
    `nwr["shop"](around:{radius},{lat},{lon});`,
  ],

  generic_amenities: [
    `nwr["amenity"](around:{radius},{lat},{lon});`,
  ],

  generic_tourism: [
    `nwr["tourism"](around:{radius},{lat},{lon});`,
  ],

  generic_leisure: [
    `nwr["leisure"](around:{radius},{lat},{lon});`,
  ],
};


// ============================================================
// BUSINESS CATEGORY ALIASES
// ============================================================

const CATEGORY_ALIASES = {

  restaurant: "restaurant",
  restaurants: "restaurant",
  food: "restaurant",
  fastfood: "restaurant",

  cafe: "cafe",
  coffee: "cafe",
  coffee_shop: "cafe",

  bakery: "bakery",

  grocery: "grocery",
  supermarket: "grocery",
  convenience: "grocery",

  pharmacy: "pharmacy",
  chemist: "pharmacy",
  medical_store: "pharmacy",
  medical_shop: "pharmacy",

  hospital: "medical",
  clinic: "medical",
  doctor: "medical",
  doctors: "medical",
  dentist: "medical",
  healthcare: "medical",

  salon: "salon",
  beauty: "salon",
  hairdresser: "salon",

  gym: "gym",
  fitness: "gym",

  hotel: "hotel",
  hostel: "hotel",

  clothing: "clothing",
  clothes: "clothing",
  fashion: "clothing",

  bank: "bank",
  atm: "atm",

  petrol: "petrol",
  fuel: "fuel",

  market: "marketplace",
  marketplace: "marketplace",

  school: "school",
  schools: "school",

  college: "college",

  university: "university",

  office: "office",
  offices: "office",

  park: "park",
  garden: "park",

  sports: "sports",
  stadium: "sports",

  transport: "transport",
  bus: "transport",
  railway: "transport",

  tourism: "tourist",
  tourist: "tourist",

  worship: "religious",
  religious: "religious",

  parking: "parking",

  electronics: "electronics",
  mobile: "electronics",

  furniture: "furniture",

  hardware: "hardware",

  books: "books",
  bookstore: "books",

  jewellery: "jewellery",
  jewelry: "jewellery",

  car: "car",
  automobile: "car",
  mechanic: "car",

  laundry: "laundry",

  pet: "pet",
  veterinary: "pet",

  childcare: "childcare",
  daycare: "childcare",
};


// ============================================================
// NORMALIZE CATEGORY
// ============================================================

function normalizeRequestedCategory(category) {

  if (!category) {
    return null;
  }

  const normalized =
    cleanString(category)
      .replace(/\s+/g, "_")
      .replace(/-/g, "_");

  return CATEGORY_ALIASES[normalized] ||
    (CATEGORY_DEFINITIONS[normalized]
      ? normalized
      : null);
}


// ============================================================
// BUSINESS TYPE NORMALIZATION
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

  // Food
  if (
    amenity === "restaurant" ||
    amenity === "fast_food" ||
    amenity === "food_court"
  ) {
    return "restaurant";
  }

  if (
    amenity === "cafe" ||
    shop === "coffee"
  ) {
    return "cafe";
  }

  if (shop === "bakery") {
    return "bakery";
  }

  // Pharmacy
  if (
    shop === "pharmacy" ||
    shop === "chemist" ||
    shop === "medical" ||
    shop === "medical_supply" ||
    shop === "drugstore" ||
    amenity === "pharmacy" ||
    healthcare === "pharmacy"
  ) {
    return "pharmacy";
  }

  // Medical
  if (
    amenity === "hospital" ||
    healthcare === "hospital"
  ) {
    return "hospital";
  }

  if (
    amenity === "clinic" ||
    amenity === "doctors" ||
    amenity === "dentist" ||
    healthcare === "clinic" ||
    healthcare === "doctor" ||
    healthcare === "dentist"
  ) {
    return "clinic";
  }

  // Fitness
  if (
    leisure === "fitness_centre" ||
    leisure === "sports_centre" ||
    sport === "fitness" ||
    sport === "bodybuilding" ||
    sport === "weightlifting"
  ) {
    return "gym";
  }

  // Salon
  if (
    shop === "hairdresser" ||
    shop === "beauty" ||
    shop === "cosmetics"
  ) {
    return "salon";
  }

  // Grocery
  if (
    shop === "supermarket" ||
    shop === "convenience" ||
    shop === "grocery" ||
    shop === "greengrocer"
  ) {
    return "grocery";
  }

  // Clothing
  if (
    shop === "clothes" ||
    shop === "fashion" ||
    shop === "boutique"
  ) {
    return "clothing";
  }

  // Hotels
  if (
    tourism === "hotel" ||
    tourism === "hostel" ||
    tourism === "guest_house" ||
    tourism === "motel"
  ) {
    return "hotel";
  }

  // Education
  if (
    amenity === "school" ||
    amenity === "kindergarten"
  ) {
    return "school";
  }

  if (amenity === "college") {
    return "college";
  }

  if (amenity === "university") {
    return "university";
  }

  // Markets
  if (
    amenity === "marketplace" ||
    shop === "market"
  ) {
    return "market";
  }

  // Banks
  if (amenity === "bank") {
    return "bank";
  }

  if (amenity === "atm") {
    return "atm";
  }

  // Fuel
  if (amenity === "fuel") {
    return "fuel";
  }

  // Parks
  if (
    leisure === "park" ||
    leisure === "garden" ||
    leisure === "nature_reserve"
  ) {
    return "park";
  }

  // Sports
  if (
    leisure === "stadium" ||
    leisure === "pitch" ||
    leisure === "track" ||
    sport
  ) {
    return "sports";
  }

  // Office
  if (
    office ||
    building === "office"
  ) {
    return "office";
  }

  // Transport
  if (
    highway === "bus_stop" ||
    highway === "platform" ||
    amenity === "bus_station" ||
    amenity === "taxi" ||
    railway === "station" ||
    railway === "halt" ||
    railway === "tram_stop" ||
    railway === "subway_entrance"
  ) {
    return "transport";
  }

  // Parking
  if (amenity === "parking") {
    return "parking";
  }

  // Tourism
  if (tourism) {
    return "tourism";
  }

  // Religious
  if (amenity === "place_of_worship") {
    return "religious";
  }

  // Other shops
  if (shop) {
    return "shop";
  }

  // Craft
  if (craft) {
    return "craft";
  }

  // Residential
  if (
    [
      "residential",
      "apartments",
      "house",
      "detached",
      "semidetached_house",
      "terrace",
      "dormitory",
    ].includes(building)
  ) {
    return "residential";
  }

  if (highway) {
    return "road";
  }

  if (railway) {
    return "railway";
  }

  if (building) {
    return "building";
  }

  if (landuse) {
    return "landuse";
  }

  return "unknown";
}


// ============================================================
// BUSINESS DETECTION
// ============================================================

function isBusiness(tags = {}) {

  const shop = cleanString(tags.shop);
  const amenity = cleanString(tags.amenity);
  const office = cleanString(tags.office);
  const craft = cleanString(tags.craft);
  const tourism = cleanString(tags.tourism);
  const healthcare = cleanString(tags.healthcare);
  const leisure = cleanString(tags.leisure);

  if (shop || office || craft || tourism || healthcare) {
    return true;
  }

  if (
    [
      "restaurant",
      "cafe",
      "fast_food",
      "food_court",
      "pharmacy",
      "hospital",
      "clinic",
      "doctors",
      "dentist",
      "bank",
      "atm",
      "fuel",
      "marketplace",
      "veterinary",
    ].includes(amenity)
  ) {
    return true;
  }

  if (
    [
      "fitness_centre",
      "sports_centre",
    ].includes(leisure)
  ) {
    return true;
  }

  return false;
}


// ============================================================
// INFRASTRUCTURE
// ============================================================

function isInfrastructure(tags = {}) {

  const highway = cleanString(tags.highway);
  const building = cleanString(tags.building);
  const railway = cleanString(tags.railway);
  const landuse = cleanString(tags.landuse);

  if (highway || railway || landuse) {
    return true;
  }

  if (
    [
      "yes",
      "residential",
      "house",
      "apartments",
      "detached",
      "semidetached_house",
      "terrace",
      "commercial",
      "industrial",
      "office",
    ].includes(building)
  ) {
    return true;
  }

  return false;
}


// ============================================================
// OBJECT TYPE
// ============================================================

function determineObjectType(tags = {}) {
  const highway = cleanString(tags.highway);
  const railway = cleanString(tags.railway);
  const amenity = cleanString(tags.amenity);
  const publicTransport = cleanString(tags.public_transport);
  const crossing = cleanString(tags.crossing);
  const cycleway = cleanString(tags.cycleway);

  // Keep businesses classified as businesses
  if (isBusiness(tags)) {
    return "business";
  }

  // Parking
  if (
    amenity === "parking" ||
    tags.parking
  ) {
    return "parking";
  }

  // Public transport
  if (
    publicTransport ||
    highway === "bus_stop" ||
    amenity === "bus_station" ||
    amenity === "taxi" ||
    [
      "station",
      "halt",
      "tram_stop",
      "subway_entrance",
    ].includes(railway)
  ) {
    return "transport";
  }

  // Pedestrian crossings
  if (
    highway === "crossing" ||
    crossing
  ) {
    return "crossing";
  }

  // Cycle infrastructure
  if (
    highway === "cycleway" ||
    cycleway
  ) {
    return "cycleway";
  }

  // Footpaths and pedestrian areas
  if (
    [
      "footway",
      "pedestrian",
      "steps",
      "path",
    ].includes(highway)
  ) {
    return "walkable";
  }

  // General roads
  if (highway) {
    return "road";
  }

  if (railway) {
    return "railway";
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

  return "place";
}

// ============================================================
// ADDRESS
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
  ];

  for (const field of fields) {
    if (tags[field]) {
      parts.push(tags[field]);
    }
  }

  if (parts.length > 0) {
    return parts.join(", ");
  }

  return tags["addr:full"] || null;
}


// ============================================================
// COORDINATES
// ============================================================
function extractCoordinates(element) {
  // 1. Direct coordinates (OSM nodes)
  if (
    Number.isFinite(Number(element.lat)) &&
    Number.isFinite(Number(element.lon)) &&
    element.lat != null &&
    element.lon != null
  ) {
    return {
      lat: Number(element.lat),
      lon: Number(element.lon),
    };
  }

  // 2. Center coordinates (OSM ways and relations)
  if (
    element.center?.lat != null &&
    element.center?.lon != null
  ) {
    return {
      lat: Number(element.center.lat),
      lon: Number(element.center.lon),
    };
  }

  // 3. Geometry coordinates (fallback)
  if (
    Array.isArray(element.geometry) &&
    element.geometry.length > 0
  ) {
    const validPoints = element.geometry.filter(
      (point) =>
        point.lat != null &&
        point.lon != null &&
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

  return null;
}

// ============================================================
// NORMALIZE ELEMENT
// ============================================================

function normalizeElement(element) {

  if (
    !element ||
    !element.type ||
    element.id === undefined
  ) {
    return null;
  }

  const tags =
    element.tags || {};

 const coordinates = extractCoordinates(element);

if (!coordinates) {
  return null;
}

const latitude = coordinates.lat;
const longitude = coordinates.lon;

 if (
  !Number.isFinite(latitude) ||
  !Number.isFinite(longitude)
) {
  return null;
}

  const businessType =
    normalizeBusinessType(tags);

  const business =
    isBusiness(tags);

  const name =
    tags.name ||
    tags["name:en"] ||
    tags["name:local"] ||
    "Unnamed place";

  return {

    id:
      `${element.type}/${element.id}`,

    osmId:
      element.id,

    osmType:
      element.type,

    latitude,

    longitude,

    name,

    normalizedName:
      normalizeText(name),

    category:
      businessType,

    businessType,

    objectType:
      determineObjectType(tags),

    isBusiness:
      business,

    isInfrastructure:
      isInfrastructure(tags),

    shop:
      tags.shop || null,

    amenity:
      tags.amenity || null,

    healthcare:
      tags.healthcare || null,

    office:
      tags.office || null,

    leisure:
      tags.leisure || null,

    sport:
      tags.sport || null,

    tourism:
      tags.tourism || null,

    craft:
      tags.craft || null,

    building:
      tags.building || null,

    landuse:
      tags.landuse || null,

    highway:
  tags.highway || null,

railway:
  tags.railway || null,

public_transport:
  tags.public_transport || null,

crossing:
  tags.crossing || null,

cycleway:
  tags.cycleway || null,

bicycle:
  tags.bicycle || null,

bus:
  tags.bus || null,

park_ride:
  tags.park_ride || null,

    address:
      extractAddress(tags),

    street:
      tags["addr:street"] || null,

    suburb:
      tags["addr:suburb"] ||
      tags["addr:neighbourhood"] ||
      null,

    city:
      tags["addr:city"] || null,

    postcode:
      tags["addr:postcode"] || null,

    phone:
      tags.phone ||
      tags["contact:phone"] ||
      null,

    website:
      tags.website ||
      tags["contact:website"] ||
      null,

    email:
      tags.email ||
      tags["contact:email"] ||
      null,

    openingHours:
      tags.opening_hours ||
      null,

    operator:
      tags.operator ||
      null,

    brand:
      tags.brand ||
      null,

    wheelchair:
      tags.wheelchair ||
      null,

    parking:
      tags.parking ||
      null,

    internetAccess:
      tags.internet_access ||
      null,

    cuisine:
      tags.cuisine ||
      null,

    capacity:
      tags.capacity ||
      null,

    osmVersion:
      element.version ??
      null,

    osmTimestamp:
      element.timestamp ??
      null,

    tags,
  };
}


// ============================================================
// DEDUPLICATION
// ============================================================

function deduplicatePlaces(places = []) {

  const unique =
    new Map();

  for (const place of places) {

    if (!place) {
      continue;
    }

    if (!unique.has(place.id)) {
      unique.set(
        place.id,
        place
      );
    }
  }

  return Array.from(
    unique.values()
  );
}


// ============================================================
// CATEGORY COUNTS
// ============================================================

function calculateCategoryCounts(places = []) {

  const counts = {};

  for (const place of places) {

    const category =
      place.category ||
      "unknown";

    counts[category] =
      (counts[category] || 0) + 1;
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
      place.businessType ||
      "unknown";

    counts[category] =
      (counts[category] || 0) + 1;
  }

  return counts;
}


// ============================================================
// DATA QUALITY
// ============================================================

function calculateDataQuality(places = []) {

  const total =
    places.length;

  const businesses =
    places.filter(
      place => place.isBusiness
    ).length;

  const named =
    places.filter(
      place =>
        place.name &&
        place.name !== "Unnamed place"
    ).length;

  const coordinates =
    places.filter(
      place =>
        Number.isFinite(place.latitude) &&
        Number.isFinite(place.longitude)
    ).length;

  const buildings =
    places.filter(
      place =>
        place.objectType === "building"
    ).length;

  const roads =
    places.filter(
      place =>
        place.objectType === "road"
    ).length;

  const railways =
    places.filter(
      place =>
        place.objectType === "railway"
    ).length;

  const landuse =
    places.filter(
      place =>
        place.objectType === "landuse"
    ).length;

  const infrastructure =
    places.filter(
      place =>
        place.isInfrastructure
    ).length;

  const categories =
    new Set(
      places
        .map(
          place =>
            place.category
        )
        .filter(
          category =>
            category &&
            category !== "unknown"
        )
    );

  let level =
    "Very Low";

  if (total >= 500) {
    level = "High";
  }
  else if (total >= 250) {
    level = "Good";
  }
  else if (total >= 100) {
    level = "Moderate";
  }
  else if (total >= 25) {
    level = "Low";
  }

  const coordinateCoverage =
    total > 0
      ? Number(
          (
            coordinates /
            total *
            100
          ).toFixed(2)
        )
      : 0;

  const nameCoverage =
    total > 0
      ? Number(
          (
            named /
            total *
            100
          ).toFixed(2)
        )
      : 0;

  return {

    totalObjects:
      total,

    totalPlaces:
      total,

    businesses,

    namedPlaces:
      named,

    coordinateComplete:
      coordinates,

    coordinateCoverage,

    nameCoverage,

    normalizedCategories:
      categories.size,

    buildings,

    roads,

    railways,

    landuse,

    infrastructure,

    level,

    recordCompleteness:
      total > 0
        ? 100
        : 0,
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
    normalizeRequestedCategory(
      category
    );

  if (!normalizedCategory) {
    throw new Error(
      `Unsupported business category: ${category}`
    );
  }

  const definitions =
    CATEGORY_DEFINITIONS[
      normalizedCategory
    ];

  if (
    !definitions ||
    definitions.length === 0
  ) {
    throw new Error(
      `No Overpass query definition found for category: ${normalizedCategory}`
    );
  }

  const fragments =
    definitions
      .slice(0, MAX_CATEGORY_QUERIES)
      .map(
        fragment =>
          fragment
            .replace(
              /\{radius\}/g,
              String(radiusInMeters)
            )
            .replace(
              /\{lat\}/g,
              String(latitude)
            )
            .replace(
              /\{lon\}/g,
              String(longitude)
            )
      );

  return `
[out:json][timeout:55];

(
${fragments.join("\n")}
);

out center tags;
`;
}


// ============================================================
// BUILD ALL-BUSINESS QUERY
// ============================================================
//
// IMPORTANT:
// This intentionally does NOT query every possible OSM tag
// in one massive request.
//
// Instead, a limited set of broad business queries is used.
// Category-specific analysis should use getNearbyBusinessesByCategory().
//
// ============================================================


function buildQuery(
  latitude,
  longitude,
  radiusInMeters
) {
  const lat = Number(latitude);
  const lon = Number(longitude);
  const radius = Number(radiusInMeters);

  if (
    !Number.isFinite(lat) ||
    !Number.isFinite(lon) ||
    !Number.isFinite(radius) ||
    lat < -90 ||
    lat > 90 ||
    lon < -180 ||
    lon > 180 ||
    radius <= 0
  ) {
    throw new Error(
      "Invalid Overpass search parameters."
    );
  }

  return `
[out:json][timeout:55];

(
  // --------------------------------------------------------
  // BUSINESSES AND AMENITIES
  // --------------------------------------------------------

  nwr["shop"](around:${radius},${lat},${lon});
  nwr["amenity"](around:${radius},${lat},${lon});
  nwr["healthcare"](around:${radius},${lat},${lon});
  nwr["office"](around:${radius},${lat},${lon});
  nwr["craft"](around:${radius},${lat},${lon});
  nwr["tourism"](around:${radius},${lat},${lon});
  nwr["leisure"](around:${radius},${lat},${lon});
  nwr["sport"](around:${radius},${lat},${lon});
  nwr["education"](around:${radius},${lat},${lon});

  // --------------------------------------------------------
  // PUBLIC TRANSPORT
  // --------------------------------------------------------

  nwr["public_transport"](around:${radius},${lat},${lon});
  nwr["highway"="bus_stop"](around:${radius},${lat},${lon});
  nwr["amenity"="bus_station"](around:${radius},${lat},${lon});
  nwr["amenity"="taxi"](around:${radius},${lat},${lon});

  nwr["railway"="station"](around:${radius},${lat},${lon});
  nwr["railway"="halt"](around:${radius},${lat},${lon});
  nwr["railway"="tram_stop"](around:${radius},${lat},${lon});

  // --------------------------------------------------------
  // ROAD NETWORK
  // --------------------------------------------------------

  way["highway"](around:${radius},${lat},${lon});

  // --------------------------------------------------------
  // CROSSINGS AND CYCLEWAYS
  // --------------------------------------------------------

  nwr["highway"="crossing"](around:${radius},${lat},${lon});
  nwr["crossing"](around:${radius},${lat},${lon});

  way["cycleway"](around:${radius},${lat},${lon});

  // --------------------------------------------------------
  // PARKING
  // --------------------------------------------------------

  nwr["amenity"="parking"](around:${radius},${lat},${lon});
  nwr["parking"](around:${radius},${lat},${lon});

  // --------------------------------------------------------
  // BUILDINGS AND LAND USE
  // --------------------------------------------------------

  nwr["building"](around:${radius},${lat},${lon});
  nwr["landuse"](around:${radius},${lat},${lon});
);

out center tags;
`;
}
// ============================================================
// VALIDATION
// ============================================================

function validateInput(
  latitude,
  longitude,
  radiusInKm
) {

  const lat =
    Number(latitude);

  const lon =
    Number(longitude);

  const radius =
    Number(radiusInKm);

  if (
    !Number.isFinite(lat) ||
    !Number.isFinite(lon) ||
    !Number.isFinite(radius)
  ) {
    throw new Error(
      "Invalid latitude, longitude or radius."
    );
  }

  if (
    lat < -90 ||
    lat > 90
  ) {
    throw new Error(
      "Latitude must be between -90 and 90."
    );
  }

  if (
    lon < -180 ||
    lon > 180
  ) {
    throw new Error(
      "Longitude must be between -180 and 180."
    );
  }

  if (
    radius <= 0 ||
    radius > MAX_RADIUS_KM
  ) {
    throw new Error(
      `Radius must be greater than 0 and less than or equal to ${MAX_RADIUS_KM} km.`
    );
  }

  return {
    latitude: lat,
    longitude: lon,
    radiusInKm: radius,
  };
}


// ============================================================
// RETRYABLE STATUS
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
  ].includes(status);
}


// ============================================================
// RETRY DELAY
// ============================================================

function calculateRetryDelay(
  attempt,
  error
) {

  const retryAfter =
    error.response?.headers?.["retry-after"];

  if (retryAfter) {

    const seconds =
      Number(retryAfter);

    if (
      Number.isFinite(seconds)
    ) {
      return Math.min(
        seconds * 1000,
        30000
      );
    }
  }

  const exponential =
    BASE_RETRY_DELAY *
    Math.pow(2, attempt - 1);

  const jitter =
    Math.floor(
      Math.random() * 500
    );

  return Math.min(
    exponential + jitter,
    30000
  );
}


// ============================================================
// REQUEST OVERPASS
// ============================================================
//
// POST is intentional.
// It avoids sending huge query strings through the URL.
//
// ============================================================

async function requestOverpass(
  endpoint,
  query
) {

  const response =
    await axios.post(
      endpoint,
      new URLSearchParams({
        data: query,
      }).toString(),
      {
        timeout:
          REQUEST_TIMEOUT,

        headers: {
          Accept:
            "application/json",

          "Content-Type":
            "application/x-www-form-urlencoded",

          "User-Agent":
            USER_AGENT,
        },

        validateStatus:
          () => true,
      }
    );

  if (
    response.status < 200 ||
    response.status >= 300
  ) {

    const error =
      new Error(
        `Overpass HTTP ${response.status}`
      );

    error.response =
      response;

    throw error;
  }

  if (
    !response.data ||
    !Array.isArray(
      response.data.elements
    )
  ) {

    throw new Error(
      "Invalid response received from Overpass."
    );
  }

  return response.data.elements;
}


// ============================================================
// FETCH WITH RETRIES + FALLBACK
// ============================================================

async function fetchOverpassData(
  query
) {

  let lastError =
    null;

  for (
    const endpoint of
    OVERPASS_ENDPOINTS
  ) {

    for (
      let attempt = 1;
      attempt <= MAX_RETRIES_PER_ENDPOINT;
      attempt++
    ) {

      try {

        logInfo(
          `Requesting ${endpoint} - attempt ${attempt}/${MAX_RETRIES_PER_ENDPOINT}`
        );

        const elements =
          await requestOverpass(
            endpoint,
            query
          );

        logInfo(
          `Received ${elements.length} raw OSM objects from ${endpoint}`
        );

        return {
          elements,
          endpoint,
          attempt,
        };

      }

      catch (error) {

        lastError =
          error;

        const status =
          error.response?.status;

        logWarn(
          `Overpass failed. endpoint=${endpoint}, attempt=${attempt}, status=${status || "N/A"}, code=${error.code || "N/A"}`
        );

        const retryable =
          !status ||
          isRetryableStatus(status);

        if (
          !retryable
        ) {
          break;
        }

        if (
          attempt <
          MAX_RETRIES_PER_ENDPOINT
        ) {

          const delay =
            calculateRetryDelay(
              attempt,
              error
            );

          logInfo(
            `Retrying in ${delay}ms`
          );

          await sleep(delay);
        }
      }
    }

    logWarn(
      `Switching to fallback Overpass server: ${endpoint}`
    );
  }

  throw (
    lastError ||
    new Error(
      "Unable to retrieve data from Overpass."
    )
  );
}


// ============================================================
// NORMALIZE RESULT
// ============================================================

function normalizeResults(
  elements
) {

  return deduplicatePlaces(
    elements
      .map(normalizeElement)
      .filter(Boolean)
  );
}


// ============================================================
// MAIN - ALL BUSINESSES
// ============================================================

async function getNearbyBusinesses(
  latitude,
  longitude,
  radiusInKm
) {

  const input =
    validateInput(
      latitude,
      longitude,
      radiusInKm
    );

  const {
    latitude: lat,
    longitude: lon,
    radiusInKm: radius,
  } = input;

  const radiusInMeters =
    Math.round(
      radius * 1000
    );

  const cacheKey =
    createCacheKey(
      lat,
      lon,
      radius,
      "all"
    );

  const cached =
    getCache(cacheKey);

  if (cached) {

    logInfo(
      `Returning cached result for ${cacheKey}`
    );

    return cached;
  }

  logInfo(
    `Searching OSM within ${radius} km (${radiusInMeters} meters)`
  );

  const query =
    buildQuery(
      lat,
      lon,
      radiusInMeters
    );

  let result;

  try {

    result =
      await fetchOverpassData(
        query
      );

  }

  catch (error) {

    const status =
      error.response?.status;

    if (status) {

      throw new Error(
        `Unable to retrieve OpenStreetMap data. All Overpass servers failed. Last HTTP status: ${status}.`
      );
    }

    throw new Error(
      `Unable to retrieve nearby businesses from OpenStreetMap: ${error.message}`
    );
  }

  const places =
    normalizeResults(
      result.elements
    );

  const dataQuality =
    calculateDataQuality(
      places
    );

  const categoryCounts =
    calculateCategoryCounts(
      places
    );

  const businessCategoryCounts =
    calculateBusinessCategoryCounts(
      places
    );

  places.dataQuality =
    dataQuality;

  places.rawCount =
    result.elements.length;

  places.normalizedCount =
    places.length;

  places.queryMetadata = {

    latitude: lat,

    longitude: lon,

    radiusKm: radius,

    radiusMeters: radiusInMeters,

    category: "all",

    source:
      "OpenStreetMap",

    provider:
      "Overpass API",

    endpoint:
      result.endpoint,

    attempts:
      result.attempt,

    retrievedAt:
      new Date().toISOString(),

    cached:
      false,

    categoryCounts,

    businessCategoryCounts,

    osmCompletenessWarning:
      "OSM data is crowdsourced and may not contain every real-world business.",
  };

  setCache(
    cacheKey,
    places
  );

  logInfo(
    `Final normalized places: ${places.length}`
  );

  logInfo(
    `Businesses: ${dataQuality.businesses}`
  );

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

  const input =
    validateInput(
      latitude,
      longitude,
      radiusInKm
    );

  const normalizedCategory =
    normalizeRequestedCategory(
      category
    );

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

  const radiusInMeters =
    Math.round(
      radius * 1000
    );

  const cacheKey =
    createCacheKey(
      lat,
      lon,
      radius,
      normalizedCategory
    );

  const cached =
    getCache(cacheKey);

  if (cached) {

    logInfo(
      `Returning cached ${normalizedCategory} results`
    );

    return cached;
  }

  const query =
    buildCategoryQuery(
      normalizedCategory,
      lat,
      lon,
      radiusInMeters
    );

  let result;

  try {

    result =
      await fetchOverpassData(
        query
      );

  }

  catch (error) {

    const status =
      error.response?.status;

    throw new Error(
      status
        ? `Unable to retrieve ${normalizedCategory} data. Overpass returned HTTP ${status} after fallback attempts.`
        : `Unable to retrieve ${normalizedCategory} data: ${error.message}`
    );
  }

  const places =
    normalizeResults(
      result.elements
    );

  const dataQuality =
    calculateDataQuality(
      places
    );

  const categoryCounts =
    calculateCategoryCounts(
      places
    );

  const businessCategoryCounts =
    calculateBusinessCategoryCounts(
      places
    );

  places.dataQuality =
    dataQuality;

  places.rawCount =
    result.elements.length;

  places.normalizedCount =
    places.length;

  places.queryMetadata = {

    latitude: lat,

    longitude: lon,

    radiusKm: radius,

    radiusMeters: radiusInMeters,

    category:
      normalizedCategory,

    source:
      "OpenStreetMap",

    provider:
      "Overpass API",

    endpoint:
      result.endpoint,

    attempts:
      result.attempt,

    retrievedAt:
      new Date().toISOString(),

    cached:
      false,

    categoryCounts,

    businessCategoryCounts,

    osmCompletenessWarning:
      "OSM data is crowdsourced and may not contain every real-world business.",
  };

  setCache(
    cacheKey,
    places
  );

  logInfo(
    `${normalizedCategory}: ${places.length} results`
  );

  return places;
}


// ============================================================
// SEARCH MULTIPLE CATEGORIES
// ============================================================
//
// Useful for BizLens analysis.
//
// Example:
//
// getNearbyBusinessesByCategories(
//   16.70,
//   74.24,
//   3,
//   ["restaurant", "cafe", "gym", "pharmacy"]
// )
//
// ============================================================

async function getNearbyBusinessesByCategories(
  latitude,
  longitude,
  radiusInKm,
  categories = []
) {

  if (
    !Array.isArray(categories) ||
    categories.length === 0
  ) {

    return getNearbyBusinesses(
      latitude,
      longitude,
      radiusInKm
    );
  }

  const uniqueCategories =
    [
      ...new Set(
        categories
          .map(
            normalizeRequestedCategory
          )
          .filter(Boolean)
      ),
    ];

  const results = [];

  for (
    const category of
    uniqueCategories
  ) {

    try {

      const places =
        await getNearbyBusinessesByCategory(
          latitude,
          longitude,
          radiusInKm,
          category
        );

      results.push(
        ...places
      );

    }

    catch (error) {

      logWarn(
        `Category "${category}" failed: ${error.message}`
      );

      // Continue other categories.
    }
  }

  const places =
    deduplicatePlaces(
      results
    );

  const dataQuality =
    calculateDataQuality(
      places
    );

  const categoryCounts =
    calculateCategoryCounts(
      places
    );

  const businessCategoryCounts =
    calculateBusinessCategoryCounts(
      places
    );

  places.dataQuality =
    dataQuality;

  places.rawCount =
    results.length;

  places.normalizedCount =
    places.length;

  places.queryMetadata = {

    latitude:
      Number(latitude),

    longitude:
      Number(longitude),

    radiusKm:
      Number(radiusInKm),

    categories:
      uniqueCategories,

    source:
      "OpenStreetMap",

    provider:
      "Overpass API",

    retrievedAt:
      new Date().toISOString(),

    categoryCounts,

    businessCategoryCounts,

    osmCompletenessWarning:
      "OSM data is crowdsourced and may not contain every real-world business.",
  };

  return places;
}


// ============================================================
// BUSINESS CATEGORY LIST
// ============================================================

function getSupportedCategories() {

  return Object.keys(
    CATEGORY_DEFINITIONS
  );
}


// ============================================================
// CACHE STATS
// ============================================================

function getCacheStats() {

  return {
    size:
      cache.size,

    maxEntries:
      MAX_CACHE_ENTRIES,

    ttlMs:
      CACHE_TTL_MS,
  };
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
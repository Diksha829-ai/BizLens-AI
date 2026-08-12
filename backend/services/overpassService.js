const axios = require("axios");

// ============================================================
// BizLens-AI
// ADVANCED OPENSTREETMAP / OVERPASS DATA SERVICE
// ============================================================
//
// Responsibilities:
// 1. Fetch OSM data from Overpass
// 2. Retry failed requests
// 3. Use fallback Overpass servers
// 4. Normalize OSM objects
// 5. Detect business / infrastructure objects
// 6. Preserve original OSM tags
// 7. Extract useful business metadata
// 8. Deduplicate OSM objects
// 9. Calculate data-quality statistics
//
// IMPORTANT:
// OSM does NOT contain every real-world business.
// Therefore:
// "No competitor found"
// does NOT automatically mean
// "No competitor exists in the real world."
// ============================================================


// ============================================================
// OVERPASS ENDPOINTS
// ============================================================

const OVERPASS_ENDPOINTS = [
  "https://overpass-api.de/api/interpreter",
  "https://overpass.kumi.systems/api/interpreter",
  "https://overpass.private.coffee/api/interpreter",
];


// ============================================================
// CONFIGURATION
// ============================================================

const REQUEST_TIMEOUT = 90000;
const MAX_RETRIES_PER_ENDPOINT = 2;
const RETRY_DELAY = 1500;

const USER_AGENT =
  "BizLens-AI/1.0 (Final Year Project; OpenStreetMap data analysis)";


// ============================================================
// STRING HELPERS
// ============================================================

function cleanString(value) {
  if (
    value === undefined ||
    value === null
  ) {
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


  // ==========================================================
  // PHARMACY
  // ==========================================================

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


  // ==========================================================
  // GYM
  // ==========================================================

  if (
    leisure === "fitness_centre" ||
    leisure === "sports_centre" ||
    sport === "fitness" ||
    sport === "gymnastics" ||
    sport === "bodybuilding" ||
    sport === "weightlifting" ||
    amenity === "gym"
  ) {
    return "gym";
  }


  // ==========================================================
  // CAFE
  // ==========================================================

  if (
    amenity === "cafe" ||
    shop === "coffee"
  ) {
    return "cafe";
  }


  // ==========================================================
  // RESTAURANT
  // ==========================================================

  if (
    amenity === "restaurant" ||
    amenity === "fast_food" ||
    amenity === "food_court"
  ) {
    return "restaurant";
  }


  // ==========================================================
  // SALON
  // ==========================================================

  if (
    shop === "hairdresser" ||
    shop === "beauty" ||
    shop === "cosmetics"
  ) {
    return "salon";
  }


  // ==========================================================
  // GROCERY
  // ==========================================================

  if (
    shop === "supermarket" ||
    shop === "convenience" ||
    shop === "grocery" ||
    shop === "greengrocer"
  ) {
    return "grocery";
  }


  // ==========================================================
  // CLOTHING
  // ==========================================================

  if (
    shop === "clothes" ||
    shop === "fashion" ||
    shop === "boutique"
  ) {
    return "clothing";
  }


  // ==========================================================
  // HOTEL
  // ==========================================================

  if (
    tourism === "hotel" ||
    tourism === "hostel" ||
    tourism === "guest_house" ||
    tourism === "motel"
  ) {
    return "hotel";
  }


  // ==========================================================
  // HOSPITAL
  // ==========================================================

  if (
    amenity === "hospital" ||
    healthcare === "hospital"
  ) {
    return "hospital";
  }


  // ==========================================================
  // CLINIC
  // ==========================================================

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


  // ==========================================================
  // SCHOOL
  // ==========================================================

  if (
    amenity === "school" ||
    amenity === "kindergarten"
  ) {
    return "school";
  }


  // ==========================================================
  // COLLEGE
  // ==========================================================

  if (
    amenity === "college"
  ) {
    return "college";
  }


  // ==========================================================
  // UNIVERSITY
  // ==========================================================

  if (
    amenity === "university"
  ) {
    return "university";
  }


  // ==========================================================
  // MARKET
  // ==========================================================

  if (
    amenity === "marketplace" ||
    shop === "market"
  ) {
    return "market";
  }


  // ==========================================================
  // PARK
  // ==========================================================

  if (
    leisure === "park" ||
    leisure === "garden" ||
    leisure === "nature_reserve"
  ) {
    return "park";
  }


  // ==========================================================
  // SPORTS
  // ==========================================================

  if (
    leisure === "sports_centre" ||
    leisure === "stadium" ||
    leisure === "pitch" ||
    leisure === "track" ||
    sport
  ) {
    return "sports";
  }


  // ==========================================================
  // OFFICE
  // ==========================================================

  if (
    office ||
    building === "office"
  ) {
    return "office";
  }


  // ==========================================================
  // TRANSPORT
  // ==========================================================

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


  // ==========================================================
  // SHOP
  // ==========================================================

  if (shop) {
    return "shop";
  }


  // ==========================================================
  // TOURISM
  // ==========================================================

  if (tourism) {
    return "tourism";
  }


  // ==========================================================
  // RESIDENTIAL
  // ==========================================================

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


  // ==========================================================
  // ROAD
  // ==========================================================

  if (highway) {
    return "road";
  }


  // ==========================================================
  // BUILDING
  // ==========================================================

  if (building) {
    return "building";
  }


  // ==========================================================
  // LANDUSE
  // ==========================================================

  if (landuse) {
    return "landuse";
  }


  // ==========================================================
  // CRAFT
  // ==========================================================

  if (craft) {
    return "craft";
  }


  // ==========================================================
  // RAILWAY
  // ==========================================================

  if (railway) {
    return "railway";
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


  if (shop) {
    return true;
  }

  if (office) {
    return true;
  }

  if (craft) {
    return true;
  }

  if (tourism) {
    return true;
  }

  if (healthcare) {
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
      "fuel",
      "marketplace",
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
// INFRASTRUCTURE DETECTION
// ============================================================

function isInfrastructure(tags = {}) {

  const highway = cleanString(tags.highway);
  const building = cleanString(tags.building);
  const railway = cleanString(tags.railway);
  const landuse = cleanString(tags.landuse);


  if (highway) {
    return true;
  }

  if (railway) {
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


  if (landuse) {
    return true;
  }


  return false;
}


// ============================================================
// OBJECT TYPE
// ============================================================

function determineObjectType(
  tags = {}
) {

  const highway = cleanString(tags.highway);
  const railway = cleanString(tags.railway);
  const building = cleanString(tags.building);
  const landuse = cleanString(tags.landuse);


  if (isBusiness(tags)) {
    return "business";
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


  return "place";
}


// ============================================================
// ADDRESS EXTRACTION
// ============================================================

function extractAddress(tags = {}) {

  const parts = [];


  if (tags["addr:housenumber"]) {
    parts.push(
      tags["addr:housenumber"]
    );
  }


  if (tags["addr:street"]) {
    parts.push(
      tags["addr:street"]
    );
  }


  if (tags["addr:suburb"]) {
    parts.push(
      tags["addr:suburb"]
    );
  }


  if (tags["addr:city"]) {
    parts.push(
      tags["addr:city"]
    );
  }


  if (tags["addr:postcode"]) {
    parts.push(
      tags["addr:postcode"]
    );
  }


  if (parts.length > 0) {
    return parts.join(", ");
  }


  return (
    tags["addr:full"] ||
    null
  );
}


// ============================================================
// NORMALIZE OSM ELEMENT
// ============================================================

function normalizeElement(
  element
) {

  const tags =
    element.tags || {};


  const latitude =
    element.lat ??
    element.center?.lat ??
    null;


  const longitude =
    element.lon ??
    element.center?.lon ??
    null;


  if (
    latitude === null ||
    longitude === null
  ) {
    return null;
  }


  const businessType =
    normalizeBusinessType(tags);


  return {

    // OSM identity
    id:
      `${element.type}/${element.id}`,

    osmId:
      element.id,

    osmType:
      element.type,


    // Coordinates
    latitude:
      Number(latitude),

    longitude:
      Number(longitude),


    // Name
    name:
      tags.name ||
      tags["name:en"] ||
      tags["name:local"] ||
      "Unnamed place",


    // Classification
    category:
      businessType,

    businessType,

    objectType:
      determineObjectType(tags),


    // Flags
    isBusiness:
      isBusiness(tags),

    isInfrastructure:
      isInfrastructure(tags),


    // Raw categories
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


    // Address
    address:
      extractAddress(tags),

    street:
      tags["addr:street"] || null,

    city:
      tags["addr:city"] || null,

    postcode:
      tags["addr:postcode"] || null,


    // Contact
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


    // Business attributes
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


    // Preserve all OSM tags
    tags,
  };
}


// ============================================================
// DEDUPLICATION
// ============================================================

function deduplicatePlaces(
  places = []
) {

  const unique =
    new Map();


  for (
    const place of places
  ) {

    if (!place) {
      continue;
    }


    const key =
      place.id;


    if (
      !unique.has(key)
    ) {
      unique.set(
        key,
        place
      );
    }
  }


  return Array.from(
    unique.values()
  );
}


// ============================================================
// DATA QUALITY
// ============================================================

function calculateDataQuality(
  places = []
) {

  const total =
    places.length;


  const businesses =
    places.filter(
      place =>
        place.isBusiness
    ).length;


  const named =
    places.filter(
      place =>
        place.name &&
        place.name !==
          "Unnamed place"
    ).length;


  const coordinates =
    places.filter(
      place =>
        Number.isFinite(
          place.latitude
        ) &&
        Number.isFinite(
          place.longitude
        )
    ).length;


  const buildings =
    places.filter(
      place =>
        place.objectType ===
        "building"
    ).length;


  const roads =
    places.filter(
      place =>
        place.objectType ===
        "road"
    ).length;


  const railways =
    places.filter(
      place =>
        place.objectType ===
        "railway"
    ).length;


  const landuse =
    places.filter(
      place =>
        place.objectType ===
        "landuse"
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
            category !==
            "unknown"
        )
    );


  let level =
    "Very Low";


  if (total >= 500) {
    level = "High";
  } else if (total >= 250) {
    level = "Good";
  } else if (total >= 100) {
    level = "Moderate";
  } else if (total >= 25) {
    level = "Low";
  }


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

    normalizedCategories:
      categories.size,

    buildings,

    roads,

    railways,

    landuse,

    level,

    recordCompleteness:
      total > 0
        ? 100
        : 0,
  };
}


// ============================================================
// BUILD OVERPASS QUERY
// ============================================================

function buildQuery(
  latitude,
  longitude,
  radiusInMeters
) {

  return `
[out:json][timeout:90];

(
  nwr["shop"](
    around:${radiusInMeters},
    ${latitude},
    ${longitude}
  );

  nwr["amenity"](
    around:${radiusInMeters},
    ${latitude},
    ${longitude}
  );

  nwr["healthcare"](
    around:${radiusInMeters},
    ${latitude},
    ${longitude}
  );

  nwr["office"](
    around:${radiusInMeters},
    ${latitude},
    ${longitude}
  );

  nwr["craft"](
    around:${radiusInMeters},
    ${latitude},
    ${longitude}
  );

  nwr["tourism"](
    around:${radiusInMeters},
    ${latitude},
    ${longitude}
  );

  nwr["leisure"](
    around:${radiusInMeters},
    ${latitude},
    ${longitude}
  );

  nwr["sport"](
    around:${radiusInMeters},
    ${latitude},
    ${longitude}
  );

  nwr["building"](
    around:${radiusInMeters},
    ${latitude},
    ${longitude}
  );

  nwr["highway"](
    around:${radiusInMeters},
    ${latitude},
    ${longitude}
  );

  nwr["railway"](
    around:${radiusInMeters},
    ${latitude},
    ${longitude}
  );

  nwr["landuse"](
    around:${radiusInMeters},
    ${latitude},
    ${longitude}
  );
);

out center tags;
`;
}


// ============================================================
// REQUEST OVERPASS
// ============================================================

async function requestOverpass(
  endpoint,
  query
) {

  const response =
    await axios.get(
      endpoint,
      {
        params: {
          data: query,
        },

        timeout:
          REQUEST_TIMEOUT,

        headers: {
          Accept:
            "application/json",

          "User-Agent":
            USER_AGENT,
        },
      }
    );


  return (
    response.data?.elements ||
    []
  );
}


// ============================================================
// DELAY
// ============================================================

function sleep(
  milliseconds
) {

  return new Promise(
    resolve =>
      setTimeout(
        resolve,
        milliseconds
      )
  );
}


// ============================================================
// MAIN FUNCTION
// ============================================================

async function getNearbyBusinesses(
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


  // ==========================================================
  // VALIDATION
  // ==========================================================

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
    radius > 10
  ) {
    throw new Error(
      "Radius must be greater than 0 and less than or equal to 10 km."
    );
  }


  const radiusInMeters =
    Math.round(
      radius * 1000
    );


  console.log(
    `Searching OSM within ${radius} km (${radiusInMeters} meters)...`
  );


  const query =
    buildQuery(
      lat,
      lon,
      radiusInMeters
    );


  let rawElements =
    null;


  let lastError =
    null;


  // ==========================================================
  // ENDPOINT RETRIES
  // ==========================================================

  for (
    const endpoint of
      OVERPASS_ENDPOINTS
  ) {

    for (
      let attempt = 1;
      attempt <=
        MAX_RETRIES_PER_ENDPOINT;
      attempt++
    ) {

      try {

        console.log(
          `Overpass endpoint: ${endpoint}`
        );

        console.log(
          `Attempt: ${attempt}/${MAX_RETRIES_PER_ENDPOINT}`
        );


        rawElements =
          await requestOverpass(
            endpoint,
            query
          );


        if (
          Array.isArray(
            rawElements
          )
        ) {

          console.log(
            `Overpass returned ${rawElements.length} raw objects.`
          );

          break;
        }

      } catch (
        error
      ) {

        lastError =
          error;


        console.error(
          "Overpass request failed."
        );


        if (
          error.response
        ) {

          console.error(
            "Status:",
            error.response.status
          );

        } else {

          console.error(
            "Code:",
            error.code
          );

        }


        if (
          attempt <
          MAX_RETRIES_PER_ENDPOINT
        ) {

          await sleep(
            RETRY_DELAY *
            attempt
          );
        }
      }
    }


    if (
      Array.isArray(
        rawElements
      )
    ) {
      break;
    }
  }


  // ==========================================================
  // FAILURE
  // ==========================================================

  if (
    !Array.isArray(
      rawElements
    )
  ) {

    const status =
      lastError?.response?.status;


    if (status) {

      throw new Error(
        `Unable to retrieve OpenStreetMap data. Overpass returned HTTP ${status}.`
      );

    }


    throw new Error(
      "Unable to retrieve nearby businesses from OpenStreetMap."
    );
  }


  // ==========================================================
  // NORMALIZATION
  // ==========================================================

  const normalized =
    rawElements
      .map(
        normalizeElement
      )
      .filter(
        Boolean
      );


  // ==========================================================
  // DEDUPLICATION
  // ==========================================================

  const places =
    deduplicatePlaces(
      normalized
    );


  // ==========================================================
  // DATA QUALITY
  // ==========================================================

  const dataQuality =
    calculateDataQuality(
      places
    );


  console.log(
    `Normalized places: ${places.length}`
  );

  console.log(
    `Businesses: ${dataQuality.businesses}`
  );

  console.log(
    `Named places: ${dataQuality.namedPlaces}`
  );

  console.log(
    `Buildings: ${dataQuality.buildings}`
  );

  console.log(
    `Roads: ${dataQuality.roads}`
  );

  console.log(
    `Railways: ${dataQuality.railways}`
  );

  console.log(
    `Landuse: ${dataQuality.landuse}`
  );

  console.log(
    `Normalized categories: ${dataQuality.normalizedCategories}`
  );

  console.log(
    `OSM record coverage: ${dataQuality.level}`
  );


  // ==========================================================
  // BACKWARD COMPATIBILITY
  // ==========================================================

  places.dataQuality =
    dataQuality;


  places.rawCount =
    rawElements.length;


  places.normalizedCount =
    places.length;


  return places;
}


// ============================================================
// EXPORTS
// ============================================================

module.exports = {

  getNearbyBusinesses,

  normalizeBusinessType,

  isBusiness,

  isInfrastructure,

  calculateDataQuality,

};
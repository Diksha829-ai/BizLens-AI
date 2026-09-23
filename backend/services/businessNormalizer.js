// ============================================================
// businessNormalizer.js
// Normalize raw business/location data into a common structure
// ============================================================

// ------------------------------------------------------------
// SAFE NUMBER
// ------------------------------------------------------------

function safeNumber(value, fallback = 0) {
  const number = Number(value);

  return Number.isFinite(number)
    ? number
    : fallback;
}


// ------------------------------------------------------------
// NORMALIZE TEXT
// ------------------------------------------------------------

function normalizeText(value, fallback = "") {
  if (value === null || value === undefined) {
    return fallback;
  }

  return String(value)
    .trim()
    .replace(/\s+/g, " ");
}


// ------------------------------------------------------------
// NORMALIZE CATEGORY
// ------------------------------------------------------------

function normalizeCategory(category) {
  const value = normalizeText(category, "unknown")
    .toLowerCase();

  const categoryMap = {
    restaurant: "restaurant",
    restaurants: "restaurant",
    cafe: "cafe",
    coffee_shop: "cafe",
    coffee: "cafe",

    gym: "gym",
    fitness: "gym",
    fitness_centre: "gym",
    fitness_center: "gym",

    pharmacy: "pharmacy",
    medical_store: "pharmacy",
    chemist: "pharmacy",

    salon: "salon",
    beauty_salon: "salon",
    hair_salon: "salon",

    grocery: "grocery",
    supermarket: "grocery",
    grocery_store: "grocery",

    clothing: "clothing",
    clothes: "clothing",
    clothing_store: "clothing",

    hotel: "hotel",
    hotels: "hotel",

    hospital: "hospital",
    clinic: "clinic",

    school: "education",
    college: "education",
    university: "education",

    office: "offices",
    offices: "offices",

    mall: "shopping",
    shopping_mall: "shopping",

    bus_stop: "transport",
    bus_station: "transport",
    railway_station: "transport",
    train_station: "transport",

    tourist_attraction: "tourism",
    attraction: "tourism",

    park: "parks",
    sports_centre: "sports",
    sports_center: "sports",

    market: "markets"
  };

  return categoryMap[value] || value;
}


// ------------------------------------------------------------
// NORMALIZE SOURCE
// ------------------------------------------------------------

function normalizeSource(source) {
  const value = normalizeText(source, "unknown")
    .toLowerCase();

  if (
    value.includes("openstreetmap") ||
    value === "osm"
  ) {
    return "osm";
  }

  if (
    value.includes("google")
  ) {
    return "google";
  }

  if (
    value.includes("foursquare")
  ) {
    return "foursquare";
  }

  if (
    value.includes("geoapify")
  ) {
    return "geoapify";
  }

  if (
    value.includes("government")
  ) {
    return "government";
  }

  return value;
}


// ------------------------------------------------------------
// NORMALIZE COORDINATES
// ------------------------------------------------------------

function normalizeCoordinates(business) {
  const latitude = safeNumber(
    business.latitude ??
    business.lat ??
    business.location?.lat ??
    business.geometry?.coordinates?.[1],
    null
  );

  const longitude = safeNumber(
    business.longitude ??
    business.lng ??
    business.lon ??
    business.location?.lng ??
    business.geometry?.coordinates?.[0],
    null
  );

  return {
    latitude,
    longitude
  };
}


// ------------------------------------------------------------
// NORMALIZE ADDRESS
// ------------------------------------------------------------

function normalizeAddress(business) {
  const address =
    business.address ||
    business.display_name ||
    business.location?.address ||
    "";

  return normalizeText(address);
}


// ------------------------------------------------------------
// NORMALIZE BUSINESS
// ------------------------------------------------------------

function normalizeBusiness(business = {}) {
  const coordinates =
    normalizeCoordinates(business);

  return {
    id:
      normalizeText(
        business.id ??
        business.place_id ??
        business.osm_id ??
        ""
      ),

    name:
      normalizeText(
        business.name ??
        business.display_name ??
        "Unknown Business"
      ),

    category:
      normalizeCategory(
        business.category ??
        business.type ??
        business.shop ??
        business.amenity ??
        "unknown"
      ),

    subcategory:
      normalizeText(
        business.subcategory ??
        business.subCategory ??
        business.type ??
        ""
      ),

    latitude:
      coordinates.latitude,

    longitude:
      coordinates.longitude,

    address:
      normalizeAddress(business),

    source:
      normalizeSource(
        business.source ??
        "unknown"
      ),

    rating:
      safeNumber(
        business.rating ??
        business.stars,
        null
      ),

    reviewCount:
      safeNumber(
        business.reviewCount ??
        business.reviews ??
        business.user_ratings_total,
        0
      ),

    phone:
      normalizeText(
        business.phone ??
        business.contact?.phone ??
        ""
      ),

    website:
      normalizeText(
        business.website ??
        business.url ??
        ""
      ),

    openingHours:
      business.openingHours ??
      business.opening_hours ??
      null,

    distanceKm:
      safeNumber(
        business.distanceKm ??
        business.distance,
        null
      ),

    isMapped:
      coordinates.latitude !== null &&
      coordinates.longitude !== null,

    raw:
      business
  };
}


// ------------------------------------------------------------
// NORMALIZE BUSINESS ARRAY
// ------------------------------------------------------------

function normalizeBusinesses(businesses = []) {
  if (!Array.isArray(businesses)) {
    return [];
  }

  return businesses
    .filter(
      business =>
        business &&
        typeof business === "object"
    )
    .map(normalizeBusiness);
}


// ------------------------------------------------------------
// REMOVE DUPLICATES
// ------------------------------------------------------------

function removeDuplicateBusinesses(
  businesses = []
) {
  const unique = new Map();

  businesses.forEach(
    business => {

      const name =
        normalizeText(
          business.name
        ).toLowerCase();

      const lat =
        safeNumber(
          business.latitude,
          0
        ).toFixed(5);

      const lng =
        safeNumber(
          business.longitude,
          0
        ).toFixed(5);

      const key =
        `${name}_${lat}_${lng}`;

      if (!unique.has(key)) {
        unique.set(
          key,
          business
        );
      }
    }
  );

  return Array.from(
    unique.values()
  );
}


// ------------------------------------------------------------
// FILTER BY CATEGORY
// ------------------------------------------------------------

function filterByCategory(
  businesses = [],
  category
) {
  const normalized =
    normalizeCategory(category);

  return businesses.filter(
    business =>
      normalizeCategory(
        business.category
      ) === normalized
  );
}


// ------------------------------------------------------------
// EXPORT
// ------------------------------------------------------------

module.exports = {
  safeNumber,
  normalizeText,
  normalizeCategory,
  normalizeSource,
  normalizeCoordinates,
  normalizeAddress,
  normalizeBusiness,
  normalizeBusinesses,
  removeDuplicateBusinesses,
  filterByCategory
};
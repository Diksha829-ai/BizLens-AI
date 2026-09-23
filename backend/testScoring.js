const {
  calculateBusinessAnalysis,
} = require("./services/scoringService");


// ============================================================
// TEST 1 — GOOD GYM LOCATION
// ============================================================

const goodLocation = calculateBusinessAnalysis({

  category: "gym",

  competition: {
    count: 2,
    density: 0.5,
    within500m: 0,
    within1km: 1,
    within2km: 2,
    nearestDistance: 1.2,
  },

  demand: {
    education: 8,
    offices: 15,
    hospitals: 2,
    clinics: 4,
    pharmacies: 3,
    shopping: 8,
    transport: 6,
    tourism: 2,
    residential: 20,
    sports: 5,
    food: 10,
    entertainment: 5,
  },

  accessibility: {
    transport: 6,
    roads: 20,
    parking: 5,
    walkable: 8,
    crossings: 4,
    cycleways: 3,
  },

  locationIndicators: {
    parks: 3,
    sportsFacilities: 4,
    markets: 2,
    malls: 1,
    hospitals: 2,
  },

  demographics: {
    population: 30000,
    populationDensity: 9000,
    incomeIndex: 75,
  },

  footTraffic: {
    pedestrianCount: 1500,
    trafficIndex: 70,
    crowdDensity: 50,
  },

  totalPlaces: 500,

  businessCount: 100,

});


// ============================================================
// DISPLAY TEST 1
// ============================================================

console.log("\n=================================");
console.log("GOOD LOCATION TEST");
console.log("=================================");

console.log(
  "Success Score:",
  goodLocation.successScore
);

console.log(
  "Success Level:",
  goodLocation.successLevel
);

console.log(
  "Demand Score:",
  goodLocation.demandScore
);

console.log(
  "Competition Score:",
  goodLocation.competitionScore
);

console.log(
  "Accessibility Score:",
  goodLocation.accessibilityScore
);

console.log(
  "Location Attractiveness:",
  goodLocation.locationAttractiveness
);

console.log(
  "Foot Traffic Score:",
  goodLocation.footTrafficScore
);

console.log(
  "Demographic Score:",
  goodLocation.demographicScore
);

console.log(
  "Risk Score:",
  goodLocation.riskScore
);

console.log(
  "Confidence:",
  goodLocation.confidence
);

console.log(
  "Confidence Score:",
  goodLocation.confidenceScore
);

console.log(
  "Recommendations:",
  goodLocation.recommendations
);

// ============================================================
// TEST 2 — BAD LOCATION
// ============================================================

const badLocation = calculateBusinessAnalysis({

  category: "gym",

  competition: {
    count: 15,
    density: 5,
    within500m: 5,
    within1km: 8,
    within2km: 15,
    nearestDistance: 0.2,
  },

  demand: {
    education: 0,
    offices: 1,
    hospitals: 0,
    clinics: 0,
    pharmacies: 0,
    shopping: 1,
    transport: 0,
    tourism: 0,
    residential: 1,
    sports: 0,
    food: 1,
    entertainment: 0,
  },

  accessibility: {
    transport: 0,
    roads: 2,
    parking: 0,
    walkable: 1,
    crossings: 0,
    cycleways: 0,
  },

  locationIndicators: {
    parks: 0,
    sportsFacilities: 0,
    markets: 0,
    malls: 0,
    hospitals: 0,
  },

  demographics: {
    population: 1000,
    populationDensity: 200,
    incomeIndex: 20,
  },

  footTraffic: {
    pedestrianCount: 50,
    trafficIndex: 10,
    crowdDensity: 5,
  },

  totalPlaces: 50,

  businessCount: 10,

});


console.log("\n=================================");
console.log("BAD LOCATION TEST");
console.log("=================================");

console.log(
  "Success Score:",
  badLocation.successScore
);

console.log(
  "Success Level:",
  badLocation.successLevel
);

console.log(
  "Demand Score:",
  badLocation.demandScore
);

console.log(
  "Competition Score:",
  badLocation.competitionScore
);

console.log(
  "Accessibility Score:",
  badLocation.accessibilityScore
);

console.log(
  "Risk Score:",
  badLocation.riskScore
);

console.log(
  "Confidence:",
  badLocation.confidence
);
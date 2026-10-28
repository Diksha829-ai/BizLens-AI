
const dns = require("dns");

dns.setServers(["8.8.8.8", "8.8.4.4"]);

const express = require("express");
const dotenv = require("dotenv");
const cors = require("cors");
// const dns = require("dns");

// // ============================================================
// // FIX DNS RESOLUTION FOR MONGODB ATLAS SRV LOOKUPS
// // ============================================================
// dns.setDefaultResultOrder("ipv4first");
// dns.setServers(["8.8.8.8", "8.8.4.4"]);

const connectDB = require("./config/db");

const authRoutes = require("./routes/authRoutes");
const analysisRoutes = require("./routes/analysisRoutes");

// NEW: AI chatbot routes


// ============================================================
// LOAD ENVIRONMENT VARIABLES
// ============================================================

dotenv.config();

// ============================================================
// CONNECT TO MONGODB
// ============================================================

connectDB();

// ============================================================
// CREATE EXPRESS APP
// ============================================================

const app = express();

// ============================================================
// CORS
// ============================================================

const allowedOrigins = [
  "http://localhost:5173",
  "http://127.0.0.1:5173",
  "https://biz-lens-ai-mu.vercel.app",
  "https://biz-lens-php5pa960-dikshas-projects-9dcd04f3.vercel.app"
];

app.use(
  cors({
    origin: function (origin, callback) {
      if (!origin || allowedOrigins.includes(origin)) {
        return callback(null, true);
      }

      console.error("CORS blocked origin:", origin);

      return callback(
        new Error("Origin not allowed by CORS")
      );
    },

    methods: [
      "GET",
      "POST",
      "PUT",
      "PATCH",
      "DELETE",
      "OPTIONS",
    ],

    allowedHeaders: [
      "Content-Type",
      "Authorization",
    ],
  })
);

// ============================================================
// BODY PARSER
// ============================================================

app.use(
  express.json()
);

// ============================================================
// REQUEST LOGGER
// ============================================================

app.use(
  (req, res, next) => {
    console.log(
      `${req.method} ${req.originalUrl}`
    );

    next();
  }
);

// ============================================================
// AUTHENTICATION ROUTES
// ============================================================

app.use(
  "/api/auth",
  authRoutes
);

// ============================================================
// ANALYSIS ROUTES
// ============================================================

app.use(
  "/api/analysis",
  analysisRoutes
);

// ============================================================
// AI CHATBOT ROUTES — NEW
// ============================================================


// ============================================================
// HOME ROUTE
// ============================================================

app.get(
  "/",
  (req, res) => {
    res.json({
      message:
        "BizLens-AI Backend is running",
    });
  }
);

/* TEMPORARY OVERPASS CONNECTIVITY TEST */
app.get("/api/debug/overpass", async (req, res) => {
  // Simple shared-secret protection. Set this in Render Environment.
  const debugKey = process.env.OVERPASS_DEBUG_KEY;

  if (!debugKey || req.query.key !== debugKey) {
    return res.status(404).json({
      success: false,
      message: "Not found"
    });
  }

  const query = `[out:json][timeout:25];
nwr["amenity"="restaurant"](around:2000,16.7120318,74.2450472);
out center tags;`;

  const endpoints = [
    "https://overpass.private.coffee/api/interpreter",
    "https://maps.mail.ru/osm/tools/overpass/api/interpreter",
    "https://lz4.overpass-api.de/api/interpreter"
  ];

  const results = [];

  for (const endpoint of endpoints) {
    const started = Date.now();

    try {
      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          "User-Agent": "BizLensAI/1.0"
        },
        body: new URLSearchParams({ data: query }),
        signal: AbortSignal.timeout(30000)
      });

      const body = await response.text();

      results.push({
        endpoint,
        status: response.status,
        elapsedMs: Date.now() - started,
        preview: body.slice(0, 300)
      });

      if (response.ok) {
        let elementCount = null;

        try {
          elementCount = JSON.parse(body).elements?.length ?? null;
        } catch {}

        return res.json({
          success: true,
          workingEndpoint: endpoint,
          elementCount,
          results
        });
      }
    } catch (error) {
      results.push({
        endpoint,
        error: error.name,
        message: error.message,
        elapsedMs: Date.now() - started
      });
    }
  }

  return res.status(502).json({
    success: false,
    message: "All tested Overpass endpoints failed",
    results
  });
});

// ============================================================
// 404 ROUTE
// ============================================================

app.use(
  (req, res) => {
    res.status(404).json({
      success: false,
      message:
        "API route not found",
    });
  }
);

// ============================================================
// ERROR HANDLER
// ============================================================

app.use(
  (error, req, res, next) => {
    console.error(
      "Server error:",
      error
    );

    res.status(500).json({
      success: false,
      message:
        error.message ||
        "Internal server error",
    });
  }
);

// ============================================================
// START SERVER
// ============================================================

const PORT =
  process.env.PORT || 5000;

app.listen(
  PORT,
  () => {
    console.log(
      `Server running on port ${PORT}`
    );
  }
);

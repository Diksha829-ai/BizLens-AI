const express = require("express");
const dotenv = require("dotenv");
const cors = require("cors");

const connectDB = require("./config/db");

const authRoutes = require("./routes/authRoutes");
const analysisRoutes = require("./routes/analysisRoutes");

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

app.use(
  cors({
    origin: [
      "http://localhost:5173",
      "http://127.0.0.1:5173",
    ],

    methods: [
      "GET",
      "POST",
      "PUT",
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
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import {
  MapContainer,
  TileLayer,
  Marker,
  Circle,
  Popup,
  useMap,
} from "react-leaflet";

import "leaflet/dist/leaflet.css";
import L from "leaflet";

import "../styles/variables.css";
import "../styles/components.css";
import "../styles/analysis.css";

// ============================================================
// FIX LEAFLET MARKER ICON
// ============================================================

delete L.Icon.Default.prototype._getIconUrl;

L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png",

  iconUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png",

  shadowUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
});

// ============================================================
// MAP UPDATER
// ============================================================

function MapUpdater({ latitude, longitude }) {
  const map = useMap();

  useEffect(() => {
    if (latitude !== null && longitude !== null) {
      map.setView([latitude, longitude], 14);
    }
  }, [latitude, longitude, map]);

  return null;
}

// ============================================================
// CATEGORY NAMES
// ============================================================

const CATEGORY_NAMES = {
  cafe: "Cafe",
  restaurant: "Restaurant",
  gym: "Gym",
  pharmacy: "Medical Store",
  salon: "Salon",
  grocery: "Grocery Store",
  clothing: "Clothing Store",
};

// ============================================================
// ANALYSIS COMPONENT
// ============================================================

function Analysis() {
  const navigate = useNavigate();

  // ==========================================================
  // LOCATION
  // ==========================================================

  const [latitude, setLatitude] = useState(null);
  const [longitude, setLongitude] = useState(null);
  const [address, setAddress] = useState("");

  // ==========================================================
  // BUSINESS
  // ==========================================================

  const [radius, setRadius] = useState(3);
  const [category, setCategory] = useState(null);

  // ==========================================================
  // ANALYSIS
  // ==========================================================

  const [analysisData, setAnalysisData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // ==========================================================
  // LOAD SAVED DATA
  // ==========================================================

  useEffect(() => {
    try {
      const savedLocation =
        localStorage.getItem("selectedLocation");

      const savedCategory =
        localStorage.getItem("selectedCategory");

      const savedRadius =
        localStorage.getItem("analysisRadius");

      console.log("======================================");
      console.log("Analysis Page - Loading Data");
      console.log("Selected Location:", savedLocation);
      console.log("Selected Category:", savedCategory);
      console.log("Selected Radius:", savedRadius);
      console.log("======================================");

      // ------------------------------------------------------
      // LOCATION
      // ------------------------------------------------------

      if (!savedLocation) {
        setError(
          "No location selected. Please go back and select a location."
        );
        return;
      }

      const location = JSON.parse(savedLocation);

      const selectedLatitude = Number(location.latitude);
      const selectedLongitude = Number(location.longitude);

      if (
        Number.isNaN(selectedLatitude) ||
        Number.isNaN(selectedLongitude)
      ) {
        setError(
          "Selected location coordinates are invalid."
        );
        return;
      }

      setLatitude(selectedLatitude);
      setLongitude(selectedLongitude);

      setAddress(
        location.address ||
          location.displayName ||
          location.name ||
          "Selected Location"
      );

      // ------------------------------------------------------
      // CATEGORY
      // ------------------------------------------------------

      if (!savedCategory) {
        setError(
          "No business category selected. Please go back and select a business category."
        );
        return;
      }

      setCategory(savedCategory);

      // ------------------------------------------------------
      // RADIUS
      // ------------------------------------------------------

      if (savedRadius) {
        const parsedRadius = Number(savedRadius);

        if (!Number.isNaN(parsedRadius)) {
          setRadius(parsedRadius);
        }
      }
    } catch (error) {
      console.error(
        "Error loading analysis data:",
        error
      );

      setError(
        "Unable to load the selected analysis information."
      );
    }
  }, []);

  // ==========================================================
  // ANALYZE LOCATION
  // ==========================================================

  const handleAnalysis = async (event) => {
    event.preventDefault();

    setError("");
    setAnalysisData(null);

    // ------------------------------------------------------
    // VALIDATE LOCATION
    // ------------------------------------------------------

    if (
      latitude === null ||
      longitude === null
    ) {
      setError("Please select a location first.");
      return;
    }

    // ------------------------------------------------------
    // VALIDATE CATEGORY
    // ------------------------------------------------------

    if (!category) {
      setError(
        "Business category is missing. Please go back and select a business category."
      );
      return;
    }

    // ------------------------------------------------------
    // TOKEN
    // ------------------------------------------------------

    const token = localStorage.getItem("token");

    if (!token) {
      setError(
        "Your login session has expired. Please login again."
      );

      navigate("/login");
      return;
    }

    setLoading(true);

    try {
      console.log("======================================");
      console.log("BizLens-AI Location Analysis");
      console.log("======================================");

      console.log("Latitude:", latitude);
      console.log("Longitude:", longitude);
      console.log("Address:", address);
      console.log("Radius:", radius);
      console.log("Category:", category);

      // ------------------------------------------------------
      // API REQUEST
      // ------------------------------------------------------

      const response = await fetch(
        "http://localhost:5000/api/analysis",
        {
          method: "POST",

          headers: {
            "Content-Type": "application/json",

            Authorization: `Bearer ${token}`,
          },

          body: JSON.stringify({
            latitude: Number(latitude),
            longitude: Number(longitude),
            radius: Number(radius),
            category: category,
          }),
        }
      );

      const data = await response.json();

      console.log(
        "Analysis response:",
        data
      );

      // ------------------------------------------------------
      // JWT EXPIRED
      // ------------------------------------------------------

      if (
        response.status === 401 ||
        response.status === 403
      ) {
        localStorage.removeItem("token");
        localStorage.removeItem("user");

        setError(
          "Your login session has expired. Please login again."
        );

        navigate("/login");
        return;
      }

      // ------------------------------------------------------
      // API ERROR
      // ------------------------------------------------------

      if (!response.ok) {
        throw new Error(
          data.message ||
            "Location analysis failed."
        );
      }

      // ------------------------------------------------------
      // SAVE RESULT
      // ------------------------------------------------------

      setAnalysisData(data.data);

      localStorage.setItem(
        "analysisResult",
        JSON.stringify(data.data)
      );

      console.log(
        "Analysis result saved."
      );
    } catch (error) {
      console.error(
        "Analysis error:",
        error
      );

      setError(
        error.message ||
          "Unable to connect to the backend."
      );
    } finally {
      setLoading(false);
    }
  };

  // ==========================================================
  // NO LOCATION / CATEGORY
  // ==========================================================

  if (
    latitude === null ||
    longitude === null ||
    category === null
  ) {
    return (
      <div className="analysis-error-page">

        <div className="analysis-error-card">

          <div className="analysis-brand">
            <div className="analysis-logo">
              B
            </div>

            <div>
              <strong>
                BizLens
              </strong>

              <span>
                AI
              </span>
            </div>
          </div>

          <div className="error-icon">
            ⚠️
          </div>

          <h1>
            Analysis Information Missing
          </h1>

          <p>
            {error ||
              "Loading selected analysis information..."}
          </p>

          <button
            type="button"
            onClick={() =>
              navigate("/dashboard")
            }
            className="analysis-primary-button"
          >
            ← Back to Dashboard
          </button>

        </div>

      </div>
    );
  }

  // ==========================================================
  // RESULT VALUES
  // ==========================================================

  const businessSuccess =
    analysisData?.businessSuccess;

  const demand =
    analysisData?.demand;

  const competitors =
    analysisData?.competitors;

  const accessibility =
    analysisData?.accessibility;

  const risk =
    analysisData?.risk;

  const categoryDisplay =
    CATEGORY_NAMES[category] ||
    category;

  // ==========================================================
  // RENDER
  // ==========================================================

  return (
    <div className="analysis-page">

      {/* ====================================================
          TOP HEADER
      ==================================================== */}

      <header className="analysis-header">

        <div className="analysis-header-inner">

          <div className="analysis-brand">

            <div className="analysis-logo">
              B
            </div>

            <div className="analysis-brand-text">

              <strong>
                BizLens
              </strong>

              <span>
                AI
              </span>

            </div>

          </div>

          <div className="analysis-header-center">

            <span>
              BUSINESS LOCATION INTELLIGENCE
            </span>

            <h1>
              Location Analysis
            </h1>

          </div>

          <button
            type="button"
            className="back-dashboard-button"
            onClick={() =>
              navigate("/dashboard")
            }
          >
            ← Dashboard
          </button>

        </div>

      </header>


      {/* ====================================================
          MAIN
      ==================================================== */}

      <main className="analysis-main">

        {/* ==================================================
            PAGE INTRO
        ================================================== */}

        <section className="analysis-intro">

          <div>

            <span className="analysis-page-badge">
              ✨ AI-Powered Analysis
            </span>

            <h2>
              Business Location Intelligence
            </h2>

            <p>
              Evaluate the potential of your selected
              location using competition, demand,
              accessibility and risk indicators.
            </p>

          </div>

          <div className="analysis-status">

            <span className="status-dot"></span>

            Ready for Analysis

          </div>

        </section>


        {/* ==================================================
            LOCATION SUMMARY
        ================================================== */}

        <section className="location-summary-card">

          <div className="location-summary-top">

            <div>

              <span className="section-label">
                SELECTED LOCATION
              </span>

              <h2>
                📍 {address}
              </h2>

            </div>

            <div className="category-pill">
              🏪 {categoryDisplay}
            </div>

          </div>

          <div className="location-meta">

            <div className="location-meta-item">

              <span>
                Latitude
              </span>

              <strong>
                {latitude.toFixed(6)}
              </strong>

            </div>

            <div className="location-meta-item">

              <span>
                Longitude
              </span>

              <strong>
                {longitude.toFixed(6)}
              </strong>

            </div>

            <div className="location-meta-item">

              <span>
                Business
              </span>

              <strong>
                {categoryDisplay}
              </strong>

            </div>

            <div className="location-meta-item">

              <span>
                Analysis Radius
              </span>

              <strong>
                {radius} km
              </strong>

            </div>

          </div>

        </section>


        {/* ==================================================
            MAP
        ================================================== */}

        <section className="analysis-card map-card">

          <div className="card-header">

            <div>

              <span className="section-label">
                GEOSPATIAL ANALYSIS
              </span>

              <h2>
                Analysis Map
              </h2>

              <p>
                Explore the selected location and
                analysis radius.
              </p>

            </div>

            <div className="map-radius-badge">
              ◯ {radius} km radius
            </div>

          </div>

          <div className="analysis-map-container">

            <MapContainer
              center={[
                latitude,
                longitude,
              ]}
              zoom={14}
              scrollWheelZoom={true}
              className="analysis-map"
            >

              <TileLayer
                attribution="&copy; OpenStreetMap contributors"
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />

              <MapUpdater
                latitude={latitude}
                longitude={longitude}
              />

              <Marker
                position={[
                  latitude,
                  longitude,
                ]}
              >

                <Popup>

                  <strong>
                    📍 Selected Business Location
                  </strong>

                  <br />

                  {address}

                  <br />
                  <br />

                  Business:{" "}
                  {categoryDisplay}

                  <br />

                  Radius: {radius} km

                </Popup>

              </Marker>

              <Circle
                center={[
                  latitude,
                  longitude,
                ]}
                radius={
                  Number(radius) * 1000
                }
                pathOptions={{
                  fillOpacity: 0.15,
                }}
              />

            </MapContainer>

          </div>

          <div className="map-footer">

            <span>
              📍 Selected location
            </span>

            <span>
              ⭕ Analysis coverage area
            </span>

            <span>
              🗺️ OpenStreetMap data
            </span>

          </div>

        </section>


        {/* ==================================================
            ANALYSIS CONTROL
        ================================================== */}

        <section className="analysis-card control-card">

          <div className="card-header">

            <div>

              <span className="section-label">
                ANALYSIS CONFIGURATION
              </span>

              <h2>
                Configure Analysis
              </h2>

              <p>
                Choose the analysis radius before
                generating location insights.
              </p>

            </div>

          </div>

          <form
            onSubmit={handleAnalysis}
            className="analysis-form"
          >

            <div className="analysis-form-grid">

              {/* RADIUS */}

              <div className="form-field">

                <label>
                  Analysis Radius
                </label>

                <select
                  value={radius}
                  onChange={(e) =>
                    setRadius(
                      Number(e.target.value)
                    )
                  }
                >

                  <option value={2}>
                    2 km
                  </option>

                  <option value={3}>
                    3 km
                  </option>

                  <option value={4}>
                    4 km
                  </option>

                  <option value={5}>
                    5 km
                  </option>

                </select>

                <small>
                  Area around the selected location
                  that will be analyzed.
                </small>

              </div>


              {/* BUSINESS */}

              <div className="form-field">

                <label>
                  Business Category
                </label>

                <div className="category-display">

                  <span>
                    {categoryDisplay}
                  </span>

                  <span>
                    ✓ Selected
                  </span>

                </div>

                <small>
                  Selected from the previous step.
                </small>

              </div>


              {/* LOCATION */}

              <div className="form-field">

                <label>
                  Location
                </label>

                <div className="location-display">
                  📍 {address}
                </div>

                <small>
                  Current selected business location.
                </small>

              </div>

            </div>


            <button
              type="submit"
              disabled={loading}
              className="analyze-button"
            >

              {loading ? (
                <>
                  <span className="button-spinner"></span>
                  Analyzing Location...
                </>
              ) : (
                <>
                  🤖 Analyze Location
                  <span>→</span>
                </>
              )}

            </button>

          </form>

          {error && (
            <div className="analysis-error">
              <span>⚠️</span>
              {error}
            </div>
          )}

        </section>


        {/* ==================================================
            RESULTS
        ================================================== */}

        {analysisData && (
          <section className="results-section">

            <div className="results-heading">

              <div>

                <span className="section-label">
                  AI RESULTS
                </span>

                <h2>
                  Location Analysis Results
                </h2>

                <p>
                  AI-generated insights based on the
                  selected location and business category.
                </p>

              </div>

              <div className="result-generated">
                ✓ Analysis Complete
              </div>

            </div>


            {/* ==============================================
                SUCCESS SCORE
            ============================================== */}

            <div className="success-score-card">

              <div className="success-score-content">

                <div>

                  <span className="section-label">
                    BUSINESS SUCCESS SCORE
                  </span>

                  <h2>
                    Overall Business Potential
                  </h2>

                  <p>
                    Estimated likelihood that this
                    location can support your selected
                    business.
                  </p>

                  <div className="success-level">
                    {businessSuccess?.level ||
                      "N/A"}
                  </div>

                  <div className="confidence-text">
                    Model Confidence:{" "}
                    <strong>
                      {businessSuccess?.confidence ||
                        "N/A"}
                    </strong>
                  </div>

                </div>

                <div className="success-score-circle">

                  <div>

                    <strong>
                      {businessSuccess?.score ?? 0}
                    </strong>

                    <span>
                      %
                    </span>

                  </div>

                  <small>
                    Success
                  </small>

                </div>

              </div>

            </div>


            {/* ==============================================
                SCORE CARDS
            ============================================== */}

            <div className="result-score-grid">

              <ScoreCard
                icon="📈"
                title="Demand Score"
                value={demand?.score ?? 0}
                type="demand"
              />

              <ScoreCard
                icon="⚔️"
                title="Competition Score"
                value={competitors?.score ?? 0}
                type="competition"
              />

              <ScoreCard
                icon="🚶"
                title="Accessibility Score"
                value={accessibility?.score ?? 0}
                type="accessibility"
              />

              <ScoreCard
                icon="⚠️"
                title="Risk Score"
                value={risk?.score ?? 0}
                type="risk"
              />

            </div>


            {/* ==============================================
                COMPETITION + DEMAND
            ============================================== */}

            <div className="result-two-column">

              {/* COMPETITION */}

              <div className="result-detail-card">

                <div className="detail-card-header">

                  <div className="detail-icon">
                    ⚔️
                  </div>

                  <div>

                    <h3>
                      Competition
                    </h3>

                    <span>
                      Nearby business landscape
                    </span>

                  </div>

                </div>

                <div className="detail-stat-grid">

                  <DetailStat
                    label="Total Competitors"
                    value={competitors?.count ?? 0}
                  />

                  <DetailStat
                    label="Within 500m"
                    value={
                      competitors?.within500m ?? 0
                    }
                  />

                  <DetailStat
                    label="Within 1km"
                    value={
                      competitors?.within1km ?? 0
                    }
                  />

                  <DetailStat
                    label="Average Distance"
                    value={
                      competitors?.averageDistance
                        ? `${competitors.averageDistance} km`
                        : "N/A"
                    }
                  />

                </div>

                <div className="nearest-competitor">

                  <span>
                    Nearest Competitor
                  </span>

                  <strong>
                    {competitors?.nearest?.name ||
                      "No nearby competitor found"}
                  </strong>

                </div>

              </div>


              {/* DEMAND */}

              <div className="result-detail-card">

                <div className="detail-card-header">

                  <div className="detail-icon demand-icon">
                    📊
                  </div>

                  <div>

                    <h3>
                      Demand Indicators
                    </h3>

                    <span>
                      Nearby demand-generating factors
                    </span>

                  </div>

                </div>

                <div className="indicator-grid">

                  <Indicator
                    icon="🎓"
                    label="Education"
                    value={demand?.education ?? 0}
                  />

                  <Indicator
                    icon="🏢"
                    label="Offices"
                    value={demand?.offices ?? 0}
                  />

                  <Indicator
                    icon="🏥"
                    label="Hospitals"
                    value={demand?.hospitals ?? 0}
                  />

                  <Indicator
                    icon="🩺"
                    label="Clinics"
                    value={demand?.clinics ?? 0}
                  />

                  <Indicator
                    icon="💊"
                    label="Pharmacies"
                    value={demand?.pharmacies ?? 0}
                  />

                  <Indicator
                    icon="🛍️"
                    label="Shopping"
                    value={demand?.shopping ?? 0}
                  />

                  <Indicator
                    icon="🚌"
                    label="Transport"
                    value={demand?.transport ?? 0}
                  />

                  <Indicator
                    icon="🏛️"
                    label="Tourism"
                    value={demand?.tourism ?? 0}
                  />

                  <Indicator
                    icon="🏠"
                    label="Residential"
                    value={demand?.residential ?? 0}
                  />

                </div>

              </div>

            </div>


            {/* ==============================================
                ACCESSIBILITY
            ============================================== */}

            <div className="result-detail-card full-detail-card">

              <div className="detail-card-header">

                <div className="detail-icon accessibility-icon">
                  🚦
                </div>

                <div>

                  <h3>
                    Accessibility
                  </h3>

                  <span>
                    How easy it is for customers to
                    reach the location
                  </span>

                </div>

              </div>

              <div className="accessibility-grid">

                <AccessibilityItem
                  icon="🚌"
                  label="Public Transport"
                  value={
                    accessibility?.transport ?? 0
                  }
                />

                <AccessibilityItem
                  icon="🛣️"
                  label="Road Access"
                  value={
                    accessibility?.roads ?? 0
                  }
                />

                <AccessibilityItem
                  icon="🅿️"
                  label="Parking"
                  value={
                    accessibility?.parking ?? 0
                  }
                />

                <AccessibilityItem
                  icon="🚶"
                  label="Walkable Paths"
                  value={
                    accessibility?.walkable ?? 0
                  }
                />

              </div>

            </div>


            {/* ==============================================
                RECOMMENDATIONS
            ============================================== */}

            {analysisData?.recommendations?.length >
              0 && (

              <div className="recommendations-card">

                <div className="recommendations-header">

                  <div className="recommendation-ai-icon">
                    🤖
                  </div>

                  <div>

                    <span className="section-label">
                      AI INSIGHTS
                    </span>

                    <h2>
                      Recommendations
                    </h2>

                    <p>
                      Actionable suggestions based on
                      the analysis results.
                    </p>

                  </div>

                </div>

                <div className="recommendation-list">

                  {analysisData.recommendations.map(
                    (recommendation, index) => (

                      <div
                        className="recommendation-item"
                        key={index}
                      >

                        <div className="recommendation-number">
                          {String(index + 1).padStart(
                            2,
                            "0"
                          )}
                        </div>

                        <div>

                          <strong>
                            {typeof recommendation ===
                            "string"
                              ? recommendation
                              : recommendation.message ||
                                recommendation.text ||
                                JSON.stringify(
                                  recommendation
                                )}
                          </strong>

                        </div>

                      </div>

                    )
                  )}

                </div>

              </div>
            )}


            {/* ==============================================
                COMPETITOR LIST
            ============================================== */}

            {analysisData?.competitorBusinesses
              ?.length > 0 && (

              <div className="competitor-list-card">

                <div className="detail-card-header">

                  <div className="detail-icon">
                    🏪
                  </div>

                  <div>

                    <h3>
                      Nearby Competitors
                    </h3>

                    <span>
                      Businesses found around your
                      selected location
                    </span>

                  </div>

                </div>

                <div className="competitor-table">

                  <div className="competitor-table-header">
                    <span>
                      Business
                    </span>

                    <span>
                      Category
                    </span>

                    <span>
                      Distance
                    </span>
                  </div>

                  {analysisData.competitorBusinesses.map(
                    (competitor, index) => (

                      <div
                        className="competitor-row"
                        key={
                          competitor.id ||
                          index
                        }
                      >

                        <div className="competitor-name">

                          <div className="competitor-avatar">
                            🏪
                          </div>

                          <strong>
                            {competitor.name}
                          </strong>

                        </div>

                        <span className="competitor-category">
                          {competitor.category}
                        </span>

                        <span className="competitor-distance">
                          📍 {competitor.distance} km
                        </span>

                      </div>

                    )
                  )}

                </div>

              </div>
            )}

          </section>
        )}


        {/* ==================================================
            FOOTER
        ================================================== */}

        <footer className="analysis-footer">

          <span>
            © {new Date().getFullYear()} BizLens-AI
          </span>

          <span>
            AI-Powered Business Location Intelligence
          </span>

        </footer>

      </main>

    </div>
  );
}

// ============================================================
// SCORE CARD
// ============================================================

function ScoreCard({
  icon,
  title,
  value,
  type,
}) {
  return (
    <div className={`result-score-card ${type}`}>

      <div className="score-card-top">

        <div className="score-icon">
          {icon}
        </div>

        <span>
          SCORE
        </span>

      </div>

      <strong className="score-number">
        {value}
      </strong>

      <h3>
        {title}
      </h3>

      <div className="score-progress">

        <div
          style={{
            width: `${Math.min(
              Math.max(Number(value) || 0, 0),
              100
            )}%`,
          }}
        ></div>

      </div>

      <small>
        out of 100
      </small>

    </div>
  );
}

// ============================================================
// DETAIL STAT
// ============================================================

function DetailStat({ label, value }) {
  return (
    <div className="detail-stat">

      <span>
        {label}
      </span>

      <strong>
        {value}
      </strong>

    </div>
  );
}

// ============================================================
// INDICATOR
// ============================================================

function Indicator({
  icon,
  label,
  value,
}) {
  return (
    <div className="indicator-item">

      <span className="indicator-icon">
        {icon}
      </span>

      <div>

        <span>
          {label}
        </span>

        <strong>
          {value}
        </strong>

      </div>

    </div>
  );
}

// ============================================================
// ACCESSIBILITY ITEM
// ============================================================

function AccessibilityItem({
  icon,
  label,
  value,
}) {
  return (
    <div className="accessibility-item">

      <div className="accessibility-icon-box">
        {icon}
      </div>

      <div>

        <span>
          {label}
        </span>

        <strong>
          {value}
        </strong>

      </div>

    </div>
  );
}

export default Analysis;
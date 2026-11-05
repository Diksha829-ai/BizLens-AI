import { useEffect, useState } from "react";
import {
  useNavigate,
  useSearchParams,
} from "react-router-dom";
import {
  TrendingUp,
  Store,
  Bus,
  Route,
  SquareParking,
  AlertCircle,
  Sparkles,
  Lightbulb,
  CheckCircle,
  MapPin,
  Bot,
} from "lucide-react";

import BackButton from "../components/BackButton";
import LoadingScreen from "../components/LoadingScreen";
import CompetitorMap from "../components/CompetitorMap";
import CompetitionCard from "../components/CompetitionCard";
import DemandIndicatorCard from "../components/DemandIndicatorCard";
import CompetitorList from "../components/CompetitorList";

import "../styles/analysis.css";

// Backend API base URL (production via VITE_API_URL, local fallback for development)
const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

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

  const [searchParams] = useSearchParams();

  const savedId = searchParams.get("savedId");

  // ==========================================================
  // LOCATION
  // ==========================================================

  const [latitude, setLatitude] = useState(null);
  const [longitude, setLongitude] = useState(null);
  const [address, setAddress] = useState("");

  // ==========================================================
  // BUSINESS
  // ==========================================================

  const [radius, setRadius] = useState(() => {
    const savedRadius =
      localStorage.getItem("selectedRadius") ||
      localStorage.getItem("analysisRadius");

    const parsedRadius = Number(savedRadius);

    return [1, 2, 3, 4, 5].includes(parsedRadius)
      ? parsedRadius
      : 3;
  });
  const [category, setCategory] = useState(null);

  // ==========================================================
  // ANALYSIS
  // ==========================================================

  const [analysisData, setAnalysisData] = useState(null);
  const [loading, setLoading] = useState(() => Boolean(savedId));
  const [error, setError] = useState("");
  // ==========================================================
  // LOAD SAVED DATA
  // ==========================================================

  useEffect(() => {
  const loadAnalysisData = async () => {
    // ========================================================
    // SAVED ANALYSIS MODE
    // ========================================================

    if (savedId) {
      try {
        setLoading(true);
        setError("");

        const token = localStorage.getItem("token");

        if (!token) {
          navigate("/login");
          return;
        }

        console.log(
          "Loading saved analysis:",
          savedId
        );

        const response = await fetch(
          `${API_URL}/api/analysis/${savedId}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        const data = await response.json();

        console.log(
          "Saved analysis response:",
          data
        );

        if (
          response.status === 401 ||
          response.status === 403
        ) {
          localStorage.removeItem("token");
          localStorage.removeItem("user");

          navigate("/login");
          return;
        }

        if (!response.ok) {
          throw new Error(
            data.message ||
              "Failed to load saved analysis."
          );
        }

        const savedAnalysis = data.data;

        if (!savedAnalysis) {
          throw new Error(
            "Saved analysis data was not found."
          );
        }

        // ----------------------------------------------------
        // LOCATION
        // ----------------------------------------------------

        setLatitude(
          Number(savedAnalysis.latitude)
        );

        setLongitude(
          Number(savedAnalysis.longitude)
        );

        setAddress(
          `${savedAnalysis.latitude}, ${savedAnalysis.longitude}`
        );

        // ----------------------------------------------------
        // BUSINESS
        // ----------------------------------------------------

        setRadius(
          Number(savedAnalysis.radius) || 3
        );

        setCategory(
          savedAnalysis.category
        );

        // ----------------------------------------------------
        // ANALYSIS RESULT
        // ----------------------------------------------------

        setAnalysisData(savedAnalysis);

        console.log(
          "Saved analysis loaded successfully."
        );

      } catch (error) {
        console.error(
          "Error loading saved analysis:",
          error
        );

        setError(
          error.message ||
            "Unable to load saved analysis."
        );
      } finally {
        setLoading(false);
      }

      return;
    }

    // ========================================================
    // NORMAL NEW ANALYSIS MODE
    // ========================================================

    try {
      const savedLocation =
        localStorage.getItem(
          "selectedLocation"
        );

      const savedCategory =
        localStorage.getItem(
          "selectedCategory"
        );

const savedRadius =
  localStorage.getItem("selectedRadius") ||
  localStorage.getItem("analysisRadius");

      console.log(
        "======================================"
      );

      console.log(
        "Analysis Page - Loading Data"
      );

      console.log(
        "Selected Location:",
        savedLocation
      );

      console.log(
        "Selected Category:",
        savedCategory
      );

      console.log(
        "Selected Radius:",
        savedRadius
      );

      console.log(
        "======================================"
      );

      // ------------------------------------------------------
      // LOCATION
      // ------------------------------------------------------

      if (!savedLocation) {
        setError(
          "No location selected. Please go back and select a location."
        );
        return;
      }

      const location =
        JSON.parse(savedLocation);

      const selectedLatitude =
        Number(location.latitude);

      const selectedLongitude =
        Number(location.longitude);

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
if (savedRadius !== null && savedRadius !== "") {
  const parsedRadius = Number(savedRadius);

  if ([1, 2, 3, 4, 5].includes(parsedRadius)) {
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
  };

  loadAnalysisData();
}, [savedId, navigate]);
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
        `${API_URL}/api/analysis`,
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
console.log("Full analysis data:", data.data);
console.log("ML prediction:", data.data?.mlPrediction);
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

      let userMessage =
        "Unable to complete the location analysis. Please try again.";

      // ------------------------------------------------------
      // BACKEND / NETWORK CONNECTION ERROR
      // ------------------------------------------------------

      if (
        error instanceof TypeError &&
        error.message === "Failed to fetch"
      ) {

        userMessage =
          "Unable to connect to the analysis server. Please try again in a moment.";

      }

      // ------------------------------------------------------
      // OTHER ERRORS
      // ------------------------------------------------------

      else if (error?.message) {

        userMessage =
          error.message;

      }

      setError(
        userMessage
      );

    } finally {

      setLoading(false);

    }
  };

  // ==========================================================
  // LOADING STATE
  // ==========================================================

  if (loading) {
    return (
      <div className="analysis-page">
        <div style={{ padding: "20px 24px 0 24px", maxWidth: "1280px", margin: "0 auto", width: "100%" }}>
          <BackButton fallback={savedId ? "/saved-analyses" : "/location-selection"} label={savedId ? "Back to Saved Analyses" : "Back to Selection"} />
        </div>
        <LoadingScreen
          title="Analyzing Your Location..."
          subtitle="Retrieving geographical insights, nearby competitors and business opportunity data."
        />
      </div>
    );
  }

  // ==========================================================
  // ERROR STATE (Analysis Not Found / API Failure)
  // ==========================================================

  if (error) {
    return (
      <div className="analysis-error-page">
        <div className="analysis-error-card">
          <div className="analysis-brand">
            <div className="analysis-logo">
              B
            </div>
            <div>
              <strong>BizLens</strong>
              <span>AI</span>
            </div>
          </div>

          <div className="error-icon" style={{ display: "flex", justifyContent: "center", margin: "16px 0", color: "#dc2626" }}>
            <AlertCircle size={48} />
          </div>

          <h1>
            {savedId ? "Analysis Not Found" : "Unable to Load Analysis"}
          </h1>

          <p>
            {error}
          </p>

          <div style={{ display: "flex", gap: "12px", justifyContent: "center", marginTop: "24px", flexWrap: "wrap" }}>
            <BackButton fallback="/saved-analyses" label="Back to Saved Analyses" />
            <button
              type="button"
              onClick={() => navigate("/dashboard")}
              className="analysis-primary-button"
              style={{ minHeight: "40px", padding: "0 18px" }}
            >
              Dashboard
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ==========================================================
  // MISSING LOCATION OR CATEGORY (Direct visit without params)
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
              <strong>BizLens</strong>
              <span>AI</span>
            </div>
          </div>

          <div className="error-icon" style={{ display: "flex", justifyContent: "center", margin: "16px 0", color: "#f59e0b" }}>
            <AlertCircle size={48} />
          </div>

          <h1>
            Location & Category Required
          </h1>

          <p>
            Please choose a business category and location on the map to view intelligent location analysis.
          </p>

          <div style={{ display: "flex", gap: "12px", justifyContent: "center", marginTop: "24px", flexWrap: "wrap" }}>
            <BackButton fallback="/location-selection" label="Back to Location Selection" />
            <button
              type="button"
              onClick={() => navigate("/dashboard")}
              className="analysis-primary-button"
              style={{ minHeight: "40px", padding: "0 18px" }}
            >
              Dashboard
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ==========================================================
  // RESULT VALUES
  // ==========================================================

  const businessSuccess =
    analysisData?.businessSuccess;
  const mlPrediction =
  analysisData?.mlPrediction;

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

          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <BackButton
              fallback={savedId ? "/saved-analyses" : "/location-selection"}
              label={savedId ? "Back to Saved Analyses" : "Back to Selection"}
              style={{ marginBottom: 0 }}
            />

            <button
              type="button"
              className="back-dashboard-button"
              onClick={() =>
                navigate("/dashboard")
              }
            >
              Dashboard
            </button>
          </div>

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
            COMPETITOR MAP
        ================================================== */}

        <CompetitorMap
          latitude={latitude}
          longitude={longitude}
          address={address}
          categoryDisplay={categoryDisplay}
          radius={radius}
          onRadiusChange={(newRadius) => setRadius(newRadius)}
          competitors={analysisData?.competitorBusinesses || []}
        />


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
                  <option value={1}>
                1 km
              </option>
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
                <span className="section-label">AI RESULTS</span>
                <h2>Location Analysis Results</h2>
                <p>
                  AI-generated insights based on the selected location and business category.
                </p>
              </div>
              <div className="result-generated">✓ Analysis Complete</div>
            </div>

            {/* BUSINESS OPPORTUNITY */}
            <div className="success-score-card">
              <div className="success-score-content">
                <div>
                  <span className="section-label">BUSINESS SUCCESS SCORE</span>
                  <h2>Overall Business Potential</h2>
                  <p>
                    Estimated likelihood that this location can support your selected business.
                  </p>
                  <div className="success-level">
                    {businessSuccess?.level || "N/A"}
                  </div>
                  <div className="confidence-text">
                    Model Confidence: <strong>{businessSuccess?.confidence || "N/A"}</strong>
                  </div>
                </div>
                <div className="success-score-circle">
                  <div>
                    <strong>{businessSuccess?.score ?? 0}</strong>
                    <span>%</span>
                  </div>
                  <small>Success</small>
                </div>
              </div>
            </div>

            {/* GEOGRAPHIC SCORE CARDS */}
            <div className="result-score-grid">
              <ScoreCard icon={<TrendingUp size={22} />} title="Demand Score" value={demand?.score ?? 0} type="demand" />
              <ScoreCard icon={<Store size={22} />} title="Competition Score" value={competitors?.score ?? 0} type="competition" />
              <ScoreCard icon={<Bus size={22} />} title="Accessibility Score" value={accessibility?.score ?? 0} type="accessibility" />
              <ScoreCard icon={<AlertCircle size={22} />} title="Risk Score" value={risk?.score ?? 0} type="risk" />
            </div>

            {/* ML PREDICTION */}
            {mlPrediction && (
              <div className="ml-prediction-card">
                <div className="ml-prediction-header">
                  <div>
                    <span className="section-label">MACHINE LEARNING PREDICTION</span>
                    <h2>Geographic Opportunity Prediction</h2>
                    <p>
                      Prediction generated from OSM-derived geographic features and the trained ML model.
                    </p>
                  </div>
                  <div className="ml-prediction-badge">🤖 ML Model</div>
                </div>

                <div className="ml-prediction-content">
                  <div className="ml-prediction-result">
                    <span>Prediction</span>
                    <strong>{mlPrediction.predictionLabel || "N/A"}</strong>
                    <small>Model classification</small>
                  </div>
                  <div className="ml-prediction-result">
                    <span>Opportunity Probability</span>
                    <strong>
                      {(Number(mlPrediction.opportunityProbability ?? 0) * 100).toFixed(2)}%
                    </strong>
                    <small>Probability of higher opportunity</small>
                  </div>
                  <div className="ml-prediction-result">
                    <span>Lower Opportunity Probability</span>
                    <strong>
                      {((1 - Number(mlPrediction.opportunityProbability ?? 0)) * 100).toFixed(2)}%
                    </strong>
                    <small>Model probability</small>
                  </div>
                </div>

                {mlPrediction.geographicFeatures && (
                  <div className="ml-features">
                    <div className="ml-feature"><span>POIs within 500m</span><strong>{mlPrediction.geographicFeatures.pois_500m ?? 0}</strong></div>
                    <div className="ml-feature"><span>POIs within 1km</span><strong>{mlPrediction.geographicFeatures.pois_1km ?? 0}</strong></div>
                    <div className="ml-feature"><span>Competitors within 1km</span><strong>{mlPrediction.geographicFeatures.competitors_1km ?? 0}</strong></div>
                    <div className="ml-feature"><span>Nearest Competitor</span><strong>{mlPrediction.geographicFeatures.nearest_competitor_m ?? 0} m</strong></div>
                    <div className="ml-feature"><span>POI Density / km²</span><strong>{mlPrediction.geographicFeatures.poi_density_1km ?? 0}</strong></div>
                    <div className="ml-feature"><span>Category POIs</span><strong>{mlPrediction.geographicFeatures.category_poi_count ?? 0}</strong></div>
                  </div>
                )}

                {mlPrediction.geographicFeatures?.category_data_available === false && (
                  <div className="ml-data-warning">
                    <div className="ml-data-warning-icon">⚠</div>
                    <div className="ml-data-warning-content">
                      <strong>Limited Category Data</strong>
                      <p>
                        {mlPrediction.geographicFeatures.category_data_warning ||
                          "Category-specific OSM data is unavailable for this category. The prediction should be interpreted with caution."}
                      </p>
                    </div>
                  </div>
                )}

                {mlPrediction.geographicFeatures?.geographic_signals?.length > 0 && (
                  <div className="ml-signals">
                    <div className="ml-signals-header">
                      <span className="section-label">GEOGRAPHIC SIGNALS</span>
                      <h3>Why this location?</h3>
                      <p>Key geographic factors considered by the analysis.</p>
                    </div>
                    <div className="ml-signals-list">
                      {mlPrediction.geographicFeatures.geographic_signals.map((signal, index) => (
                        <div className="ml-signal" key={index}>
                          <span className="ml-signal-icon">✓</span>
                          <span>{signal}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="ml-prediction-note">
                  <span>ℹ️</span>
                  <p>
                    {mlPrediction.interpretation ||
                      "ML prediction based on geographic opportunity features."}
                  </p>
                </div>
              </div>
            )}

            {/* COMPETITION + DEMAND INDICATORS */}
            <div className="result-two-column">
              <CompetitionCard competitors={competitors} />
              <DemandIndicatorCard demand={demand} />
            </div>

            {/* ACCESSIBILITY */}
            <div className="result-detail-card full-detail-card">
              <div className="detail-card-header">
                <div className="detail-icon accessibility-icon"><Bus size={20} /></div>
                <div>
                  <h3>Accessibility</h3>
                  <span>How easy it is for customers to reach the location</span>
                </div>
              </div>
              <div className="accessibility-grid">
                <AccessibilityItem icon={<Bus size={18} />} label="Public Transport" value={accessibility?.transport ?? 0} />
                <AccessibilityItem icon={<Route size={18} />} label="Road Access" value={accessibility?.roads ?? 0} />
                <AccessibilityItem icon={<SquareParking size={18} />} label="Parking" value={accessibility?.parking ?? 0} />
              </div>
            </div>

            {/* AI RECOMMENDATIONS */}
            {analysisData?.recommendations?.length > 0 && (
              <div className="recommendations-card">
                <div className="recommendations-header">
                  <div className="recommendation-ai-icon"><Lightbulb size={22} /></div>
                  <div>
                    <span className="section-label">STRATEGIC GUIDANCE</span>
                    <h2>Recommendations</h2>
                    <p>Actionable suggestions based on the analysis results.</p>
                  </div>
                </div>
                <div className="recommendation-list">
                  {analysisData.recommendations.map((recommendation, index) => (
                    <div className="recommendation-item" key={index}>
                      <div className="recommendation-number">
                        {String(index + 1).padStart(2, "0")}
                      </div>
                      <div>
                        <strong>
                          {typeof recommendation === "string"
                            ? recommendation
                            : recommendation.message || recommendation.text || JSON.stringify(recommendation)}
                        </strong>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* NEARBY COMPETITORS LIST */}
            <CompetitorList competitors={analysisData?.competitorBusinesses || []} />

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

      {/* Floating BizLens AI Chatbot */}

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
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import "../styles/analysis-preview.css";

function AnalysisPreview() {
  const navigate = useNavigate();

  const [location, setLocation] = useState(null);
  const [category, setCategory] = useState("");
  const [categoryName, setCategoryName] = useState("");
  const [radius, setRadius] = useState(3);

  // ===================================================
  // CATEGORY INFORMATION
  // ===================================================

  const categoryInfo = {
    cafe: {
      name: "Cafe",
      emoji: "☕",
    },
    restaurant: {
      name: "Restaurant",
      emoji: "🍽️",
    },
    gym: {
      name: "Gym",
      emoji: "🏋️",
    },
    pharmacy: {
      name: "Medical Store",
      emoji: "💊",
    },
    salon: {
      name: "Salon",
      emoji: "💇",
    },
    grocery: {
      name: "Grocery Store",
      emoji: "🛒",
    },
    clothing: {
      name: "Clothing Store",
      emoji: "👕",
    },
  };

  // ===================================================
  // LOAD ANALYSIS DATA
  // ===================================================

  useEffect(() => {
    try {
      const savedLocation = localStorage.getItem(
        "selectedLocation"
      );

      const savedCategory = localStorage.getItem(
        "selectedCategory"
      );

      if (!savedLocation) {
        alert("Please select a location first.");
        navigate("/location-selection");
        return;
      }

      if (!savedCategory) {
        alert("Please select a business category first.");
        navigate("/business-category");
        return;
      }

      const parsedLocation = JSON.parse(savedLocation);

      const lat = Number(parsedLocation.latitude);
      const lng = Number(parsedLocation.longitude);

      if (Number.isNaN(lat) || Number.isNaN(lng)) {
        alert("Selected location coordinates are invalid.");
        navigate("/location-selection");
        return;
      }

      setLocation({
        ...parsedLocation,
        latitude: lat,
        longitude: lng,
      });

      setCategory(savedCategory);

      setCategoryName(
        categoryInfo[savedCategory]?.name ||
          savedCategory
      );

      const savedRadius = localStorage.getItem(
        "analysisRadius"
      );

      if (savedRadius) {
        const parsedRadius = Number(savedRadius);

        if (!Number.isNaN(parsedRadius)) {
          setRadius(parsedRadius);
        }
      }
    } catch (error) {
      console.error(
        "Analysis Preview error:",
        error
      );

      alert(
        "Unable to load analysis information."
      );

      navigate("/location-selection");
    }
  }, [navigate]);

  // ===================================================
  // START ANALYSIS
  // ===================================================

  const handleStartAnalysis = () => {
    if (!location) {
      alert("Location information is missing.");
      navigate("/location-selection");
      return;
    }

    if (!category) {
      alert("Business category is missing.");
      navigate("/business-category");
      return;
    }

    localStorage.setItem(
      "analysisRadius",
      String(radius)
    );

    localStorage.removeItem(
      "analysisResult"
    );

    console.log(
      "======================================"
    );

    console.log("Starting Analysis");
    console.log("Latitude:", location.latitude);
    console.log("Longitude:", location.longitude);
    console.log(
      "Location:",
      location.address
    );
    console.log("Category:", category);
    console.log("Radius:", radius);

    console.log(
      "======================================"
    );

    navigate("/analysis");
  };

  // ===================================================
  // CHANGE LOCATION
  // ===================================================

  const handleChangeLocation = () => {
    navigate("/location-selection");
  };

  // ===================================================
  // CHANGE CATEGORY
  // ===================================================

  const handleChangeCategory = () => {
    navigate("/business-category");
  };

  // ===================================================
  // LOADING
  // ===================================================

  if (!location) {
    return (
      <div className="preview-loading">
        <div className="preview-loading-card">
          <div className="loading-spinner"></div>

          <h2>
            Loading Analysis Preview
          </h2>

          <p>
            Preparing your business location
            analysis...
          </p>
        </div>
      </div>
    );
  }

  // ===================================================
  // CATEGORY EMOJI
  // ===================================================

  const categoryEmoji =
    categoryInfo[category]?.emoji || "🏪";

  // ===================================================
  // UI
  // ===================================================

  return (
    <div className="analysis-preview-page">

      {/* =================================================
          TOP HEADER
      ================================================= */}

      <header className="preview-header">

        <div
          className="preview-brand"
          onClick={() =>
            navigate("/dashboard")
          }
        >

          <div className="preview-logo">
            B
          </div>

          <div>
            <div className="preview-brand-name">
              BizLens
            </div>

            <div className="preview-brand-ai">
              AI
            </div>
          </div>

        </div>

        <button
          className="preview-dashboard-btn"
          type="button"
          onClick={() =>
            navigate("/dashboard")
          }
        >
          ← Dashboard
        </button>

      </header>


      {/* =================================================
          MAIN
      ================================================= */}

      <main className="preview-main">

        {/* =================================================
            PAGE TITLE
        ================================================= */}

        <section className="preview-title">

          <div className="preview-title-icon">
            ✨
          </div>

          <div>

            <p className="preview-eyebrow">
              BUSINESS LOCATION INTELLIGENCE
            </p>

            <h1>
              Analysis Preview
            </h1>

            <p>
              Review your analysis configuration
              before starting the AI-powered
              location analysis.
            </p>

          </div>

        </section>


        {/* =================================================
            PROGRESS
        ================================================= */}

        <div className="preview-progress">

          <div className="progress-step completed">

            <div className="progress-circle">
              ✓
            </div>

            <span>
              Location
            </span>

          </div>

          <div className="progress-line completed-line"></div>

          <div className="progress-step completed">

            <div className="progress-circle">
              ✓
            </div>

            <span>
              Business
            </span>

          </div>

          <div className="progress-line active-line"></div>

          <div className="progress-step active">

            <div className="progress-circle">
              3
            </div>

            <span>
              Review
            </span>

          </div>

          <div className="progress-line"></div>

          <div className="progress-step">

            <div className="progress-circle">
              4
            </div>

            <span>
              Analysis
            </span>

          </div>

        </div>


        {/* =================================================
            CONFIGURATION CARDS
        ================================================= */}

        <section className="preview-grid">

          {/* LOCATION CARD */}

          <div className="preview-card">

            <div className="preview-card-header">

              <div className="preview-card-icon location-icon">
                📍
              </div>

              <div>

                <span>
                  STEP 01
                </span>

                <h2>
                  Selected Location
                </h2>

              </div>

            </div>


            <div className="location-display">

              <div className="location-pin">
                📍
              </div>

              <div>

                <strong>
                  {location.address ||
                    location.name ||
                    "Selected Location"}
                </strong>

                <p>
                  Your selected analysis point
                </p>

              </div>

            </div>


            <div className="coordinates">

              <div className="coordinate-item">

                <span>
                  LATITUDE
                </span>

                <strong>
                  {location.latitude.toFixed(6)}
                </strong>

              </div>

              <div className="coordinate-item">

                <span>
                  LONGITUDE
                </span>

                <strong>
                  {location.longitude.toFixed(6)}
                </strong>

              </div>

            </div>


            <button
              className="change-button"
              type="button"
              onClick={handleChangeLocation}
            >
              Change Location
              <span>→</span>
            </button>

          </div>


          {/* BUSINESS CARD */}

          <div className="preview-card">

            <div className="preview-card-header">

              <div className="preview-card-icon business-icon">
                🏪
              </div>

              <div>

                <span>
                  STEP 02
                </span>

                <h2>
                  Business Type
                </h2>

              </div>

            </div>


            <div className="business-display">

              <div className="business-emoji">
                {categoryEmoji}
              </div>

              <div>

                <strong>
                  {categoryName}
                </strong>

                <p>
                  Business category selected
                </p>

              </div>

            </div>


            <div className="category-id">

              <span>
                CATEGORY ID
              </span>

              <strong>
                {category}
              </strong>

            </div>


            <button
              className="change-button"
              type="button"
              onClick={handleChangeCategory}
            >
              Change Business
              <span>→</span>
            </button>

          </div>

        </section>


        {/* =================================================
            RADIUS
        ================================================= */}

        <section className="radius-card">

          <div className="radius-info">

            <div className="radius-icon">
              📏
            </div>

            <div>

              <span>
                ANALYSIS AREA
              </span>

              <h2>
                Search Radius
              </h2>

              <p>
                Choose how far BizLens-AI should
                analyze businesses and location
                factors around your selected point.
              </p>

            </div>

          </div>


          <div className="radius-control">

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
              Analysis coverage
            </small>

          </div>

        </section>


        {/* =================================================
            WHAT WILL BE ANALYZED
        ================================================= */}

        <section className="analysis-scope">

          <div className="scope-header">

            <div className="scope-icon">
              🤖
            </div>

            <div>

              <span>
                AI ANALYSIS ENGINE
              </span>

              <h2>
                What BizLens-AI will analyze
              </h2>

              <p>
                Your selected configuration will
                be used to generate a data-driven
                business location assessment.
              </p>

            </div>

          </div>


          <div className="scope-grid">

            <div className="scope-item">

              <div>
                🏪
              </div>

              <strong>
                Competition
              </strong>

              <span>
                Nearby competing businesses
              </span>

            </div>


            <div className="scope-item">

              <div>
                📈
              </div>

              <strong>
                Market Demand
              </strong>

              <span>
                Demand indicators and opportunity
              </span>

            </div>


            <div className="scope-item">

              <div>
                🚶
              </div>

              <strong>
                Accessibility
              </strong>

              <span>
                Roads, transport and accessibility
              </span>

            </div>


            <div className="scope-item">

              <div>
                🏢
              </div>

              <strong>
                Nearby Places
              </strong>

              <span>
                Offices, schools, hospitals and more
              </span>

            </div>


            <div className="scope-item">

              <div>
                📊
              </div>

              <strong>
                Location Factors
              </strong>

              <span>
                Geographic and demographic signals
              </span>

            </div>


            <div className="scope-item">

              <div>
                🧠
              </div>

              <strong>
                AI Recommendations
              </strong>

              <span>
                Business opportunities and risks
              </span>

            </div>

          </div>

        </section>


        {/* =================================================
            FINAL SUMMARY
        ================================================= */}

        <section className="final-summary">

          <div className="summary-left">

            <div className="summary-icon">
              ✓
            </div>

            <div>

              <span>
                READY TO ANALYZE
              </span>

              <h2>
                Your analysis is configured
              </h2>

              <p>
                {categoryName} analysis around{" "}
                <strong>
                  {location.address ||
                    location.name ||
                    "your selected location"}
                </strong>{" "}
                within a{" "}
                <strong>
                  {radius} km
                </strong>{" "}
                radius.
              </p>

            </div>

          </div>


          <div className="summary-actions">

            <button
              className="back-button"
              type="button"
              onClick={() =>
                navigate(
                  "/business-category"
                )
              }
            >
              ← Back
            </button>

            <button
              className="start-analysis-button"
              type="button"
              onClick={
                handleStartAnalysis
              }
            >
              <span>
                🚀
              </span>

              Start AI Analysis

              <span>
                →
              </span>

            </button>

          </div>

        </section>

      </main>


      {/* =================================================
          FOOTER
      ================================================= */}

      <footer className="preview-footer">

        <span>
          © {new Date().getFullYear()} BizLens-AI
        </span>

        <span>
          AI-Powered Business Location Intelligence
        </span>

      </footer>

    </div>
  );
}

export default AnalysisPreview;
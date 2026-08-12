import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

function BusinessCategory() {
  const navigate = useNavigate();

  const [latitude, setLatitude] =
    useState(null);

  const [longitude, setLongitude] =
    useState(null);

  const [locationName, setLocationName] =
    useState("");

  const [category, setCategory] =
    useState("");

  // ===================================================
  // LOAD SELECTED LOCATION
  // ===================================================

  useEffect(() => {
    const savedLatitude =
      localStorage.getItem(
        "selectedLatitude"
      );

    const savedLongitude =
      localStorage.getItem(
        "selectedLongitude"
      );

    const savedLocationName =
      localStorage.getItem(
        "selectedLocationName"
      );

    console.log(
      "======================================"
    );

    console.log(
      "Business Category - Selected Location"
    );

    console.log(
      "Latitude:",
      savedLatitude
    );

    console.log(
      "Longitude:",
      savedLongitude
    );

    console.log(
      "Location:",
      savedLocationName
    );

    console.log(
      "======================================"
    );

    if (
      !savedLatitude ||
      !savedLongitude
    ) {
      alert(
        "Please select a location first."
      );

      navigate(
        "/location-selection"
      );

      return;
    }

    setLatitude(
      parseFloat(savedLatitude)
    );

    setLongitude(
      parseFloat(savedLongitude)
    );

    setLocationName(
      savedLocationName || ""
    );

    // -------------------------------------------------
    // Load previously selected category if available
    // -------------------------------------------------

    const savedCategory =
      localStorage.getItem(
        "selectedCategory"
      );

    if (savedCategory) {
      setCategory(
        savedCategory
      );
    }
  }, [navigate]);

  // ===================================================
  // BUSINESS CATEGORIES
  // ===================================================

  const categories = [
    {
      name: "Cafe",
      value: "cafe",
      emoji: "☕",
    },

    {
      name: "Restaurant",
      value: "restaurant",
      emoji: "🍽️",
    },

    {
      name: "Gym",
      value: "gym",
      emoji: "🏋️",
    },

    {
      name: "Medical Store",
      value: "pharmacy",
      emoji: "💊",
    },

    {
      name: "Salon",
      value: "salon",
      emoji: "💇",
    },

    {
      name: "Grocery Store",
      value: "grocery",
      emoji: "🛒",
    },

    {
      name: "Clothing Store",
      value: "clothing",
      emoji: "👕",
    },
  ];

  // ===================================================
  // CONTINUE
  // ===================================================

  const handleContinue = () => {
    if (!category) {
      alert(
        "Please select a business category."
      );

      return;
    }

    // -------------------------------------------------
    // SAVE ONLY THE CURRENT CATEGORY
    // -------------------------------------------------

    localStorage.setItem(
      "selectedCategory",
      category
    );

    // -------------------------------------------------
    // REMOVE OLD ANALYSIS RESULT
    // -------------------------------------------------

    localStorage.removeItem(
      "analysisResult"
    );

    console.log(
      "======================================"
    );

    console.log(
      "Business Category Saved"
    );

    console.log(
      "Category:",
      category
    );

    console.log(
      "Location:",
      locationName
    );

    console.log(
      "Latitude:",
      latitude
    );

    console.log(
      "Longitude:",
      longitude
    );

    console.log(
      "======================================"
    );

    // -------------------------------------------------
    // NAVIGATE
    // -------------------------------------------------

    navigate(
      "/analysis-preview"
    );
  };

  // ===================================================
  // BACK
  // ===================================================

  const handleBack = () => {
    navigate(
      "/location-selection"
    );
  };

  // ===================================================
  // UI
  // ===================================================

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#f5f7fb",
        padding: "30px",
        fontFamily:
          "Arial, Helvetica, sans-serif",
      }}
    >
      <div
        style={{
          maxWidth: "1000px",
          margin: "0 auto",
        }}
      >
        {/* HEADER */}

        <div
          style={{
            background: "white",
            padding: "30px",
            borderRadius: "16px",
            textAlign: "center",
            marginBottom: "25px",
            boxShadow:
              "0 4px 15px rgba(0,0,0,0.08)",
          }}
        >
          <h1>
            Select Business Category
          </h1>

          <p
            style={{
              color: "#6b7280",
            }}
          >
            Choose the type of business
            you want to analyze.
          </p>
        </div>

        {/* LOCATION INFORMATION */}

        <div
          style={{
            background: "#eff6ff",
            padding: "20px",
            borderRadius: "12px",
            marginBottom: "25px",
          }}
        >
          <h3>
            📍 Selected Location
          </h3>

          {locationName && (
            <p>
              <strong>
                {locationName}
              </strong>
            </p>
          )}

          <p>
            Latitude:{" "}
            {latitude !== null
              ? latitude.toFixed(6)
              : "..."}
          </p>

          <p>
            Longitude:{" "}
            {longitude !== null
              ? longitude.toFixed(6)
              : "..."}
          </p>
        </div>

        {/* CATEGORY GRID */}

        <div
          style={{
            background: "white",
            padding: "30px",
            borderRadius: "16px",
            boxShadow:
              "0 4px 15px rgba(0,0,0,0.08)",
          }}
        >
          <h2>
            What business do you want
            to open?
          </h2>

          <div
            style={{
              display: "grid",
              gridTemplateColumns:
                "repeat(auto-fit, minmax(180px, 1fr))",
              gap: "20px",
              marginTop: "25px",
            }}
          >
            {categories.map(
              (item) => (
                <button
                  key={item.value}
                  type="button"
                  onClick={() =>
                    setCategory(
                      item.value
                    )
                  }
                  style={{
                    padding:
                      "25px 15px",

                    border:
                      category ===
                      item.value
                        ? "3px solid #2563eb"
                        : "1px solid #d1d5db",

                    borderRadius:
                      "12px",

                    background:
                      category ===
                      item.value
                        ? "#eff6ff"
                        : "white",

                    cursor:
                      "pointer",

                    fontSize:
                      "16px",

                    fontWeight:
                      "600",
                  }}
                >
                  <div
                    style={{
                      fontSize:
                        "40px",

                      marginBottom:
                        "10px",
                    }}
                  >
                    {item.emoji}
                  </div>

                  {item.name}
                </button>
              )
            )}
          </div>

          {/* BUTTONS */}

          <div
            style={{
              display: "flex",
              justifyContent:
                "center",
              gap: "15px",
              marginTop: "35px",
            }}
          >
            <button
              type="button"
              onClick={
                handleBack
              }
              style={{
                padding:
                  "13px 25px",

                background:
                  "white",

                border:
                  "1px solid #d1d5db",

                borderRadius:
                  "8px",

                cursor:
                  "pointer",
              }}
            >
              ← Back
            </button>

            <button
              type="button"
              onClick={
                handleContinue
              }
              disabled={
                !category
              }
              style={{
                padding:
                  "13px 30px",

                background:
                  category
                    ? "#2563eb"
                    : "#9ca3af",

                color: "white",

                border: "none",

                borderRadius:
                  "8px",

                fontSize:
                  "16px",

                fontWeight:
                  "600",

                cursor:
                  category
                    ? "pointer"
                    : "not-allowed",
              }}
            >
              Continue to Analysis
              Preview →
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default BusinessCategory;
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

function AnalysisPreview() {
  const navigate = useNavigate();

  const [location, setLocation] =
    useState(null);

  const [category, setCategory] =
    useState("");

  const [categoryName, setCategoryName] =
    useState("");

  const [radius, setRadius] =
    useState(3);

  // ===================================================
  // CATEGORY NAME
  // ===================================================

  const categoryNames = {
    cafe: "Cafe",
    restaurant: "Restaurant",
    gym: "Gym",
    pharmacy: "Medical Store",
    salon: "Salon",
    grocery: "Grocery Store",
    clothing: "Clothing Store",
  };

  // ===================================================
  // LOAD CURRENT ANALYSIS DATA
  // ===================================================

  useEffect(() => {
    try {
      // ------------------------------------------------
      // LOAD LOCATION
      // ------------------------------------------------

      const savedLocation =
        localStorage.getItem(
          "selectedLocation"
        );

      const savedCategory =
        localStorage.getItem(
          "selectedCategory"
        );

      console.log(
        "======================================"
      );

      console.log(
        "Analysis Preview Data"
      );

      console.log(
        "Saved Location:",
        savedLocation
      );

      console.log(
        "Saved Category:",
        savedCategory
      );

      console.log(
        "======================================"
      );

      if (!savedLocation) {
        alert(
          "Please select a location first."
        );

        navigate(
          "/location-selection"
        );

        return;
      }

      if (!savedCategory) {
        alert(
          "Please select a business category first."
        );

        navigate(
          "/business-category"
        );

        return;
      }

      const parsedLocation =
        JSON.parse(
          savedLocation
        );

      const lat =
        Number(
          parsedLocation.latitude
        );

      const lng =
        Number(
          parsedLocation.longitude
        );

      if (
        Number.isNaN(lat) ||
        Number.isNaN(lng)
      ) {
        alert(
          "Selected location coordinates are invalid."
        );

        navigate(
          "/location-selection"
        );

        return;
      }

      setLocation({
        ...parsedLocation,

        latitude: lat,

        longitude: lng,
      });

      setCategory(
        savedCategory
      );

      setCategoryName(
        categoryNames[
          savedCategory
        ] ||
          savedCategory
      );

      // ------------------------------------------------
      // LOAD RADIUS
      // ------------------------------------------------

      const savedRadius =
        localStorage.getItem(
          "analysisRadius"
        );

      if (savedRadius) {
        const parsedRadius =
          Number(savedRadius);

        if (
          !Number.isNaN(
            parsedRadius
          )
        ) {
          setRadius(
            parsedRadius
          );
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

      navigate(
        "/location-selection"
      );
    }
  }, [navigate]);

  // ===================================================
  // START ANALYSIS
  // ===================================================

  const handleStartAnalysis = () => {
    if (!location) {
      alert(
        "Location information is missing."
      );

      navigate(
        "/location-selection"
      );

      return;
    }

    if (!category) {
      alert(
        "Business category is missing."
      );

      navigate(
        "/business-category"
      );

      return;
    }

    // ------------------------------------------------
    // SAVE CURRENT RADIUS
    // ------------------------------------------------

    localStorage.setItem(
      "analysisRadius",
      String(radius)
    );

    // ------------------------------------------------
    // CLEAR OLD ANALYSIS
    // ------------------------------------------------

    localStorage.removeItem(
      "analysisResult"
    );

    console.log(
      "======================================"
    );

    console.log(
      "Starting Analysis"
    );

    console.log(
      "Latitude:",
      location.latitude
    );

    console.log(
      "Longitude:",
      location.longitude
    );

    console.log(
      "Location:",
      location.address
    );

    console.log(
      "Category:",
      category
    );

    console.log(
      "Radius:",
      radius
    );

    console.log(
      "======================================"
    );

    navigate(
      "/analysis"
    );
  };

  // ===================================================
  // CHANGE LOCATION
  // ===================================================

  const handleChangeLocation = () => {
    navigate(
      "/location-selection"
    );
  };

  // ===================================================
  // CHANGE CATEGORY
  // ===================================================

  const handleChangeCategory = () => {
    navigate(
      "/business-category"
    );
  };

  // ===================================================
  // LOADING
  // ===================================================

  if (!location) {
    return (
      <div
        style={{
          padding: "30px",
          maxWidth: "900px",
          margin: "0 auto",
          fontFamily:
            "Arial, sans-serif",
        }}
      >
        <h2>
          Loading Analysis Preview...
        </h2>
      </div>
    );
  }

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
          maxWidth: "900px",
          margin: "0 auto",
        }}
      >
        {/* HEADER */}

        <div
          style={{
            background: "white",
            padding: "30px",
            borderRadius: "16px",
            marginBottom: "25px",
            textAlign: "center",
            boxShadow:
              "0 4px 15px rgba(0,0,0,0.08)",
          }}
        >
          <h1>
            BizLens-AI
          </h1>

          <h2>
            Analysis Preview
          </h2>

          <p
            style={{
              color: "#6b7280",
            }}
          >
            Please review your analysis
            details before starting the
            business location analysis.
          </p>
        </div>

        {/* LOCATION */}

        <div
          style={{
            background: "white",
            padding: "25px",
            borderRadius: "12px",
            marginBottom: "20px",
            border:
              "1px solid #e5e7eb",
            boxShadow:
              "0 2px 8px rgba(0,0,0,0.05)",
          }}
        >
          <h3>
            📍 Selected Location
          </h3>

          <p>
            <strong>
              Location:
            </strong>{" "}
            {location.address ||
              location.name ||
              "Selected Location"}
          </p>

          <p>
            <strong>
              Latitude:
            </strong>{" "}
            {location.latitude.toFixed(
              6
            )}
          </p>

          <p>
            <strong>
              Longitude:
            </strong>{" "}
            {location.longitude.toFixed(
              6
            )}
          </p>

          <button
            onClick={
              handleChangeLocation
            }
            style={{
              padding:
                "10px 16px",

              cursor:
                "pointer",
            }}
          >
            Change Location
          </button>
        </div>

        {/* BUSINESS */}

        <div
          style={{
            background: "white",
            padding: "25px",
            borderRadius: "12px",
            marginBottom: "20px",
            border:
              "1px solid #e5e7eb",
            boxShadow:
              "0 2px 8px rgba(0,0,0,0.05)",
          }}
        >
          <h3>
            🏪 Business Information
          </h3>

          <p>
            <strong>
              Business Category:
            </strong>{" "}
            {categoryName}
          </p>

          <p>
            <strong>
              Category ID:
            </strong>{" "}
            {category}
          </p>

          <button
            onClick={
              handleChangeCategory
            }
            style={{
              padding:
                "10px 16px",

              cursor:
                "pointer",
            }}
          >
            Change Business Category
          </button>
        </div>

        {/* RADIUS */}

        <div
          style={{
            background: "white",
            padding: "25px",
            borderRadius: "12px",
            marginBottom: "20px",
            border:
              "1px solid #e5e7eb",
          }}
        >
          <h3>
            📏 Analysis Radius
          </h3>

          <select
            value={radius}
            onChange={(e) =>
              setRadius(
                Number(
                  e.target.value
                )
              )
            }
            style={{
              padding: "12px",
              width: "100%",
              maxWidth: "300px",
              border:
                "1px solid #d1d5db",
              borderRadius:
                "8px",
              fontSize: "16px",
            }}
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
        </div>

        {/* SUMMARY */}

        <div
          style={{
            background: "#eff6ff",
            padding: "25px",
            borderRadius: "12px",
            marginBottom: "25px",
          }}
        >
          <h3>
            📊 Analysis Summary
          </h3>

          <p>
            BizLens-AI will analyze:
          </p>

          <ul>
            <li>
              <strong>
                Location:
              </strong>{" "}
              {location.address ||
                "Selected Location"}
            </li>

            <li>
              <strong>
                Latitude:
              </strong>{" "}
              {location.latitude.toFixed(
                6
              )}
            </li>

            <li>
              <strong>
                Longitude:
              </strong>{" "}
              {location.longitude.toFixed(
                6
              )}
            </li>

            <li>
              <strong>
                Business:
              </strong>{" "}
              {categoryName}
            </li>

            <li>
              <strong>
                Radius:
              </strong>{" "}
              {radius} km
            </li>
          </ul>

          <p>
            The system will analyze nearby
            businesses, competition,
            demand indicators,
            accessibility, and other
            available location data.
          </p>
        </div>

        {/* ACTION BUTTONS */}

        <div
          style={{
            display: "flex",
            gap: "12px",
            flexWrap: "wrap",
          }}
        >
          <button
            onClick={() =>
              navigate(
                "/business-category"
              )
            }
            style={{
              padding:
                "12px 20px",
              cursor:
                "pointer",
            }}
          >
            ← Back
          </button>

          <button
            onClick={
              handleStartAnalysis
            }
            style={{
              padding:
                "12px 25px",

              cursor:
                "pointer",

              fontWeight:
                "bold",

              background:
                "#2563eb",

              color: "white",

              border: "none",

              borderRadius:
                "8px",
            }}
          >
            🚀 Start Analysis
          </button>
        </div>
      </div>
    </div>
  );
}

export default AnalysisPreview;
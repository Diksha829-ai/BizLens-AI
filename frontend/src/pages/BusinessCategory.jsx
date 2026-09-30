import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import "../styles/business-category.css";

function BusinessCategory() {
  const navigate = useNavigate();

  const [latitude, setLatitude] = useState(null);
  const [longitude, setLongitude] = useState(null);
  const [locationName, setLocationName] = useState("");
  const [category, setCategory] = useState("");

  // ===================================================
  // LOAD SELECTED LOCATION
  // ===================================================

  useEffect(() => {
    const savedLatitude =
      localStorage.getItem("selectedLatitude");

    const savedLongitude =
      localStorage.getItem("selectedLongitude");

    const savedLocationName =
      localStorage.getItem("selectedLocationName");

    console.log(
      "======================================"
    );

    console.log(
      "Business Category - Selected Location"
    );

    console.log("Latitude:", savedLatitude);
    console.log("Longitude:", savedLongitude);
    console.log("Location:", savedLocationName);

    console.log(
      "======================================"
    );

    if (!savedLatitude || !savedLongitude) {
      alert("Please select a location first.");

      navigate("/location-selection");

      return;
    }

    setLatitude(parseFloat(savedLatitude));
    setLongitude(parseFloat(savedLongitude));

    setLocationName(savedLocationName || "");

    // -------------------------------------------------
    // LOAD PREVIOUS CATEGORY
    // -------------------------------------------------

    const savedCategory =
      localStorage.getItem("selectedCategory");

    if (savedCategory) {
      setCategory(savedCategory);
    }
  }, [navigate]);

  // ===================================================
  // BUSINESS CATEGORIES
  // ===================================================

  const categories = [
  // 🍽️ Food & Beverages
  {
    name: "Cafe",
    value: "cafe",
    emoji: "☕",
    description: "Coffee, beverages & snacks",
  },
  {
    name: "Restaurant",
    value: "restaurant",
    emoji: "🍽️",
    description: "Dining & food services",
  },
  {
    name: "Bakery",
    value: "bakery",
    emoji: "🥐",
    description: "Bread, cakes & baked foods",
  },
  {
    name: "Fast Food",
    value: "fast_food",
    emoji: "🍔",
    description: "Quick meals & takeaway",
  },
  {
    name: "Juice & Shake Shop",
    value: "juice_shop",
    emoji: "🥤",
    description: "Fresh juices, shakes & drinks",
  },

  // 🛒 Daily Essentials
  {
    name: "Grocery Store",
    value: "grocery",
    emoji: "🛒",
    description: "Daily groceries & essentials",
  },
  {
    name: "Supermarket",
    value: "supermarket",
    emoji: "🏪",
    description: "Groceries & household products",
  },
  {
    name: "Vegetable & Fruit Shop",
    value: "vegetable_fruit",
    emoji: "🥦",
    description: "Fresh fruits & vegetables",
  },
  {
    name: "Dairy & Milk Shop",
    value: "dairy",
    emoji: "🥛",
    description: "Milk, dairy & daily products",
  },
  {
    name: "Meat & Chicken Shop",
    value: "meat",
    emoji: "🍗",
    description: "Fresh meat & poultry",
  },

  // 💊 Healthcare
  {
    name: "Medical Store",
    value: "pharmacy",
    emoji: "💊",
    description: "Medicines & healthcare",
  },
  {
    name: "Clinic",
    value: "clinic",
    emoji: "🏥",
    description: "General medical services",
  },
  {
    name: "Dental Clinic",
    value: "dentist",
    emoji: "🦷",
    description: "Dental care & treatment",
  },
  {
    name: "Diagnostic Center",
    value: "diagnostic",
    emoji: "🧪",
    description: "Medical tests & diagnostics",
  },
  {
    name: "Optical Store",
    value: "optical",
    emoji: "👓",
    description: "Eyewear & vision products",
  },

  // 💇 Personal Care
  {
    name: "Salon",
    value: "salon",
    emoji: "💇",
    description: "Beauty & personal care",
  },
  {
    name: "Beauty Parlour",
    value: "beauty_parlour",
    emoji: "💅",
    description: "Beauty treatments & grooming",
  },
  {
    name: "Spa",
    value: "spa",
    emoji: "🧖",
    description: "Relaxation & wellness",
  },

  // 🏋️ Fitness
  {
    name: "Gym",
    value: "gym",
    emoji: "🏋️",
    description: "Fitness & wellness",
  },
  {
    name: "Yoga Center",
    value: "yoga",
    emoji: "🧘",
    description: "Yoga & fitness classes",
  },
  {
    name: "Sports Center",
    value: "sports_center",
    emoji: "🏸",
    description: "Sports & recreational activities",
  },

  // 👕 Shopping
  {
    name: "Clothing Store",
    value: "clothing",
    emoji: "👕",
    description: "Fashion & apparel",
  },
  {
    name: "Footwear Store",
    value: "footwear",
    emoji: "👟",
    description: "Shoes & footwear",
  },
  {
    name: "Mobile & Accessories",
    value: "mobile_store",
    emoji: "📱",
    description: "Mobiles & electronic accessories",
  },
  {
    name: "Electronics Store",
    value: "electronics",
    emoji: "💻",
    description: "Electronics & appliances",
  },
  {
    name: "Furniture Store",
    value: "furniture",
    emoji: "🛋️",
    description: "Furniture & home products",
  },

  // 🏠 Home Services
  {
    name: "Hardware Store",
    value: "hardware",
    emoji: "🔧",
    description: "Tools, hardware & supplies",
  },
  {
    name: "Electrical Store",
    value: "electrical",
    emoji: "💡",
    description: "Electrical goods & equipment",
  },
  {
    name: "Plumbing Store",
    value: "plumbing",
    emoji: "🚰",
    description: "Plumbing supplies & fittings",
  },
  {
    name: "Laundry",
    value: "laundry",
    emoji: "🧺",
    description: "Laundry & dry cleaning",
  },

  // 📚 Education
  {
    name: "Tuition Center",
    value: "tuition",
    emoji: "📚",
    description: "Academic coaching & tuition",
  },
  {
    name: "Computer Institute",
    value: "computer_institute",
    emoji: "🖥️",
    description: "Computer & technical training",
  },
  {
    name: "Stationery Store",
    value: "stationery",
    emoji: "✏️",
    description: "Stationery & school supplies",
  },

  // 🚗 Automotive
  {
    name: "Petrol Pump",
    value: "petrol_pump",
    emoji: "⛽",
    description: "Fuel & vehicle services",
  },
  {
    name: "Car Service Center",
    value: "car_service",
    emoji: "🚗",
    description: "Car repair & maintenance",
  },
  {
    name: "Bike Service Center",
    value: "bike_service",
    emoji: "🏍️",
    description: "Two-wheeler repair & service",
  },
  {
    name: "Car Wash",
    value: "car_wash",
    emoji: "🚿",
    description: "Vehicle cleaning & detailing",
  },

  // 🐶 Other Daily Services
  {
    name: "Pet Shop",
    value: "pet_shop",
    emoji: "🐶",
    description: "Pet supplies & products",
  },
  {
    name: "Mobile Repair",
    value: "mobile_repair",
    emoji: "📱",
    description: "Mobile repair & servicing",
  },
  {
    name: "Courier & Parcel",
    value: "courier",
    emoji: "📦",
    description: "Courier & delivery services",
  },
  {
    name: "Printing & Xerox",
    value: "printing",
    emoji: "🖨️",
    description: "Printing, scanning & photocopy",
  },
  {
    name: "General Store",
    value: "general_store",
    emoji: "🏬",
    description: "Everyday household products",
  },
];
  // ===================================================
  // CATEGORY SELECT
  // ===================================================

  const handleCategorySelect = (value) => {
    setCategory(value);
  };

  // ===================================================
  // CONTINUE
  // ===================================================

  const handleContinue = () => {
    if (!category) {
      alert("Please select a business category.");
      return;
    }

    // Save category
    localStorage.setItem(
      "selectedCategory",
      category
    );

    // Remove old analysis
    localStorage.removeItem("analysisResult");

    console.log(
      "======================================"
    );

    console.log("Business Category Saved");
    console.log("Category:", category);
    console.log("Location:", locationName);
    console.log("Latitude:", latitude);
    console.log("Longitude:", longitude);

    console.log(
      "======================================"
    );

    navigate("/analysis-preview");
  };

  // ===================================================
  // BACK
  // ===================================================

  const handleBack = () => {
    navigate("/location-selection");
  };

  // ===================================================
  // UI
  // ===================================================

  return (
    <div className="business-category-page">

      {/* =================================================
          TOP NAVIGATION
          ================================================= */}

      <header className="category-header">

        {/* LOGO */}

        <div className="category-logo">

          <div className="category-logo-icon">
            B
          </div>

          <div>
            <div className="category-logo-name">
              BizLens
            </div>

            <div className="category-logo-ai">
              AI
            </div>
          </div>

        </div>

        {/* STEP INDICATOR */}

        <div className="category-step">

          <span className="step-completed">
            01
          </span>

          <div className="step-line"></div>

          <span className="step-active">
            02
          </span>

          <div className="step-line"></div>

          <span className="step-pending">
            03
          </span>

          <div className="step-line"></div>

          <span className="step-pending">
            04
          </span>

        </div>

        <div className="category-step-label">
          Business Category
        </div>

      </header>


      {/* =================================================
          MAIN
          ================================================= */}

      <main className="business-category-main">

        {/* =================================================
            PAGE INTRO
            ================================================= */}

        <section className="category-intro">

          <div className="category-badge">
            🏪 BUSINESS TYPE
          </div>

          <h1>
            What business do you want
            <br />
            to open?
          </h1>

          <p>
            Select the type of business you want
            to analyze at your chosen location.
          </p>

        </section>


        {/* =================================================
            SELECTED LOCATION
            ================================================= */}

        <section className="selected-location-card">

          <div className="location-icon">
            📍
          </div>

          <div className="location-content">

            <span className="location-label">
              SELECTED LOCATION
            </span>

            <h3>
              {locationName ||
                "Selected Location"}
            </h3>

            <div className="coordinates">

              <span>
                Latitude:{" "}
                {latitude !== null
                  ? latitude.toFixed(6)
                  : "..."}
              </span>

              <span>
                Longitude:{" "}
                {longitude !== null
                  ? longitude.toFixed(6)
                  : "..."}
              </span>

            </div>

          </div>

          <button
            type="button"
            className="change-location-button"
            onClick={handleBack}
          >
            Change Location
          </button>

        </section>


        {/* =================================================
            CATEGORY CARD
            ================================================= */}

        <section className="category-selection-card">

          <div className="category-card-header">

            <div>

              <h2>
                Choose a business category
              </h2>

              <p>
                Select one category to continue
                with the location analysis.
              </p>

            </div>

            <div className="category-count">
              {categories.length} categories
            </div>

          </div>


          {/* =================================================
              CATEGORY GRID
              ================================================= */}

          <div className="business-category-grid">

            {categories.map((item) => {

              const isSelected =
                category === item.value;

              return (
                <button
                  key={item.value}
                  type="button"
                  className={`business-category-card ${
                    isSelected
                      ? "selected"
                      : ""
                  }`}
                  onClick={() =>
                    handleCategorySelect(
                      item.value
                    )
                  }
                >

                  {/* SELECTED CHECK */}

                  {isSelected && (
                    <div className="category-check">
                      ✓
                    </div>
                  )}

                  {/* ICON */}

                  <div className="business-category-icon">
                    {item.emoji}
                  </div>

                  {/* NAME */}

                  <h3>
                    {item.name}
                  </h3>

                  {/* DESCRIPTION */}

                  <p>
                    {item.description}
                  </p>

                </button>
              );

            })}

          </div>


          {/* =================================================
              SELECTED CATEGORY INFO
              ================================================= */}

          <div
            className={`selected-category-info ${
              category
                ? "visible"
                : ""
            }`}
          >

            {category && (
              <>
                <span>
                  Selected business:
                </span>

                <strong>
                  {
                    categories.find(
                      (item) =>
                        item.value ===
                        category
                    )?.name
                  }
                </strong>
              </>
            )}

          </div>


          {/* =================================================
              ACTION BUTTONS
              ================================================= */}

          <div className="category-actions">

            <button
              type="button"
              className="category-back-button"
              onClick={handleBack}
            >
              <span>←</span>
              Back
            </button>

            <button
              type="button"
              className="category-continue-button"
              onClick={handleContinue}
              disabled={!category}
            >
              Continue to Analysis Preview
              <span>→</span>
            </button>

          </div>

        </section>


        {/* =================================================
            INFO
            ================================================= */}

        <div className="category-info">

          <span className="info-icon">
            💡
          </span>

          <div>
            <strong>
              Why do we need this?
            </strong>

            <p>
              Your business category determines
              which competitors, demand indicators,
              nearby businesses and location factors
              BizLens-AI analyzes.
            </p>
          </div>

        </div>

      </main>


      {/* =================================================
          FOOTER
          ================================================= */}

      <footer className="category-footer">

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

export default BusinessCategory;
import { useEffect, useState } from "react";

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
// MAP CENTER
// ============================================================

function MapUpdater({
  latitude,
  longitude,
}) {
  const map = useMap();

  useEffect(() => {
    if (
      latitude !== null &&
      longitude !== null
    ) {
      map.setView(
        [
          latitude,
          longitude,
        ],
        14
      );
    }
  }, [
    latitude,
    longitude,
    map,
  ]);

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
  // ==========================================================
  // LOCATION
  // ==========================================================

  const [latitude, setLatitude] =
    useState(null);

  const [longitude, setLongitude] =
    useState(null);

  const [address, setAddress] =
    useState("");

  // ==========================================================
  // BUSINESS
  // ==========================================================

  const [radius, setRadius] =
    useState(3);

  const [category, setCategory] =
    useState(null);

  // ==========================================================
  // ANALYSIS
  // ==========================================================

  const [analysisData, setAnalysisData] =
    useState(null);

  const [loading, setLoading] =
    useState(false);

  const [error, setError] =
    useState("");

  // ==========================================================
  // LOAD CURRENT LOCATION + CATEGORY
  // ==========================================================

  useEffect(() => {
    try {
      // ------------------------------------------------------
      // LOCATION
      // ------------------------------------------------------

      const savedLocation =
        localStorage.getItem(
          "selectedLocation"
        );

      // ------------------------------------------------------
      // CATEGORY
      // ------------------------------------------------------

      const savedCategory =
        localStorage.getItem(
          "selectedCategory"
        );

      // ------------------------------------------------------
      // RADIUS
      // ------------------------------------------------------

      const savedRadius =
        localStorage.getItem(
          "analysisRadius"
        );

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
      // CHECK LOCATION
      // ------------------------------------------------------

      if (!savedLocation) {
        setError(
          "No location selected. Please go back and select a location."
        );

        return;
      }

      const location =
        JSON.parse(
          savedLocation
        );

      const selectedLatitude =
        Number(
          location.latitude
        );

      const selectedLongitude =
        Number(
          location.longitude
        );

      if (
        Number.isNaN(
          selectedLatitude
        ) ||
        Number.isNaN(
          selectedLongitude
        )
      ) {
        setError(
          "Selected location coordinates are invalid."
        );

        return;
      }

      // ------------------------------------------------------
      // SET LOCATION
      // ------------------------------------------------------

      setLatitude(
        selectedLatitude
      );

      setLongitude(
        selectedLongitude
      );

      setAddress(
        location.address ||
          location.displayName ||
          location.name ||
          "Selected Location"
      );

      // ------------------------------------------------------
      // CHECK CATEGORY
      // ------------------------------------------------------

      if (!savedCategory) {
        setError(
          "No business category selected. Please go back and select a business category."
        );

        return;
      }

      // ------------------------------------------------------
      // SET CATEGORY
      // ------------------------------------------------------

      setCategory(
        savedCategory
      );

      // ------------------------------------------------------
      // SET RADIUS
      // ------------------------------------------------------

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

  const handleAnalysis = async (
    event
  ) => {
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
      setError(
        "Please select a location first."
      );

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

    const token =
      localStorage.getItem(
        "token"
      );

    if (!token) {
      setError(
        "Your login session has expired. Please login again."
      );

      return;
    }

    setLoading(true);

    try {
      console.log(
        "======================================"
      );

      console.log(
        "BizLens-AI Location Analysis"
      );

      console.log(
        "======================================"
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
        "Address:",
        address
      );

      console.log(
        "Radius:",
        radius
      );

      console.log(
        "Category:",
        category
      );

      // ------------------------------------------------------
      // API REQUEST
      // ------------------------------------------------------

      const response =
        await fetch(
          "http://localhost:5000/api/analysis",
          {
            method: "POST",

            headers: {
              "Content-Type":
                "application/json",

              Authorization:
                `Bearer ${token}`,
            },

            body: JSON.stringify({
              latitude:
                Number(latitude),

              longitude:
                Number(longitude),

              radius:
                Number(radius),

              category:
                category,
            }),
          }
        );

      // ------------------------------------------------------
      // RESPONSE
      // ------------------------------------------------------

      const data =
        await response.json();

      console.log(
        "Analysis response:",
        data
      );

      if (!response.ok) {
        throw new Error(
          data.message ||
            "Location analysis failed."
        );
      }

      // ------------------------------------------------------
      // SAVE RESULT
      // ------------------------------------------------------

      setAnalysisData(
        data.data
      );

      localStorage.setItem(
        "analysisResult",
        JSON.stringify(
          data.data
        )
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
      <div
        style={{
          minHeight: "100vh",
          padding: "40px",
          fontFamily:
            "Arial, sans-serif",
        }}
      >
        <h1>
          BizLens-AI
        </h1>

        <h2>
          Location Analysis
        </h2>

        <div
          style={{
            padding: "20px",
            borderRadius: "10px",
            background:
              "#fee2e2",
            color:
              "#991b1b",
            marginTop: "20px",
          }}
        >
          {error ||
            "Loading selected analysis information..."}
        </div>

        <button
          onClick={() =>
            window.history.back()
          }
          style={{
            marginTop: "20px",
            padding:
              "10px 20px",
            cursor:
              "pointer",
          }}
        >
          ← Go Back
        </button>
      </div>
    );
  }

  // ==========================================================
  // RESULT VALUES
  // ==========================================================

  const businessSuccess =
    analysisData
      ?.businessSuccess;

  const demand =
    analysisData?.demand;

  const competitors =
    analysisData?.competitors;

  const accessibility =
    analysisData
      ?.accessibility;

  const risk =
    analysisData?.risk;

  // ==========================================================
  // RENDER
  // ==========================================================

  return (
    <div
      style={{
        minHeight: "100vh",
        background:
          "#f5f7fb",
        padding: "25px",
        fontFamily:
          "Arial, sans-serif",
      }}
    >
      {/* =====================================================
          HEADER
      ====================================================== */}

      <div
        style={{
          maxWidth:
            "1200px",
          margin:
            "0 auto 25px",
        }}
      >
        <h1>
          BizLens-AI
        </h1>

        <p>
          AI-Powered Business
          Location Intelligence
        </p>
      </div>

      {/* =====================================================
          SELECTED LOCATION
      ====================================================== */}

      <div
        style={{
          maxWidth:
            "1200px",
          margin:
            "0 auto 20px",
          padding: "20px",
          background:
            "white",
          borderRadius:
            "12px",
          boxShadow:
            "0 2px 10px rgba(0,0,0,0.08)",
        }}
      >
        <h2>
          Selected Location
        </h2>

        <p>
          <strong>
            Address:
          </strong>{" "}
          {address}
        </p>

        <p>
          <strong>
            Latitude:
          </strong>{" "}
          {latitude.toFixed(
            6
          )}
        </p>

        <p>
          <strong>
            Longitude:
          </strong>{" "}
          {longitude.toFixed(
            6
          )}
        </p>

        <p>
          <strong>
            Business Category:
          </strong>{" "}
          {
            CATEGORY_NAMES[
              category
            ] || category
          }
        </p>
      </div>

      {/* =====================================================
          MAP
      ====================================================== */}

      <div
        style={{
          maxWidth:
            "1200px",
          margin:
            "0 auto 25px",
          background:
            "white",
          padding: "15px",
          borderRadius:
            "12px",
          boxShadow:
            "0 2px 10px rgba(0,0,0,0.08)",
        }}
      >
        <h2>
          Analysis Map
        </h2>

        <p
          style={{
            color: "#6b7280",
          }}
        >
          The map is centered on your
          selected business location.
        </p>

        <div
          style={{
            height:
              "450px",
            width: "100%",
          }}
        >
          <MapContainer
            center={[
              latitude,
              longitude,
            ]}
            zoom={14}
            scrollWheelZoom={
              true
            }
            style={{
              height: "100%",
              width: "100%",
              borderRadius:
                "10px",
            }}
          >
            <TileLayer
              attribution='&copy; OpenStreetMap contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />

            <MapUpdater
              latitude={
                latitude
              }
              longitude={
                longitude
              }
            />

            <Marker
              position={[
                latitude,
                longitude,
              ]}
            >
              <Popup>
                <strong>
                  📍 Selected Business
                  Location
                </strong>

                <br />

                {address}

                <br />

                <br />

                Business:{" "}
                {
                  CATEGORY_NAMES[
                    category
                  ] || category
                }

                <br />

                Latitude:{" "}
                {latitude}

                <br />

                Longitude:{" "}
                {longitude}
              </Popup>
            </Marker>

            <Circle
              center={[
                latitude,
                longitude,
              ]}
              radius={
                Number(radius) *
                1000
              }
              pathOptions={{
                fillOpacity:
                  0.15,
              }}
            />
          </MapContainer>
        </div>
      </div>

      {/* =====================================================
          ANALYSIS FORM
      ====================================================== */}

      <div
        style={{
          maxWidth:
            "1200px",
          margin:
            "0 auto 25px",
          padding: "20px",
          background:
            "white",
          borderRadius:
            "12px",
          boxShadow:
            "0 2px 10px rgba(0,0,0,0.08)",
        }}
      >
        <h2>
          Business Analysis
        </h2>

        <form
          onSubmit={
            handleAnalysis
          }
        >
          <div
            style={{
              display:
                "grid",
              gridTemplateColumns:
                "repeat(auto-fit, minmax(200px, 1fr))",
              gap: "15px",
            }}
          >
            {/* RADIUS */}

            <div>
              <label>
                <strong>
                  Radius (km)
                </strong>
              </label>

              <br />

              <select
                value={radius}
                onChange={(e) =>
                  setRadius(
                    Number(
                      e.target
                        .value
                    )
                  )
                }
                style={{
                  width:
                    "100%",
                  padding:
                    "10px",
                  marginTop:
                    "5px",
                }}
              >
                <option
                  value={2}
                >
                  2 km
                </option>

                <option
                  value={3}
                >
                  3 km
                </option>

                <option
                  value={4}
                >
                  4 km
                </option>

                <option
                  value={5}
                >
                  5 km
                </option>
              </select>
            </div>

            {/* BUSINESS CATEGORY */}

            <div>
              <label>
                <strong>
                  Business Category
                </strong>
              </label>

              <div
                style={{
                  marginTop:
                    "5px",
                  padding:
                    "10px",
                  background:
                    "#f3f4f6",
                  border:
                    "1px solid #d1d5db",
                  borderRadius:
                    "6px",
                  fontWeight:
                    "600",
                }}
              >
                {
                  CATEGORY_NAMES[
                    category
                  ] || category
                }
              </div>

              <small
                style={{
                  color:
                    "#6b7280",
                }}
              >
                Selected from the
                previous step
              </small>
            </div>
          </div>

          <button
            type="submit"
            disabled={
              loading
            }
            style={{
              marginTop:
                "20px",
              padding:
                "12px 25px",
              border: "none",
              borderRadius:
                "8px",
              cursor:
                loading
                  ? "not-allowed"
                  : "pointer",
              background:
                "#2563eb",
              color:
                "white",
              fontWeight:
                "600",
            }}
          >
            {loading
              ? "Analyzing..."
              : "Analyze Location"}
          </button>
        </form>

        {error && (
          <div
            style={{
              marginTop:
                "20px",
              padding:
                "15px",
              borderRadius:
                "8px",
              background:
                "#fee2e2",
              color:
                "#991b1b",
            }}
          >
            {error}
          </div>
        )}
      </div>

      {/* =====================================================
          ANALYSIS RESULTS
      ====================================================== */}

      {analysisData && (
        <div
          style={{
            maxWidth:
              "1200px",
            margin:
              "0 auto",
          }}
        >
          <h2>
            Analysis Results
          </h2>

          {/* SUCCESS SCORE */}

          <div
            style={{
              background:
                "white",
              padding:
                "25px",
              borderRadius:
                "12px",
              textAlign:
                "center",
              marginBottom:
                "20px",
              boxShadow:
                "0 2px 10px rgba(0,0,0,0.08)",
            }}
          >
            <h3>
              Business Success Score
            </h3>

            <div
              style={{
                fontSize:
                  "60px",
                fontWeight:
                  "bold",
              }}
            >
              {businessSuccess?.score ??
                0}
              %
            </div>

            <p>
              {businessSuccess?.level ??
                "N/A"}
            </p>

            <p>
              Confidence:{" "}
              <strong>
                {businessSuccess?.confidence ??
                  "N/A"}
              </strong>
            </p>
          </div>

          {/* SCORE CARDS */}

          <div
            style={{
              display:
                "grid",
              gridTemplateColumns:
                "repeat(auto-fit, minmax(200px, 1fr))",
              gap: "15px",
            }}
          >
            <ScoreCard
              title="Demand Score"
              value={
                demand?.score ??
                0
              }
            />

            <ScoreCard
              title="Competition Score"
              value={
                competitors?.score ??
                0
              }
            />

            <ScoreCard
              title="Accessibility Score"
              value={
                accessibility?.score ??
                0
              }
            />

            <ScoreCard
              title="Risk Score"
              value={
                risk?.score ??
                0
              }
            />
          </div>

          {/* COMPETITION */}

          <div
            style={{
              marginTop:
                "20px",
              padding:
                "20px",
              background:
                "white",
              borderRadius:
                "12px",
            }}
          >
            <h3>
              Competition
            </h3>

            <p>
              Competitors:{" "}
              <strong>
                {competitors?.count ??
                  0}
              </strong>
            </p>

            <p>
              Within 500m:{" "}
              <strong>
                {competitors?.within500m ??
                  0}
              </strong>
            </p>

            <p>
              Within 1km:{" "}
              <strong>
                {competitors?.within1km ??
                  0}
              </strong>
            </p>

            <p>
              Nearest Competitor:{" "}
              <strong>
                {competitors
                  ?.nearest
                  ?.name ||
                  "None"}
              </strong>
            </p>

            <p>
              Average Distance:{" "}
              <strong>
                {competitors
                  ?.averageDistance ??
                  "N/A"}{" "}
                km
              </strong>
            </p>
          </div>

          {/* DEMAND */}

          <div
            style={{
              marginTop:
                "20px",
              padding:
                "20px",
              background:
                "white",
              borderRadius:
                "12px",
            }}
          >
            <h3>
              Demand Indicators
            </h3>

            <p>
              Education:{" "}
              {demand?.education ??
                0}
            </p>

            <p>
              Offices:{" "}
              {demand?.offices ??
                0}
            </p>

            <p>
              Hospitals:{" "}
              {demand?.hospitals ??
                0}
            </p>

            <p>
              Clinics:{" "}
              {demand?.clinics ??
                0}
            </p>

            <p>
              Pharmacies:{" "}
              {demand?.pharmacies ??
                0}
            </p>

            <p>
              Shopping:{" "}
              {demand?.shopping ??
                0}
            </p>

            <p>
              Transport:{" "}
              {demand?.transport ??
                0}
            </p>

            <p>
              Tourism:{" "}
              {demand?.tourism ??
                0}
            </p>

            <p>
              Residential:{" "}
              {demand?.residential ??
                0}
            </p>
          </div>

          {/* ACCESSIBILITY */}

          <div
            style={{
              marginTop:
                "20px",
              padding:
                "20px",
              background:
                "white",
              borderRadius:
                "12px",
            }}
          >
            <h3>
              Accessibility
            </h3>

            <p>
              Transport:{" "}
              {accessibility
                ?.transport ??
                0}
            </p>

            <p>
              Roads:{" "}
              {accessibility?.roads ??
                0}
            </p>

            <p>
              Parking:{" "}
              {accessibility?.parking ??
                0}
            </p>

            <p>
              Walkable Paths:{" "}
              {accessibility?.walkable ??
                0}
            </p>
          </div>

          {/* RECOMMENDATIONS */}

          {analysisData
            ?.recommendations
            ?.length > 0 && (
            <div
              style={{
                marginTop:
                  "20px",
                padding:
                  "20px",
                background:
                  "white",
                borderRadius:
                  "12px",
              }}
            >
              <h3>
                Recommendations
              </h3>

              <ul>
                {analysisData.recommendations.map(
                  (
                    recommendation,
                    index
                  ) => (
                    <li
                      key={
                        index
                      }
                      style={{
                        marginBottom:
                          "10px",
                      }}
                    >
                      {typeof recommendation ===
                      "string"
                        ? recommendation
                        : recommendation.message ||
                          recommendation.text ||
                          JSON.stringify(
                            recommendation
                          )}
                    </li>
                  )
                )}
              </ul>
            </div>
          )}

          {/* COMPETITOR LIST */}

          {analysisData
            ?.competitorBusinesses
            ?.length > 0 && (
            <div
              style={{
                marginTop:
                  "20px",
                padding:
                  "20px",
                background:
                  "white",
                borderRadius:
                  "12px",
              }}
            >
              <h3>
                Nearby Competitors
              </h3>

              {analysisData.competitorBusinesses.map(
                (
                  competitor,
                  index
                ) => (
                  <div
                    key={
                      competitor.id ||
                      index
                    }
                    style={{
                      padding:
                        "12px 0",
                      borderBottom:
                        "1px solid #ddd",
                    }}
                  >
                    <strong>
                      {
                        competitor.name
                      }
                    </strong>

                    <br />

                    Category:{" "}
                    {
                      competitor.category
                    }

                    <br />

                    Distance:{" "}
                    {
                      competitor.distance
                    }{" "}
                    km
                  </div>
                )
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ============================================================
// SCORE CARD
// ============================================================

function ScoreCard({
  title,
  value,
}) {
  return (
    <div
      style={{
        background:
          "white",
        padding:
          "20px",
        borderRadius:
          "12px",
        textAlign:
          "center",
        boxShadow:
          "0 2px 10px rgba(0,0,0,0.08)",
      }}
    >
      {title}

      <div
        style={{
          fontSize:
            "35px",
          fontWeight:
            "bold",
        }}
      >
        {value}
      </div>

      <small>
        out of 100
      </small>
    </div>
  );
}

export default Analysis;
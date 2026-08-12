import {
  useEffect,
  useState,
} from "react";

import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  useMap,
  useMapEvents,
} from "react-leaflet";

import L from "leaflet";

import "leaflet/dist/leaflet.css";

import { useNavigate } from "react-router-dom";

// =====================================================
// CUSTOM LOCATION ICON
// =====================================================

const locationIcon = L.divIcon({
  className: "location-marker",

  html: `
    <div
      style="
        width: 24px;
        height: 24px;
        background: #2563eb;
        border: 4px solid white;
        border-radius: 50%;
        box-shadow: 0 2px 8px rgba(0,0,0,0.4);
      "
    ></div>
  `,

  iconSize: [
    32,
    32,
  ],

  iconAnchor: [
    16,
    16,
  ],
});

// =====================================================
// MAP CLICK HANDLER
// =====================================================

function MapClickHandler({
  onLocationSelect,
}) {
  useMapEvents({
    click(event) {
      onLocationSelect(
        event.latlng.lat,
        event.latlng.lng,
        "Map selected location"
      );
    },
  });

  return null;
}

// =====================================================
// MAP CONTROLLER
// =====================================================

function MapController({
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
        map.getZoom()
      );
    }
  }, [
    latitude,
    longitude,
    map,
  ]);

  return null;
}

// =====================================================
// LOCATION SELECTION
// =====================================================

function LocationSelection() {
  const navigate =
    useNavigate();

  // ===================================================
  // DEFAULT LOCATION
  // ===================================================

  const [latitude, setLatitude] =
    useState(16.705);

  const [longitude, setLongitude] =
    useState(74.2433);

  // ===================================================
  // LOCATION STATUS
  // ===================================================

  const [selected, setSelected] =
    useState(false);

  // ===================================================
  // SEARCH
  // ===================================================

  const [searchText, setSearchText] =
    useState("");

  const [searching, setSearching] =
    useState(false);

  const [searchError, setSearchError] =
    useState("");

  // ===================================================
  // LOCATION NAME
  // ===================================================

  const [placeName, setPlaceName] =
    useState("");

  // ===================================================
  // LOAD PREVIOUSLY SAVED LOCATION
  // ===================================================

  useEffect(() => {
    try {
      const savedLocation =
        localStorage.getItem(
          "selectedLocation"
        );

      if (!savedLocation) {
        return;
      }

      const location =
        JSON.parse(
          savedLocation
        );

      const savedLatitude =
        Number(
          location.latitude
        );

      const savedLongitude =
        Number(
          location.longitude
        );

      if (
        !Number.isNaN(
          savedLatitude
        ) &&
        !Number.isNaN(
          savedLongitude
        )
      ) {
        setLatitude(
          savedLatitude
        );

        setLongitude(
          savedLongitude
        );

        setSelected(true);

        setPlaceName(
          location.address ||
            location.name ||
            "Selected Location"
        );

        console.log(
          "Previously saved location loaded:",
          location
        );
      }
    } catch (error) {
      console.error(
        "Error loading saved location:",
        error
      );
    }
  }, []);

  // ===================================================
  // SAVE LOCATION TO LOCAL STORAGE
  // ===================================================

  const saveLocation = (
    lat,
    lng,
    name
  ) => {
    const selectedLocation = {
      latitude: Number(lat),

      longitude: Number(lng),

      address:
        name ||
        "Selected Location",
    };

    // -----------------------------------------------
    // SAVE COMPLETE LOCATION
    // -----------------------------------------------

    localStorage.setItem(
      "selectedLocation",
      JSON.stringify(
        selectedLocation
      )
    );

    // -----------------------------------------------
    // SAVE INDIVIDUAL VALUES
    // -----------------------------------------------

    localStorage.setItem(
      "selectedLatitude",
      String(lat)
    );

    localStorage.setItem(
      "selectedLongitude",
      String(lng)
    );

    localStorage.setItem(
      "selectedLocationName",
      name ||
        "Selected Location"
    );

    console.log(
      "======================================"
    );

    console.log(
      "Location saved successfully"
    );

    console.log(
      "Latitude:",
      lat
    );

    console.log(
      "Longitude:",
      lng
    );

    console.log(
      "Address:",
      name ||
        "Selected Location"
    );

    console.log(
      "======================================"
    );
  };

  // ===================================================
  // SELECT LOCATION
  // ===================================================

  const handleLocationSelect = (
    lat,
    lng,
    name = ""
  ) => {
    const selectedLatitude =
      Number(lat);

    const selectedLongitude =
      Number(lng);

    if (
      Number.isNaN(
        selectedLatitude
      ) ||
      Number.isNaN(
        selectedLongitude
      )
    ) {
      setSearchError(
        "Invalid location coordinates."
      );

      return;
    }

    setLatitude(
      selectedLatitude
    );

    setLongitude(
      selectedLongitude
    );

    setSelected(true);

    setPlaceName(
      name ||
        "Selected Location"
    );

    setSearchError("");

    // =================================================
    // SAVE IMMEDIATELY
    // =================================================

    saveLocation(
      selectedLatitude,
      selectedLongitude,
      name ||
        "Selected Location"
    );

    console.log(
      "Location selected:"
    );

    console.log(
      "Latitude:",
      selectedLatitude
    );

    console.log(
      "Longitude:",
      selectedLongitude
    );

    console.log(
      "Name:",
      name
    );
  };

  // ===================================================
  // SEARCH LOCATION
  // ===================================================

  const handleSearch = async (
    e
  ) => {
    e.preventDefault();

    const query =
      searchText.trim();

    if (!query) {
      setSearchError(
        "Please enter a location."
      );

      return;
    }

    try {
      setSearching(true);

      setSearchError("");

      // -------------------------------------------------
      // NOMINATIM SEARCH
      // -------------------------------------------------

      const url =
        `https://nominatim.openstreetmap.org/search` +
        `?format=json` +
        `&q=${encodeURIComponent(
          query
        )}` +
        `&limit=1` +
        `&addressdetails=1`;

      console.log(
        "Searching location:",
        query
      );

      const response =
        await fetch(
          url,
          {
            headers: {
              Accept:
                "application/json",
            },
          }
        );

      if (!response.ok) {
        throw new Error(
          "Search request failed"
        );
      }

      const results =
        await response.json();

      if (
        !results ||
        results.length === 0
      ) {
        setSearchError(
          "Location not found."
        );

        return;
      }

      const result =
        results[0];

      const lat =
        parseFloat(
          result.lat
        );

      const lon =
        parseFloat(
          result.lon
        );

      if (
        Number.isNaN(lat) ||
        Number.isNaN(lon)
      ) {
        setSearchError(
          "Invalid coordinates received from location search."
        );

        return;
      }

      // -------------------------------------------------
      // SELECT SEARCH RESULT
      // -------------------------------------------------

      handleLocationSelect(
        lat,
        lon,
        result.display_name
      );

      console.log(
        "Search result:",
        result.display_name
      );

      console.log(
        "Latitude:",
        lat
      );

      console.log(
        "Longitude:",
        lon
      );
    } catch (error) {
      console.error(
        "Location search error:",
        error
      );

      setSearchError(
        "Unable to search location. Please try again."
      );
    } finally {
      setSearching(false);
    }
  };

  // ===================================================
  // CONTINUE TO BUSINESS CATEGORY
  // ===================================================

  const handleContinue = () => {
    if (!selected) {
      alert(
        "Please select a location first."
      );

      return;
    }

    // =================================================
    // SAVE FINAL LOCATION
    // =================================================

    saveLocation(
      latitude,
      longitude,
      placeName ||
        "Selected Location"
    );

    // =================================================
    // VERIFY
    // =================================================

    console.log(
      "======================================"
    );

    console.log(
      "Selected Location Saved Before Navigation"
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
      placeName ||
        "Selected Location"
    );

    console.log(
      "LocalStorage:",
      localStorage.getItem(
        "selectedLocation"
      )
    );

    console.log(
      "======================================"
    );

    // =================================================
    // NAVIGATE
    // =================================================

    navigate(
      "/business-category"
    );
  };

  // ===================================================
  // CLEAR LOCATION
  // ===================================================

  const handleClear = () => {
    setSelected(false);

    setLatitude(16.705);

    setLongitude(74.2433);

    setPlaceName("");

    setSearchText("");

    setSearchError("");

    // =================================================
    // REMOVE ALL SAVED LOCATION DATA
    // =================================================

    localStorage.removeItem(
      "selectedLocation"
    );

    localStorage.removeItem(
      "selectedLatitude"
    );

    localStorage.removeItem(
      "selectedLongitude"
    );

    localStorage.removeItem(
      "selectedLocationName"
    );

    console.log(
      "Selected location cleared."
    );
  };

  // ===================================================
  // UI
  // ===================================================

  return (
    <div
      style={{
        minHeight:
          "100vh",

        background:
          "#f5f7fb",

        padding:
          "30px",

        fontFamily:
          "Arial, Helvetica, sans-serif",
      }}
    >
      <div
        style={{
          maxWidth:
            "1200px",

          margin:
            "0 auto",
        }}
      >
        {/* =================================================
            HEADER
        ================================================== */}

        <div
          style={{
            background:
              "#ffffff",

            padding:
              "30px",

            borderRadius:
              "16px",

            marginBottom:
              "25px",

            textAlign:
              "center",

            boxShadow:
              "0 4px 15px rgba(0,0,0,0.08)",
          }}
        >
          <h1>
            Select Business Location
          </h1>

          <p
            style={{
              color:
                "#6b7280",
            }}
          >
            Search for a location
            or click directly on
            the map.
          </p>
        </div>

        {/* =================================================
            SEARCH
        ================================================== */}

        <div
          style={{
            background:
              "#ffffff",

            padding:
              "25px",

            borderRadius:
              "16px",

            marginBottom:
              "25px",

            boxShadow:
              "0 4px 15px rgba(0,0,0,0.08)",
          }}
        >
          <h2>
            🔎 Search Location
          </h2>

          <form
            onSubmit={
              handleSearch
            }
            style={{
              display:
                "flex",

              gap:
                "10px",
            }}
          >
            <input
              type="text"
              value={
                searchText
              }
              onChange={(
                e
              ) =>
                setSearchText(
                  e.target.value
                )
              }
              placeholder="Search city, area, landmark or address..."
              style={{
                flex: 1,

                padding:
                  "14px",

                border:
                  "1px solid #d1d5db",

                borderRadius:
                  "8px",

                fontSize:
                  "16px",
              }}
            />

            <button
              type="submit"
              disabled={
                searching
              }
              style={{
                padding:
                  "14px 25px",

                background:
                  "#2563eb",

                color:
                  "white",

                border:
                  "none",

                borderRadius:
                  "8px",

                cursor:
                  searching
                    ? "not-allowed"
                    : "pointer",
              }}
            >
              {searching
                ? "Searching..."
                : "Search"}
            </button>
          </form>

          {searchError && (
            <p
              style={{
                color:
                  "#dc2626",

                marginTop:
                  "10px",
              }}
            >
              {searchError}
            </p>
          )}
        </div>

        {/* =================================================
            MAP
        ================================================== */}

        <div
          style={{
            background:
              "#ffffff",

            padding:
              "20px",

            borderRadius:
              "16px",

            marginBottom:
              "25px",

            boxShadow:
              "0 4px 15px rgba(0,0,0,0.08)",
          }}
        >
          <h2>
            📍 Select on Map
          </h2>

          <p
            style={{
              color:
                "#6b7280",
            }}
          >
            Click anywhere on
            the map to select a
            business location.
          </p>

          <div
            style={{
              height:
                "550px",

              borderRadius:
                "12px",

              overflow:
                "hidden",
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
                height:
                  "100%",

                width:
                  "100%",
              }}
            >
              <TileLayer
                attribution='&copy; OpenStreetMap contributors'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />

              {/* -------------------------------------------
                  CLICK HANDLER
              -------------------------------------------- */}

              <MapClickHandler
                onLocationSelect={
                  handleLocationSelect
                }
              />

              {/* -------------------------------------------
                  MAP CONTROLLER
              -------------------------------------------- */}

              <MapController
                latitude={
                  latitude
                }
                longitude={
                  longitude
                }
              />

              {/* -------------------------------------------
                  SELECTED MARKER
              -------------------------------------------- */}

              {selected && (
                <Marker
                  position={[
                    latitude,
                    longitude,
                  ]}
                  icon={
                    locationIcon
                  }
                >
                  <Popup>
                    <strong>
                      📍 Selected
                      Location
                    </strong>

                    <br />

                    {placeName ||
                      "Selected Location"}

                    <br />

                    <br />

                    Latitude:{" "}
                    {latitude.toFixed(
                      6
                    )}

                    <br />

                    Longitude:{" "}
                    {longitude.toFixed(
                      6
                    )}
                  </Popup>
                </Marker>
              )}
            </MapContainer>
          </div>
        </div>

        {/* =================================================
            SELECTED LOCATION DETAILS
        ================================================== */}

        <div
          style={{
            background:
              "#ffffff",

            padding:
              "30px",

            borderRadius:
              "16px",

            boxShadow:
              "0 4px 15px rgba(0,0,0,0.08)",
          }}
        >
          <h2>
            Selected Location
          </h2>

          {placeName && (
            <p>
              <strong>
                📍 {placeName}
              </strong>
            </p>
          )}

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

          {/* -------------------------------------------
              STATUS
          -------------------------------------------- */}

          <p
            style={{
              padding:
                "15px",

              background:
                selected
                  ? "#f0fdf4"
                  : "#fef2f2",

              color:
                selected
                  ? "#166534"
                  : "#991b1b",

              borderRadius:
                "8px",

              textAlign:
                "center",
            }}
          >
            {selected
              ? "✓ Location selected successfully"
              : "Please select a location"}
          </p>

          {/* -------------------------------------------
              BUTTONS
          -------------------------------------------- */}

          <div
            style={{
              display:
                "flex",

              justifyContent:
                "center",

              gap:
                "15px",

              marginTop:
                "20px",
            }}
          >
            <button
              type="button"
              onClick={
                handleClear
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

                fontSize:
                  "15px",
              }}
            >
              Clear Location
            </button>

            <button
              type="button"
              onClick={
                handleContinue
              }
              disabled={
                !selected
              }
              style={{
                padding:
                  "13px 30px",

                background:
                  selected
                    ? "#2563eb"
                    : "#9ca3af",

                color:
                  "white",

                border:
                  "none",

                borderRadius:
                  "8px",

                fontSize:
                  "16px",

                fontWeight:
                  "600",

                cursor:
                  selected
                    ? "pointer"
                    : "not-allowed",
              }}
            >
              Continue to Business
              Category →
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default LocationSelection;
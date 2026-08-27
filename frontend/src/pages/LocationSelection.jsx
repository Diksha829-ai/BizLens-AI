import {
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  Circle,
  useMap,
  useMapEvents,
} from "react-leaflet";

import L from "leaflet";
import "leaflet/dist/leaflet.css";

import { useNavigate } from "react-router-dom";

// =====================================================
// MAHARASHTRA MAP CONFIGURATION
// =====================================================

// Maharashtra approximate geographic bounds
// South-West  -> North-East
const MAHARASHTRA_BOUNDS = [
  [15.5, 72.5],
  [22.2, 80.9],
];

// Default map center is Maharashtra itself.
// This is NOT a business/location default.
const MAHARASHTRA_CENTER = [
  19.2,
  76.2,
];

// Initial zoom showing Maharashtra
const MAHARASHTRA_ZOOM = 7;

// =====================================================
// RADIUS OPTIONS
// =====================================================

const RADIUS_OPTIONS = [1, 2, 3, 5];

// =====================================================
// CUSTOM LOCATION ICON
// =====================================================

const locationIcon = L.divIcon({
  className: "bizlens-location-marker",

  html: `
    <div class="bizlens-marker-wrapper">
      <div class="bizlens-marker-pin">
        <div class="bizlens-marker-dot"></div>
      </div>
    </div>
  `,

  iconSize: [42, 42],
  iconAnchor: [21, 38],
  popupAnchor: [0, -38],
});

// =====================================================
// CHECK WHETHER LOCATION IS INSIDE MAHARASHTRA
// =====================================================

function isInsideMaharashtra(
  latitude,
  longitude
) {
  const lat = Number(latitude);
  const lng = Number(longitude);

  if (
    Number.isNaN(lat) ||
    Number.isNaN(lng)
  ) {
    return false;
  }

  const [
    [south,
      west],
    [north,
      east],
  ] = MAHARASHTRA_BOUNDS;

  return (
    lat >= south &&
    lat <= north &&
    lng >= west &&
    lng <= east
  );
}

// =====================================================
// MAP CLICK HANDLER
// =====================================================

function MapClickHandler({
  onLocationSelect,
}) {
  useMapEvents({
    click(event) {
      const {
        lat,
        lng,
      } = event.latlng;

      // -----------------------------------------------
      // BLOCK LOCATIONS OUTSIDE MAHARASHTRA
      // -----------------------------------------------

      if (
        !isInsideMaharashtra(
          lat,
          lng
        )
      ) {
        onLocationSelect(
          null,
          null,
          "",
          null,
          false,
          "outside"
        );

        return;
      }

      onLocationSelect(
        lat,
        lng,
        "Map selected location",
        null,
        false,
        "valid"
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
  mapAction,
}) {
  const map = useMap();

  useEffect(() => {
    // -------------------------------------------------
    // SEARCH LOCATION
    // -------------------------------------------------

    if (
      mapAction === "search" &&
      latitude !== null &&
      longitude !== null
    ) {
      map.flyTo(
        [
          latitude,
          longitude,
        ],
        12,
        {
          animate: true,
          duration: 1.2,
        }
      );

      return;
    }

    // -------------------------------------------------
    // CURRENT LOCATION
    // -------------------------------------------------

    if (
      mapAction === "current" &&
      latitude !== null &&
      longitude !== null
    ) {
      map.flyTo(
        [
          latitude,
          longitude,
        ],
        12,
        {
          animate: true,
          duration: 1.2,
        }
      );

      return;
    }

    // -------------------------------------------------
    // NORMAL STATE
    // Do not move map when user clicks
    // -------------------------------------------------

  }, [
    latitude,
    longitude,
    map,
    mapAction,
  ]);

  return null;
}

// =====================================================
// LOCATION SELECTION COMPONENT
// =====================================================

function LocationSelection() {
  const navigate = useNavigate();

  // ===================================================
  // USER
  // ===================================================

  const user = useMemo(() => {
    try {
      return (
        JSON.parse(
          localStorage.getItem("user")
        ) || {}
      );
    } catch {
      return {};
    }
  }, []);

  // ===================================================
  // LOCATION
  // ===================================================

  const [
    latitude,
    setLatitude,
  ] = useState(null);

  const [
    longitude,
    setLongitude,
  ] = useState(null);

  const [
    selected,
    setSelected,
  ] = useState(false);

  const [
    placeName,
    setPlaceName,
  ] = useState("");

  const [
    locationAccuracy,
    setLocationAccuracy,
  ] = useState(null);

  // ===================================================
  // MAP ACTION
  // ===================================================

  const [
    mapAction,
    setMapAction,
  ] = useState("normal");

  // ===================================================
  // SEARCH
  // ===================================================

  const [
    searchText,
    setSearchText,
  ] = useState("");

  const [
    searching,
    setSearching,
  ] = useState(false);

  const [
    searchError,
    setSearchError,
  ] = useState("");

  // ===================================================
  // CURRENT LOCATION
  // ===================================================

  const [
    gettingLocation,
    setGettingLocation,
  ] = useState(false);

  const watchIdRef =
    useRef(null);

  const bestAccuracyRef =
    useRef(Infinity);

  const bestPositionRef =
    useRef(null);

  const locationTimerRef =
    useRef(null);

  // ===================================================
  // RADIUS
  // ===================================================

  const [
    radius,
    setRadius,
  ] = useState(3);

  // ===================================================
  // CLEANUP
  // ===================================================

  useEffect(() => {
    return () => {
      if (
        watchIdRef.current !== null
      ) {
        navigator.geolocation.clearWatch(
          watchIdRef.current
        );
      }

      if (
        locationTimerRef.current
      ) {
        clearTimeout(
          locationTimerRef.current
        );
      }
    };
  }, []);

  // ===================================================
  // LOAD SAVED LOCATION
  // ===================================================

  useEffect(() => {
    try {
      const savedRadius =
        localStorage.getItem(
          "selectedRadius"
        );

      if (savedRadius) {
        const parsedRadius =
          Number(savedRadius);

        if (
          RADIUS_OPTIONS.includes(
            parsedRadius
          )
        ) {
          setRadius(
            parsedRadius
          );
        }
      }

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

      // -----------------------------------------------
      // ONLY LOAD SAVED LOCATION IF IT IS IN
      // MAHARASHTRA
      // -----------------------------------------------

      if (
        !isInsideMaharashtra(
          savedLatitude,
          savedLongitude
        )
      ) {
        localStorage.removeItem(
          "selectedLocation"
        );

        return;
      }

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

        if (
          location.accuracy !==
            null &&
          location.accuracy !==
            undefined
        ) {
          setLocationAccuracy(
            Number(
              location.accuracy
            )
          );
        }

        // Saved location exists.
        // Map controller will zoom to it.
        setMapAction(
          "search"
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
  // SAVE LOCATION
  // ===================================================

  const saveLocation = (
    lat,
    lng,
    name,
    accuracy = null
  ) => {
    if (
      !isInsideMaharashtra(
        lat,
        lng
      )
    ) {
      return;
    }

    const selectedLocation = {
      latitude: Number(lat),

      longitude: Number(lng),

      address:
        name ||
        "Selected Location",

      radius: Number(radius),

      accuracy:
        accuracy !== null
          ? Number(accuracy)
          : null,

      state:
        "Maharashtra",
    };

    localStorage.setItem(
      "selectedLocation",
      JSON.stringify(
        selectedLocation
      )
    );

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

    localStorage.setItem(
      "selectedRadius",
      String(radius)
    );

    if (
      accuracy !== null
    ) {
      localStorage.setItem(
        "selectedLocationAccuracy",
        String(accuracy)
      );
    }
  };

  // ===================================================
  // SELECT LOCATION
  // ===================================================

  const handleLocationSelect = (
    lat,
    lng,
    name = "",
    accuracy = null,
    shouldFly = false,
    validationStatus = "valid"
  ) => {
    // -----------------------------------------------
    // OUTSIDE MAHARASHTRA
    // -----------------------------------------------

    if (
      validationStatus ===
      "outside"
    ) {
      setSearchError(
        "Please select a location within Maharashtra."
      );

      return;
    }

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

    // -----------------------------------------------
    // EXTRA MAHARASHTRA VALIDATION
    // -----------------------------------------------

    if (
      !isInsideMaharashtra(
        selectedLatitude,
        selectedLongitude
      )
    ) {
      setSearchError(
        "This location is outside Maharashtra. Please select a location within Maharashtra."
      );

      return;
    }

    // -----------------------------------------------
    // MAP ACTION
    // -----------------------------------------------

    if (shouldFly) {
      setMapAction(
        "search"
      );
    } else {
      setMapAction(
        "normal"
      );
    }

    // -----------------------------------------------
    // SAVE STATE
    // -----------------------------------------------

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

    setLocationAccuracy(
      accuracy !== null
        ? Number(accuracy)
        : null
    );

    setSearchError("");

    saveLocation(
      selectedLatitude,
      selectedLongitude,
      name ||
        "Selected Location",
      accuracy
    );
  };

  // ===================================================
  // SEARCH LOCATION
  // ===================================================

  const handleSearch = async (
    event
  ) => {
    event.preventDefault();

    const query =
      searchText.trim();

    if (!query) {
      setSearchError(
        "Please enter a location to search."
      );

      return;
    }

    try {
      setSearching(true);

      setSearchError("");

      // ---------------------------------------------
      // IMPORTANT:
      // Maharashtra is added to search query.
      // This prevents searching unrelated states.
      // ---------------------------------------------

      const searchQuery =
        `${query}, Maharashtra, India`;

      const url =
        "https://nominatim.openstreetmap.org/search" +
        "?format=json" +
        "&q=" +
        encodeURIComponent(
          searchQuery
        ) +
        "&limit=5" +
        "&addressdetails=1" +
        "&countrycodes=in";

      console.log(
        "Searching location:",
        searchQuery
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
          "Location search request failed."
        );
      }

      const results =
        await response.json();

      if (
        !results ||
        results.length === 0
      ) {
        setSearchError(
          "Location not found in Maharashtra. Try a city, area, landmark or address in Maharashtra."
        );

        return;
      }

      // ---------------------------------------------
      // FIND FIRST RESULT INSIDE MAHARASHTRA
      // ---------------------------------------------

      const result =
        results.find(
          (item) =>
            isInsideMaharashtra(
              parseFloat(
                item.lat
              ),
              parseFloat(
                item.lon
              )
            )
        );

      if (!result) {
        setSearchError(
          "The searched location is outside Maharashtra. Please search for a location in Maharashtra."
        );

        return;
      }

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
          "Invalid coordinates received from search."
        );

        return;
      }

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

      handleLocationSelect(
        lat,
        lon,
        result.display_name,
        null,
        true,
        "valid"
      );

      setSearchText("");

      setSearchError("");
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
  // REVERSE GEOCODING
  // ===================================================

  const reverseGeocode = async (
    lat,
    lng
  ) => {
    try {
      const url =
        "https://nominatim.openstreetmap.org/reverse" +
        "?format=json" +
        "&lat=" +
        encodeURIComponent(lat) +
        "&lon=" +
        encodeURIComponent(lng) +
        "&zoom=18" +
        "&addressdetails=1";

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
        return "Current Location";
      }

      const result =
        await response.json();

      // ---------------------------------------------
      // CHECK REVERSE-GEOCODED STATE
      // ---------------------------------------------

      const state =
        result?.address?.state ||
        "";

      if (
        state &&
        !state
          .toLowerCase()
          .includes(
            "maharashtra"
          )
      ) {
        return null;
      }

      return (
        result?.display_name ||
        "Current Location"
      );
    } catch (error) {
      console.warn(
        "Reverse geocoding failed:",
        error
      );

      return "Current Location";
    }
  };

  // ===================================================
  // STOP LOCATION WATCH
  // ===================================================

  const stopLocationWatch =
    () => {
      if (
        watchIdRef.current !== null
      ) {
        navigator.geolocation.clearWatch(
          watchIdRef.current
        );

        watchIdRef.current =
          null;
      }

      if (
        locationTimerRef.current
      ) {
        clearTimeout(
          locationTimerRef.current
        );

        locationTimerRef.current =
          null;
      }
    };

  // ===================================================
  // CURRENT LOCATION
  // ===================================================

  const handleCurrentLocation =
    () => {
      if (
        !navigator.geolocation
      ) {
        setSearchError(
          "Geolocation is not supported by your browser."
        );

        return;
      }

      bestAccuracyRef.current =
        Infinity;

      bestPositionRef.current =
        null;

      setGettingLocation(
        true
      );

      setSearchError("");

      stopLocationWatch();

      watchIdRef.current =
        navigator.geolocation.watchPosition(
          (position) => {
            const {
              latitude:
                currentLatitude,
              longitude:
                currentLongitude,
              accuracy,
            } =
              position.coords;

            console.log(
              "Location reading:",
              {
                latitude:
                  currentLatitude,

                longitude:
                  currentLongitude,

                accuracy:
                  Math.round(
                    accuracy
                  ),
              }
            );

            // -----------------------------------------
            // DO NOT ACCEPT LOCATION OUTSIDE
            // MAHARASHTRA
            // -----------------------------------------

            if (
              !isInsideMaharashtra(
                currentLatitude,
                currentLongitude
              )
            ) {
              stopLocationWatch();

              setGettingLocation(
                false
              );

              setSearchError(
                "Your current location is outside Maharashtra. BizLens currently supports locations within Maharashtra only."
              );

              return;
            }

            if (
              accuracy <
              bestAccuracyRef.current
            ) {
              bestAccuracyRef.current =
                accuracy;

              bestPositionRef.current =
                position;
            }

            if (
              accuracy <= 100
            ) {
              finishCurrentLocation(
                position
              );
            }
          },

          (error) => {
            console.error(
              "Geolocation error:",
              error
            );

            stopLocationWatch();

            setGettingLocation(
              false
            );

            let message =
              "Unable to get your current location.";

            if (
              error.code === 1
            ) {
              message =
                "Location permission was denied. Please allow location access in Chrome.";
            } else if (
              error.code === 2
            ) {
              message =
                "Your device could not determine your location. Turn ON Windows Location Services and try again.";
            } else if (
              error.code === 3
            ) {
              message =
                "Location request timed out. Please try again.";
            }

            setSearchError(
              message
            );
          },

          {
            enableHighAccuracy:
              true,

            timeout:
              20000,

            maximumAge:
              0,
          }
        );

      locationTimerRef.current =
        setTimeout(() => {
          if (
            bestPositionRef.current
          ) {
            const bestAccuracy =
              bestPositionRef.current
                .coords.accuracy;

            if (
              bestAccuracy <=
              1000
            ) {
              finishCurrentLocation(
                bestPositionRef.current
              );
            } else {
              stopLocationWatch();

              setGettingLocation(
                false
              );

              setSearchError(
                `Your browser returned an inaccurate location (${Math.round(
                  bestAccuracy
                )} m accuracy). Please enable precise location/GPS and try again.`
              );
            }
          } else {
            stopLocationWatch();

            setGettingLocation(
              false
            );

            setSearchError(
              "Could not get a location reading. Please check your browser and device location settings."
            );
          }
        }, 15000);
    };

  // ===================================================
  // FINISH CURRENT LOCATION
  // ===================================================

  const finishCurrentLocation =
    async (position) => {
      if (!position) {
        return;
      }

      const lat =
        position.coords.latitude;

      const lng =
        position.coords.longitude;

      const accuracy =
        position.coords.accuracy;

      // ---------------------------------------------
      // MAHARASHTRA CHECK
      // ---------------------------------------------

      if (
        !isInsideMaharashtra(
          lat,
          lng
        )
      ) {
        stopLocationWatch();

        setGettingLocation(
          false
        );

        setSearchError(
          "Your current location is outside Maharashtra. Please select a location within Maharashtra."
        );

        return;
      }

      stopLocationWatch();

      setGettingLocation(
        false
      );

      const name =
        await reverseGeocode(
          lat,
          lng
        );

      if (!name) {
        setSearchError(
          "Your current location is outside Maharashtra."
        );

        return;
      }

      setLatitude(lat);

      setLongitude(lng);

      setSelected(true);

      setPlaceName(name);

      setLocationAccuracy(
        accuracy
      );

      setMapAction(
        "current"
      );

      saveLocation(
        lat,
        lng,
        name,
        accuracy
      );

      setSearchText("");

      setSearchError("");
    };

  // ===================================================
  // RADIUS CHANGE
  // ===================================================

  const handleRadiusChange =
    (value) => {
      const selectedRadius =
        Number(value);

      if (
        !RADIUS_OPTIONS.includes(
          selectedRadius
        )
      ) {
        return;
      }

      setRadius(
        selectedRadius
      );

      localStorage.setItem(
        "selectedRadius",
        String(
          selectedRadius
        )
      );

      if (
        selected &&
        latitude !== null &&
        longitude !== null
      ) {
        const currentLocation =
          {
            latitude:
              Number(latitude),

            longitude:
              Number(longitude),

            address:
              placeName ||
              "Selected Location",

            radius:
              selectedRadius,

            accuracy:
              locationAccuracy,

            state:
              "Maharashtra",
          };

        localStorage.setItem(
          "selectedLocation",
          JSON.stringify(
            currentLocation
          )
        );
      }
    };

  // ===================================================
  // CONTINUE
  // ===================================================

  const handleContinue =
    () => {
      if (!selected) {
        alert(
          "Please select a location first."
        );

        return;
      }

      if (
        latitude === null ||
        longitude === null
      ) {
        alert(
          "Please select a valid Maharashtra location."
        );

        return;
      }

      if (
        !isInsideMaharashtra(
          latitude,
          longitude
        )
      ) {
        alert(
          "Selected location must be within Maharashtra."
        );

        return;
      }

      if (
        !RADIUS_OPTIONS.includes(
          Number(radius)
        )
      ) {
        alert(
          "Please select a valid analysis radius."
        );

        return;
      }

      saveLocation(
        latitude,
        longitude,
        placeName ||
          "Selected Location",
        locationAccuracy
      );

      localStorage.setItem(
        "selectedRadius",
        String(radius)
      );

      navigate(
        "/business-category"
      );
    };

  // ===================================================
  // CLEAR
  // ===================================================

  const handleClear = () => {
    stopLocationWatch();

    setSelected(false);

    setLatitude(null);

    setLongitude(null);

    setPlaceName("");

    setSearchText("");

    setSearchError("");

    setRadius(3);

    setLocationAccuracy(null);

    setMapAction(
      "normal"
    );

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

    localStorage.removeItem(
      "selectedRadius"
    );

    localStorage.removeItem(
      "selectedLocationAccuracy"
    );
  };

  // ===================================================
  // LOGOUT
  // ===================================================

  const handleLogout = () => {
    stopLocationWatch();

    localStorage.removeItem(
      "token"
    );

    localStorage.removeItem(
      "user"
    );

    navigate("/login");
  };

  // ===================================================
  // SIDEBAR
  // ===================================================

  const sidebarItems = [
    {
      label: "Dashboard",
      icon: "📊",
      path: "/dashboard",
    },

    {
      label: "New Analysis",
      icon: "📍",
      path: "/location-selection",
      active: true,
    },

    {
      label: "Saved Analyses",
      icon: "📁",
      path: null,
    },

    {
      label: "Compare Businesses",
      icon: "⚖️",
      path: null,
    },
  ];

  // ===================================================
  // UI
  // ===================================================

  return (
    <div className="bizlens-page">

      <style>{`

        * {
          box-sizing: border-box;
        }

        .bizlens-page {
          min-height: 100vh;
          display: flex;
          background: #f5f7fb;
          color: #14213d;
          font-family:
            Inter,
            system-ui,
            -apple-system,
            BlinkMacSystemFont,
            "Segoe UI",
            sans-serif;
        }

        /* =================================================
           SIDEBAR
        ================================================= */

        .bizlens-sidebar {
          width: 270px;
          min-width: 270px;
          background: #fff;
          border-right: 1px solid #e5e7eb;
          display: flex;
          flex-direction: column;
          min-height: 100vh;
        }

        .bizlens-logo {
          height: 94px;
          padding: 24px 28px;
          display: flex;
          align-items: center;
          gap: 12px;
          border-bottom: 1px solid #eef0f4;
        }

        .bizlens-logo-box {
          width: 46px;
          height: 46px;
          border-radius: 14px;
          background: linear-gradient(
            135deg,
            #4355ff,
            #3044d8
          );
          color: #fff;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 25px;
          font-weight: 800;
          box-shadow:
            0 7px 18px
            rgba(
              67,
              85,
              255,
              .25
            );
        }

        .bizlens-logo-title {
          font-size: 20px;
          font-weight: 800;
        }

        .bizlens-logo-ai {
          font-size: 13px;
          font-weight: 700;
          color: #3155ed;
        }

        .bizlens-nav {
          padding: 28px 16px;
        }

        .bizlens-nav-item {
          width: 100%;
          border: none;
          background: transparent;
          padding: 14px 18px;
          margin-bottom: 8px;
          border-radius: 12px;
          display: flex;
          align-items: center;
          gap: 14px;
          font-size: 15px;
          color: #53627c;
          cursor: pointer;
          text-align: left;
        }

        .bizlens-nav-item:hover {
          background: #f3f6ff;
          color: #3155ed;
        }

        .bizlens-nav-item.active {
          background: #edf3ff;
          color: #2454e8;
          font-weight: 700;
        }

        .bizlens-nav-icon {
          width: 22px;
          text-align: center;
        }

        .bizlens-sidebar-bottom {
          margin-top: auto;
          padding: 18px 16px 24px;
          border-top: 1px solid #eef0f4;
        }

        /* =================================================
           CONTENT
        ================================================= */

        .bizlens-content {
          flex: 1;
          min-width: 0;
          padding: 38px 42px 60px;
        }

        .bizlens-content-inner {
          max-width: 1320px;
          margin: 0 auto;
        }

        .bizlens-topbar {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          gap: 25px;
          margin-bottom: 28px;
        }

        .bizlens-eyebrow {
          color: #3155ed;
          font-size: 14px;
          font-weight: 800;
          letter-spacing: 1.8px;
          text-transform: uppercase;
          margin-bottom: 10px;
        }

        .bizlens-title {
          margin: 0;
          font-size: 36px;
          line-height: 1.15;
          font-weight: 800;
        }

        .bizlens-subtitle {
          margin: 10px 0 0;
          color: #697792;
          font-size: 16px;
        }

        /* =================================================
           USER
        ================================================= */

        .bizlens-user {
          background: #fff;
          border: 1px solid #e3e7ef;
          border-radius: 18px;
          padding: 11px 17px 11px 11px;
          display: flex;
          align-items: center;
          gap: 12px;
          min-width: 170px;
        }

        .bizlens-avatar {
          width: 43px;
          height: 43px;
          border-radius: 50%;
          background: #4c43ed;
          color: #fff;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 800;
        }

        .bizlens-user-name {
          font-size: 14px;
          font-weight: 800;
        }

        .bizlens-user-email {
          font-size: 12px;
          color: #71809a;
          margin-top: 3px;
        }

        /* =================================================
           STEP
        ================================================= */

        .bizlens-step-card {
          background: #fff;
          border: 1px solid #e1e6ef;
          border-radius: 18px;
          padding: 20px 24px;
          display: flex;
          align-items: center;
          gap: 18px;
          margin-bottom: 24px;
        }

        .bizlens-step-number {
          width: 42px;
          height: 42px;
          border-radius: 50%;
          background: #3167e9;
          color: #fff;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 800;
        }

        .bizlens-step-info {
          flex: 1;
        }

        .bizlens-step-title {
          font-size: 15px;
          font-weight: 800;
          margin-bottom: 9px;
        }

        .bizlens-progress {
          height: 7px;
          background: #e9edf4;
          border-radius: 20px;
          overflow: hidden;
        }

        .bizlens-progress-fill {
          height: 100%;
          width: 33.33%;
          background: linear-gradient(
            90deg,
            #2f67ef,
            #4b45ee
          );
        }

        .bizlens-step-count {
          color: #2454e8;
          font-size: 13px;
          font-weight: 800;
        }

        /* =================================================
           CARDS
        ================================================= */

        .bizlens-card,
        .bizlens-map-card,
        .bizlens-selected-card {
          background: #fff;
          border: 1px solid #e1e6ef;
          border-radius: 18px;
        }

        .bizlens-card {
          padding: 26px;
          margin-bottom: 24px;
        }

        .bizlens-section-heading {
          display: flex;
          align-items: center;
          gap: 13px;
          margin-bottom: 18px;
        }

        .bizlens-section-icon {
          width: 46px;
          height: 46px;
          border-radius: 13px;
          background: #edf4ff;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 23px;
        }

        .bizlens-section-heading h2 {
          margin: 0;
          font-size: 20px;
        }

        .bizlens-section-heading p {
          margin: 4px 0 0;
          color: #71809a;
          font-size: 14px;
        }

        /* =================================================
           SEARCH
        ================================================= */

        .bizlens-search-row {
          display: flex;
          gap: 10px;
        }

        .bizlens-search-input {
          flex: 1;
          min-width: 0;
          height: 50px;
          border: 1px solid #d9e0eb;
          border-radius: 11px;
          padding: 0 16px;
          outline: none;
          font-size: 15px;
        }

        .bizlens-search-input:focus {
          border-color: #4165ef;
          box-shadow:
            0 0 0 3px
            rgba(
              65,
              101,
              239,
              .10
            );
        }

        .bizlens-button {
          border: none;
          border-radius: 11px;
          padding: 0 25px;
          height: 50px;
          font-size: 14px;
          font-weight: 800;
          cursor: pointer;
        }

        .bizlens-primary {
          color: #fff;
          background: linear-gradient(
            135deg,
            #315bf0,
            #3d4de5
          );
        }

        .bizlens-primary:disabled {
          background: #aab3c5;
          cursor: not-allowed;
        }

        .bizlens-current-location {
          margin-top: 12px;
          height: 42px;
          padding: 0 16px;
          border: 1px solid #dbe2ee;
          background: #fff;
          color: #3155ed;
          border-radius: 10px;
          font-weight: 700;
          cursor: pointer;
        }

        .bizlens-current-location:hover {
          background: #f4f7ff;
        }

        .bizlens-current-location:disabled {
          opacity: .65;
          cursor: not-allowed;
        }

        .bizlens-error {
          margin-top: 12px;
          color: #dc2626;
          background: #fff1f2;
          border-radius: 9px;
          padding: 11px 13px;
          font-size: 13px;
        }

        /* =================================================
           LOCATION GRID
        ================================================= */

        .bizlens-location-grid {
          display: grid;
          grid-template-columns:
            minmax(0, 1fr)
            330px;
          gap: 24px;
          align-items: start;
        }

        /* =================================================
           MAP
        ================================================= */

        .bizlens-map-card {
          padding: 20px;
          overflow: hidden;
        }

        .bizlens-map-heading {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 15px;
          margin-bottom: 14px;
        }

        .bizlens-map-title {
          display: flex;
          align-items: flex-start;
          gap: 11px;
        }

        .bizlens-map-title h2 {
          margin: 0;
          font-size: 19px;
        }

        .bizlens-map-title p {
          margin: 4px 0 0;
          color: #71809a;
          font-size: 13px;
        }

        .bizlens-map-link {
          border: none;
          background: #edf4ff;
          color: #2454e8;
          padding: 9px 13px;
          border-radius: 20px;
          font-size: 11px;
          font-weight: 800;
          cursor: pointer;
        }

        .bizlens-map-wrapper {
          height: 550px;
          border-radius: 14px;
          overflow: hidden;
          border: 1px solid #dce2ec;
        }

        .bizlens-map-wrapper
        .leaflet-container {
          height: 100%;
          width: 100%;
        }

        /* =================================================
           SELECTED LOCATION
        ================================================= */

        .bizlens-selected-card {
          padding: 22px;
          position: sticky;
          top: 20px;
        }

        .bizlens-selected-card h2 {
          margin: 0 0 18px;
          font-size: 20px;
        }

        .bizlens-selected-preview {
          background: #f7f9fc;
          border-radius: 14px;
          padding: 18px;
          margin-bottom: 18px;
          min-height: 105px;
        }

        .bizlens-selected-icon {
          font-size: 23px;
          margin-bottom: 8px;
        }

        .bizlens-selected-name {
          color: #53627c;
          font-size: 14px;
          line-height: 1.5;
          font-weight: 700;
        }

        .bizlens-no-location {
          color: #697792;
          font-weight: 700;
          font-size: 14px;
        }

        .bizlens-label {
          color: #7b879d;
          font-size: 11px;
          font-weight: 800;
          letter-spacing: 1px;
          text-transform: uppercase;
          margin-bottom: 7px;
        }

        .bizlens-coordinates {
          font-size: 14px;
          line-height: 1.8;
          margin-bottom: 17px;
        }

        .bizlens-accuracy {
          color: #64748b;
          font-size: 12px;
        }

        .bizlens-status {
          padding: 12px 13px;
          border-radius: 10px;
          font-size: 13px;
          margin-bottom: 18px;
        }

        .bizlens-status-selected {
          background: #ecfdf3;
          color: #087443;
        }

        .bizlens-status-empty {
          background: #fff7ed;
          color: #c2410c;
        }

        /* =================================================
           RADIUS
        ================================================= */

        .bizlens-radius {
          border-top: 1px solid #edf0f5;
          padding-top: 18px;
          margin-top: 18px;
        }

        .bizlens-radius-title {
          display: flex;
          justify-content: space-between;
          margin-bottom: 12px;
        }

        .bizlens-radius-value {
          color: #3155ed;
          font-weight: 800;
        }

        .bizlens-radius-options {
          display: grid;
          grid-template-columns:
            repeat(4, 1fr);
          gap: 7px;
        }

        .bizlens-radius-option {
          height: 40px;
          border: 1px solid #dce2ed;
          background: #fff;
          color: #53627c;
          border-radius: 9px;
          font-weight: 700;
          cursor: pointer;
        }

        .bizlens-radius-option.active {
          border-color: #3155ed;
          background: #edf3ff;
          color: #2454e8;
        }

        /* =================================================
           TIP
        ================================================= */

        .bizlens-tip {
          margin-top: 18px;
          padding-top: 18px;
          border-top: 1px solid #edf0f5;
          color: #697792;
          font-size: 12px;
          line-height: 1.7;
        }

        /* =================================================
           ACTIONS
        ================================================= */

        .bizlens-action-group {
          margin-top: 20px;
          display: flex;
          flex-direction: column;
          gap: 10px;
        }

        .bizlens-clear-button {
          height: 46px;
          border: 1px solid #d8dfeb;
          background: #fff;
          color: #53627c;
          border-radius: 10px;
          font-weight: 700;
          cursor: pointer;
        }

        .bizlens-continue-button {
          height: 50px;
          border: none;
          border-radius: 10px;
          background: #3155ed;
          color: #fff;
          font-size: 14px;
          font-weight: 800;
          cursor: pointer;
          box-shadow:
            0 7px 16px
            rgba(
              49,
              85,
              237,
              .20
            );
        }

        .bizlens-continue-button:disabled {
          background: #b7becb;
          cursor: not-allowed;
          box-shadow: none;
        }

        /* =================================================
           MARKER
        ================================================= */

        .bizlens-marker-wrapper {
          width: 42px;
          height: 42px;
          display: flex;
          align-items: flex-start;
          justify-content: center;
        }

        .bizlens-marker-pin {
          width: 32px;
          height: 32px;
          border-radius:
            50% 50% 50% 0;
          background: #ec3d72;
          border: 3px solid #fff;
          transform: rotate(-45deg);
          box-shadow:
            0 3px 10px
            rgba(
              0,
              0,
              0,
              .30
            );
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .bizlens-marker-dot {
          width: 9px;
          height: 9px;
          border-radius: 50%;
          background: #fff;
        }

        /* =================================================
           RESPONSIVE
        ================================================= */

        @media (max-width: 1100px) {

          .bizlens-sidebar {
            width: 230px;
            min-width: 230px;
          }

          .bizlens-content {
            padding:
              30px 25px 50px;
          }

          .bizlens-location-grid {
            grid-template-columns:
              minmax(0, 1fr)
              300px;
          }
        }

        @media (max-width: 900px) {

          .bizlens-page {
            display: block;
          }

          .bizlens-sidebar {
            width: 100%;
            min-width: 0;
            min-height: auto;
          }

          .bizlens-logo {
            height: 76px;
          }

          .bizlens-nav {
            display: flex;
            overflow-x: auto;
            padding: 10px 12px;
          }

          .bizlens-nav-item {
            width: auto;
            min-width: max-content;
            margin: 0 5px;
          }

          .bizlens-sidebar-bottom {
            display: none;
          }

          .bizlens-location-grid {
            grid-template-columns: 1fr;
          }

          .bizlens-selected-card {
            position: static;
          }
        }

        @media (max-width: 650px) {

          .bizlens-content {
            padding:
              22px 14px 40px;
          }

          .bizlens-topbar {
            flex-direction: column;
          }

          .bizlens-title {
            font-size: 29px;
          }

          .bizlens-user {
            width: 100%;
          }

          .bizlens-step-card {
            padding: 16px;
          }

          .bizlens-step-count {
            display: none;
          }

          .bizlens-search-row {
            flex-direction: column;
          }

          .bizlens-search-row
          .bizlens-button {
            width: 100%;
          }

          .bizlens-card {
            padding: 18px;
          }

          .bizlens-map-card {
            padding: 14px;
          }

          .bizlens-map-wrapper {
            height: 430px;
          }

          .bizlens-map-link {
            display: none;
          }
        }

      `}</style>

      {/* =================================================
          SIDEBAR
      ================================================= */}

      <aside className="bizlens-sidebar">

        <div className="bizlens-logo">

          <div className="bizlens-logo-box">
            B
          </div>

          <div>

            <div className="bizlens-logo-title">
              BizLens
            </div>

            <div className="bizlens-logo-ai">
              AI
            </div>

          </div>

        </div>

        <nav className="bizlens-nav">

          {sidebarItems.map(
            (item) => (
              <button
                key={
                  item.label
                }
                className={
                  `bizlens-nav-item ${
                    item.active
                      ? "active"
                      : ""
                  }`
                }
                onClick={() => {

                  if (
                    item.path
                  ) {
                    navigate(
                      item.path
                    );
                  } else {
                    alert(
                      `${item.label} will be available soon.`
                    );
                  }

                }}
              >

                <span className="bizlens-nav-icon">
                  {item.icon}
                </span>

                {item.label}

              </button>
            )
          )}

        </nav>

        <div className="bizlens-sidebar-bottom">

          <button
            className="bizlens-nav-item"
            onClick={() =>
              alert(
                "Settings will be available soon."
              )
            }
          >

            <span className="bizlens-nav-icon">
              ⚙️
            </span>

            Settings

          </button>

          <button
            className="bizlens-nav-item"
            onClick={
              handleLogout
            }
          >

            <span className="bizlens-nav-icon">
              ↪
            </span>

            Logout

          </button>

        </div>

      </aside>

      {/* =================================================
          MAIN CONTENT
      ================================================= */}

      <main className="bizlens-content">

        <div className="bizlens-content-inner">

          {/* =================================================
              HEADER
          ================================================= */}

          <div className="bizlens-topbar">

            <div>

              <div className="bizlens-eyebrow">
                New Business Analysis
              </div>

              <h1 className="bizlens-title">
                Select your business location
              </h1>

              <p className="bizlens-subtitle">
                Choose a location in Maharashtra
                to analyze its business potential.
              </p>

            </div>

            <div className="bizlens-user">

              <div className="bizlens-avatar">

                {(
                  user?.name ||
                  "U"
                )
                  .charAt(0)
                  .toUpperCase()}

              </div>

              <div>

                <div className="bizlens-user-name">
                  {user?.name ||
                    "User"}
                </div>

                <div className="bizlens-user-email">
                  {user?.email ||
                    ""}
                </div>

              </div>

            </div>

          </div>

          {/* =================================================
              STEP
          ================================================= */}

          <div className="bizlens-step-card">

            <div className="bizlens-step-number">
              1
            </div>

            <div className="bizlens-step-info">

              <div className="bizlens-step-title">
                Location Selection
              </div>

              <div className="bizlens-progress">

                <div className="bizlens-progress-fill" />

              </div>

            </div>

            <div className="bizlens-step-count">
              Step 1 of 3
            </div>

          </div>

          {/* =================================================
              SEARCH
          ================================================= */}

          <section className="bizlens-card">

            <div className="bizlens-section-heading">

              <div className="bizlens-section-icon">
                🔎
              </div>

              <div>

                <h2>
                  Search location
                </h2>

                <p>
                  Search by city,
                  area, landmark or
                  address in Maharashtra.
                </p>

              </div>

            </div>

            <form
              onSubmit={
                handleSearch
              }
              className="bizlens-search-row"
            >

              <input
                type="text"
                value={
                  searchText
                }
                onChange={(
                  event
                ) => {

                  setSearchText(
                    event.target
                      .value
                  );

                  if (
                    searchError
                  ) {
                    setSearchError(
                      ""
                    );
                  }

                }}
                placeholder="Example: Shivaji Chowk, Kolhapur"
                className="bizlens-search-input"
              />

              <button
                type="submit"
                disabled={
                  searching
                }
                className="bizlens-button bizlens-primary"
              >

                {searching
                  ? "Searching..."
                  : "Search"}

              </button>

            </form>

            <button
              type="button"
              onClick={
                handleCurrentLocation
              }
              disabled={
                gettingLocation
              }
              className="bizlens-current-location"
            >

              {gettingLocation
                ? "📍 Getting your location..."
                : "📍 Use my current location"}

            </button>

            {searchError && (
              <div className="bizlens-error">
                {searchError}
              </div>
            )}

          </section>

          {/* =================================================
              MAP + SELECTED LOCATION
          ================================================= */}

          <div className="bizlens-location-grid">

            {/* =================================================
                MAP
            ================================================= */}

            <section className="bizlens-map-card">

              <div className="bizlens-map-heading">

                <div className="bizlens-map-title">

                  <div>
                    📍
                  </div>

                  <div>

                    <h2>
                      Choose on map
                    </h2>

                    <p>
                      Select a location
                      anywhere within
                      Maharashtra.
                    </p>

                  </div>

                </div>

                <button
                  type="button"
                  className="bizlens-map-link"
                  onClick={() => {

                    if (
                      selected &&
                      latitude !== null &&
                      longitude !== null
                    ) {

                      window.open(
                        `https://www.openstreetmap.org/?mlat=${latitude}&mlon=${longitude}#map=16/${latitude}/${longitude}`,
                        "_blank"
                      );

                    } else {

                      window.open(
                        "https://www.openstreetmap.org/#map=7/19.2/76.2",
                        "_blank"
                      );

                    }

                  }}
                >
                  OPENSTREETMAP
                </button>

              </div>

              <div className="bizlens-map-wrapper">

                <MapContainer

                  // -------------------------------------
                  // DEFAULT MAP VIEW
                  // -------------------------------------

                  center={
                    selected &&
                    latitude !== null &&
                    longitude !== null
                      ? [
                          latitude,
                          longitude,
                        ]
                      : MAHARASHTRA_CENTER
                  }

                  zoom={
                    selected
                      ? 12
                      : MAHARASHTRA_ZOOM
                  }

                  scrollWheelZoom={
                    true
                  }

                  // -------------------------------------
                  // RESTRICT MAP TO MAHARASHTRA
                  // -------------------------------------

                  maxBounds={
                    MAHARASHTRA_BOUNDS
                  }

                  maxBoundsViscosity={
                    1.0
                  }

                  minZoom={
                    7
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

                  <MapClickHandler
                    onLocationSelect={
                      handleLocationSelect
                    }
                  />

                  <MapController
                    latitude={
                      latitude
                    }
                    longitude={
                      longitude
                    }
                    mapAction={
                      mapAction
                    }
                  />

                  {/* =================================================
                      SELECTED LOCATION MARKER
                  ================================================= */}

                  {selected &&
                    latitude !== null &&
                    longitude !== null && (
                      <>

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
                              📍 Selected Location
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

                            <br />

                            State:
                            {" "}
                            Maharashtra

                            <br />

                            Radius:
                            {" "}
                            {radius} km

                            {locationAccuracy !==
                              null && (
                              <>

                                <br />

                                GPS Accuracy:
                                {" "}
                                {Math.round(
                                  locationAccuracy
                                )} m

                              </>
                            )}

                          </Popup>

                        </Marker>

                        {/* =================================================
                            ANALYSIS RADIUS
                        ================================================= */}

                        <Circle
                          center={[
                            latitude,
                            longitude,
                          ]}
                          radius={
                            radius *
                            1000
                          }
                          pathOptions={{
                            color:
                              "#3155ed",

                            fillColor:
                              "#3155ed",

                            fillOpacity:
                              0.1,

                            weight:
                              2,
                          }}
                        />

                      </>
                    )}

                </MapContainer>

              </div>

            </section>

            {/* =================================================
                SELECTED LOCATION PANEL
            ================================================= */}

            <aside className="bizlens-selected-card">

              <h2>
                Selected location
              </h2>

              <div className="bizlens-selected-preview">

                <div className="bizlens-selected-icon">
                  📍
                </div>

                {selected ? (

                  <div className="bizlens-selected-name">

                    {placeName ||
                      "Selected Location"}

                  </div>

                ) : (

                  <div className="bizlens-no-location">

                    No location selected

                  </div>

                )}

              </div>

              <div className="bizlens-label">
                Coordinates
              </div>

              <div className="bizlens-coordinates">

                <div>

                  <strong>
                    Latitude:
                  </strong>{" "}

                  {selected &&
                  latitude !== null
                    ? latitude.toFixed(
                        6
                      )
                    : "—"}

                </div>

                <div>

                  <strong>
                    Longitude:
                  </strong>{" "}

                  {selected &&
                  longitude !== null
                    ? longitude.toFixed(
                        6
                      )
                    : "—"}

                </div>

                {selected &&
                  locationAccuracy !==
                    null && (

                    <div className="bizlens-accuracy">

                      GPS accuracy:
                      {" "}
                      approximately
                      {" "}
                      {Math.round(
                        locationAccuracy
                      )}
                      {" "}
                      m

                    </div>

                  )}

              </div>

              <div
                className={
                  `bizlens-status ${
                    selected
                      ? "bizlens-status-selected"
                      : "bizlens-status-empty"
                  }`
                }
              >

                {selected
                  ? "✓ Maharashtra location selected successfully"
                  : "↻ Select a location in Maharashtra to continue"}

              </div>

              {/* =================================================
                  RADIUS
              ================================================= */}

              <div className="bizlens-radius">

                <div className="bizlens-radius-title">

                  <strong>
                    Analysis radius
                  </strong>

                  <span className="bizlens-radius-value">
                    {radius} km
                  </span>

                </div>

                <div className="bizlens-radius-options">

                  {RADIUS_OPTIONS.map(
                    (option) => (

                      <button
                        key={
                          option
                        }
                        type="button"
                        onClick={() =>
                          handleRadiusChange(
                            option
                          )
                        }
                        className={
                          `bizlens-radius-option ${
                            radius ===
                            option
                              ? "active"
                              : ""
                          }`
                        }
                      >

                        {option} km

                      </button>

                    )
                  )}

                </div>

              </div>

              {/* =================================================
                  TIP
              ================================================= */}

              <div className="bizlens-tip">

                💡{" "}

                <strong>
                  Tip:
                </strong>{" "}

                Select a location
                in Maharashtra with
                good accessibility,
                nearby customers and
                suitable competition.

              </div>

              {/* =================================================
                  ACTIONS
              ================================================= */}

              <div className="bizlens-action-group">

                <button
                  type="button"
                  onClick={
                    handleClear
                  }
                  className="bizlens-clear-button"
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
                  className="bizlens-continue-button"
                >

                  Continue to Business
                  Category →

                </button>

              </div>

            </aside>

          </div>

        </div>

      </main>

    </div>
  );
}

export default LocationSelection;
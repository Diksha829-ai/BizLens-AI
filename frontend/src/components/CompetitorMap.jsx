import React, { useEffect, useMemo, useState } from "react";
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
import MapLegend from "./MapLegend";
import { Store, MapPin, Eye } from "lucide-react";

// Fix default Leaflet icon paths
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png",
  iconUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png",
  shadowUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
});

// Prominent Red Marker for Selected Business Location
const createSelectedIcon = () =>
  L.divIcon({
    className: "biz-custom-div-icon",
    html: `
      <div class="biz-marker-wrapper selected-marker">
        <div class="biz-marker-pulse"></div>
        <div class="biz-marker-pin selected-pin">
          <svg viewBox="0 0 24 24" width="16" height="16" fill="white" stroke="currentColor" stroke-width="2">
            <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z"/>
            <circle cx="12" cy="9" r="2.5" fill="#dc2626"/>
          </svg>
        </div>
      </div>
    `,
    iconSize: [36, 42],
    iconAnchor: [18, 40],
    popupAnchor: [0, -38],
  });

// Distinct Competitor Marker (Blue/Indigo with store icon)
const createCompetitorIcon = () =>
  L.divIcon({
    className: "biz-custom-div-icon",
    html: `
      <div class="biz-marker-wrapper competitor-marker">
        <div class="biz-marker-pin competitor-pin">
          <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="white" stroke-width="2.5">
            <path d="m2 7 4.41-4.41A2 2 0 0 1 7.83 2h8.34a2 2 0 0 1 1.42.59L22 7"/>
            <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"/>
            <path d="M15 22v-4a2 2 0 0 0-2-2h-2a2 2 0 0 0-2 2v4"/>
            <path d="M2 7h20"/>
            <path d="M22 7v3a2 2 0 0 1-2 2v0a2.7 2.7 0 0 1-1.59-.63.7.7 0 0 0-.82 0A2.7 2.7 0 0 1 16 12a2.7 2.7 0 0 1-1.59-.63.7.7 0 0 0-.82 0A2.7 2.7 0 0 1 12 12a2.7 2.7 0 0 1-1.59-.63.7.7 0 0 0-.82 0A2.7 2.7 0 0 1 8 12a2.7 2.7 0 0 1-1.59-.63.7.7 0 0 0-.82 0A2.7 2.7 0 0 1 4 12v0a2 2 0 0 1-2-2V7"/>
          </svg>
        </div>
      </div>
    `,
    iconSize: [28, 34],
    iconAnchor: [14, 32],
    popupAnchor: [0, -30],
  });

function MapUpdater({ latitude, longitude, zoom }) {
  const map = useMap();

  useEffect(() => {
    if (latitude === null || longitude === null || isNaN(latitude) || isNaN(longitude)) {
      return;
    }

    const updateMap = () => {
      map.invalidateSize({ animate: false, pan: false });
      map.setView([latitude, longitude], zoom || map.getZoom(), { animate: false });
    };

    updateMap();

    const container = map.getContainer();
    const resizeObserver = new ResizeObserver(() => {
      updateMap();
    });
    resizeObserver.observe(container);

    const timer = setTimeout(updateMap, 200);

    return () => {
      resizeObserver.disconnect();
      clearTimeout(timer);
    };
  }, [latitude, longitude, zoom, map]);

  return null;
}

/**
 * CompetitorMap displays the selected business location,
 * a dynamic circular analysis radius boundary,
 * and actual competitor locations from the backend geospatial results.
 */
function CompetitorMap({
  latitude,
  longitude,
  address = "",
  categoryDisplay = "Business",
  radius = 3,
  onRadiusChange,
  competitors = [],
}) {
  // Local state for active radius visualization
  const [activeRadius, setActiveRadius] = useState(Number(radius) || 3);

  // Sync with prop when prop changes
  useEffect(() => {
    if (radius) {
      setActiveRadius(Number(radius));
    }
  }, [radius]);

  const handleRadiusClick = (r) => {
    setActiveRadius(r);
    if (onRadiusChange) {
      onRadiusChange(r);
    }
  };

  // Valid competitors with valid lat/lon, filtered to activeRadius
  const visibleCompetitors = useMemo(() => {
    if (!Array.isArray(competitors)) return [];

    return competitors
      .map((c) => {
        const rawLat = c.lat ?? c.latitude;
        const rawLon = c.lon ?? c.longitude;
        const lat = Number(rawLat);
        const lon = Number(rawLon);

        if (isNaN(lat) || isNaN(lon) || lat < -90 || lat > 90 || lon < -180 || lon > 180) {
          return null;
        }

        const distance = Number(c.distance);

        return {
          ...c,
          lat,
          lon,
          distance: isNaN(distance) ? null : distance,
        };
      })
      .filter((c) => {
        if (!c) return false;
        // Keep competitors within the active radius
        if (c.distance !== null) {
          return c.distance <= activeRadius;
        }
        return true;
      });
  }, [competitors, activeRadius]);

  const selectedIcon = useMemo(() => createSelectedIcon(), []);
  const competitorIcon = useMemo(() => createCompetitorIcon(), []);

  // Zoom level dynamically based on radius
  const mapZoom = useMemo(() => {
    if (activeRadius <= 1) return 15;
    if (activeRadius <= 2) return 14;
    if (activeRadius <= 3) return 13;
    return 12;
  }, [activeRadius]);

  const isValidLocation =
    latitude !== null &&
    longitude !== null &&
    !isNaN(Number(latitude)) &&
    !isNaN(Number(longitude));

  if (!isValidLocation) {
    return (
      <div className="biz-map-fallback">
        <p>Location coordinates are not available to render the map.</p>
      </div>
    );
  }

  const numLat = Number(latitude);
  const numLon = Number(longitude);

  return (
    <div className="biz-competitor-map-wrapper">
      {/* MAP HEADER / CONTROLS */}
      <div className="biz-map-controls-header">
        <div className="biz-map-title-wrap">
          <span className="section-label">GEOSPATIAL LANDSCAPE</span>
          <h3 className="biz-map-heading">Competitor Distribution Map</h3>
          <p className="biz-map-subheading">
            Live OpenStreetMap visualization of your selected site and surrounding competitors.
          </p>
        </div>

        {/* Multi-radius selection pills */}
        <div className="biz-radius-selector-bar">
          <span className="biz-radius-selector-label">Radius View:</span>
          {[1, 2, 3, 5].map((r) => (
            <button
              key={r}
              type="button"
              className={`biz-radius-pill ${activeRadius === r ? "active" : ""}`}
              onClick={() => handleRadiusClick(r)}
            >
              {r} km
            </button>
          ))}
        </div>
      </div>

      {/* MAP CONTAINER */}
      <div className="biz-leaflet-map-frame">
        <MapContainer
          center={[numLat, numLon]}
          zoom={mapZoom}
          scrollWheelZoom={true}
          className="biz-leaflet-map"
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />

          <MapUpdater latitude={numLat} longitude={numLon} zoom={mapZoom} />

          {/* Selected Location Marker (Prominent Red) */}
          <Marker position={[numLat, numLon]} icon={selectedIcon}>
            <Popup className="biz-map-popup">
              <div className="biz-popup-content">
                <div className="biz-popup-badge selected">Selected Business Location</div>
                <h4 className="biz-popup-title">{categoryDisplay}</h4>
                <p className="biz-popup-address">{address || `${numLat.toFixed(4)}, ${numLon.toFixed(4)}`}</p>
                <div className="biz-popup-footer">
                  <span>Coverage: <strong>{activeRadius} km radius</strong></span>
                </div>
              </div>
            </Popup>
          </Marker>

          {/* Selected Analysis Radius Boundary */}
          <Circle
            center={[numLat, numLon]}
            radius={activeRadius * 1000}
            pathOptions={{
              color: "#2563eb",
              weight: 2,
              dashArray: "6, 6",
              fillColor: "#3b82f6",
              fillOpacity: 0.12,
            }}
          />

          {/* Competitor Markers */}
          {visibleCompetitors.map((comp, index) => (
            <Marker
              key={comp.id || `comp-${index}`}
              position={[comp.lat, comp.lon]}
              icon={competitorIcon}
            >
              <Popup className="biz-map-popup">
                <div className="biz-popup-content">
                  <div className="biz-popup-badge competitor">Competitor</div>
                  <h4 className="biz-popup-title">{comp.name || "Competitor Business"}</h4>
                  <div className="biz-popup-meta">
                    <span className="biz-popup-category">
                      {comp.category || categoryDisplay}
                    </span>
                    {comp.distance !== null && (
                      <span className="biz-popup-distance">
                        📍 {comp.distance.toFixed(2)} km away
                      </span>
                    )}
                  </div>
                </div>
              </Popup>
            </Marker>
          ))}
        </MapContainer>
      </div>

      {/* MAP LEGEND */}
      <MapLegend radius={activeRadius} competitorCount={visibleCompetitors.length} />
    </div>
  );
}

export default CompetitorMap;

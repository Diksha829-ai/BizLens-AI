import React from "react";

function MapLegend({ radius = 3, competitorCount = 0 }) {
  return (
    <div className="biz-map-legend">
      <div className="biz-legend-item">
        <span className="biz-legend-icon-marker selected"></span>
        <span>Selected Location</span>
      </div>

      <div className="biz-legend-item">
        <span className="biz-legend-icon-marker competitor"></span>
        <span>Nearby Competitors ({competitorCount})</span>
      </div>

      <div className="biz-legend-item">
        <span className="biz-legend-icon-circle"></span>
        <span>{radius} km Analysis Radius</span>
      </div>
    </div>
  );
}

export default MapLegend;
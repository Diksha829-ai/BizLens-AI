import React from "react";
import { Swords, Store, MapPin, Gauge } from "lucide-react";

function CompetitionCard({ competitors }) {
  const count = competitors?.count ?? 0;
  const within500m = competitors?.within500m ?? 0;
  const within1km = competitors?.within1km ?? 0;
  const averageDistance = competitors?.averageDistance
    ? `${Number(competitors.averageDistance).toFixed(2)} km`
    : "N/A";
  const nearestName = competitors?.nearest?.name || "No nearby competitor detected";
  const nearestDist = competitors?.nearest?.distance !== undefined && competitors?.nearest?.distance !== null
    ? `${Number(competitors.nearest.distance).toFixed(2)} km`
    : null;

  return (
    <div className="biz-metric-card competition-card">
      <div className="biz-metric-card-header">
        <div className="biz-metric-icon-wrap competition-icon-wrap">
          <Store size={22} className="biz-metric-header-icon" />
        </div>
        <div>
          <h3 className="biz-metric-card-title">Competition Overview</h3>
          <span className="biz-metric-card-sub">Competitive density & proximity analysis</span>
        </div>
      </div>

      <div className="biz-stat-quad-grid">
        <div className="biz-stat-item">
          <span className="biz-stat-label">Total Competitors</span>
          <strong className="biz-stat-value">{count}</strong>
        </div>

        <div className="biz-stat-item">
          <span className="biz-stat-label">Within 500m</span>
          <strong className="biz-stat-value">{within500m}</strong>
        </div>

        <div className="biz-stat-item">
          <span className="biz-stat-label">Within 1km</span>
          <strong className="biz-stat-value">{within1km}</strong>
        </div>

        <div className="biz-stat-item">
          <span className="biz-stat-label">Average Distance</span>
          <strong className="biz-stat-value">{averageDistance}</strong>
        </div>
      </div>

      <div className="biz-nearest-competitor-box">
        <div className="biz-nearest-icon">
          <MapPin size={18} />
        </div>
        <div className="biz-nearest-info">
          <span className="biz-nearest-label">Nearest Competitor</span>
          <strong className="biz-nearest-name">{nearestName}</strong>
        </div>
        {nearestDist && (
          <span className="biz-nearest-dist-badge">{nearestDist}</span>
        )}
      </div>
    </div>
  );
}

<<<<<<< HEAD
export default CompetitionCard;
=======
export default CompetitionCard;
>>>>>>> b2e1095 (Components added)

import React from "react";
import {
  TrendingUp,
  GraduationCap,
  Building2,
  Hospital,
  Stethoscope,
  Pill,
  ShoppingBag,
  Bus,
  Landmark,
  House,
} from "lucide-react";

const DEMAND_CONFIG = [
  { key: "education", label: "Education", Icon: GraduationCap, colorClass: "icon-indigo" },
  { key: "offices", label: "Offices", Icon: Building2, colorClass: "icon-blue" },
  { key: "hospitals", label: "Hospitals", Icon: Hospital, colorClass: "icon-red" },
  { key: "clinics", label: "Clinics", Icon: Stethoscope, colorClass: "icon-cyan" },
  { key: "pharmacies", label: "Pharmacies", Icon: Pill, colorClass: "icon-amber" },
  { key: "shopping", label: "Shopping", Icon: ShoppingBag, colorClass: "icon-pink" },
  { key: "transport", label: "Transport", Icon: Bus, colorClass: "icon-emerald" },
  { key: "tourism", label: "Tourism", Icon: Landmark, colorClass: "icon-purple" },
  { key: "residential", label: "Residential", Icon: House, colorClass: "icon-slate" },
];

function DemandIndicatorCard({ demand }) {
  return (
    <div className="biz-metric-card demand-card">
      <div className="biz-metric-card-header">
        <div className="biz-metric-icon-wrap demand-icon-wrap">
          <TrendingUp size={22} className="biz-metric-header-icon" />
        </div>
        <div>
          <h3 className="biz-metric-card-title">Demand Indicators</h3>
          <span className="biz-metric-card-sub">Nearby footfall & demand-generating drivers</span>
        </div>
      </div>

      <div className="biz-demand-grid">
        {DEMAND_CONFIG.map(({ key, label, Icon, colorClass }) => {
          const value = demand?.[key] ?? 0;
          return (
            <div className="biz-demand-item" key={key}>
              <div className={`biz-demand-icon-badge ${colorClass}`}>
                <Icon size={18} aria-hidden="true" />
              </div>
              <div className="biz-demand-details">
                <span className="biz-demand-label">{label}</span>
                <strong className="biz-demand-value">{value}</strong>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default DemandIndicatorCard;

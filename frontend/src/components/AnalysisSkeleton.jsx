import React from "react";

function AnalysisSkeleton() {
  return (
    <div className="biz-skeleton-container" aria-hidden="true">
      {/* Map Skeleton */}
      <div className="biz-skeleton-card biz-skeleton-map">
        <div className="biz-skeleton-shimmer"></div>
      </div>

      {/* Main Score Skeleton */}
      <div className="biz-skeleton-card biz-skeleton-score-banner">
        <div className="biz-skeleton-line title"></div>
        <div className="biz-skeleton-line subtitle"></div>
      </div>

      {/* Grid of 2 Cards Skeleton (Competition & Demand) */}
      <div className="biz-skeleton-grid">
        <div className="biz-skeleton-card">
          <div className="biz-skeleton-line header"></div>
          <div className="biz-skeleton-line"></div>
          <div className="biz-skeleton-line"></div>
          <div className="biz-skeleton-line short"></div>
        </div>
        <div className="biz-skeleton-card">
          <div className="biz-skeleton-line header"></div>
          <div className="biz-skeleton-line"></div>
          <div className="biz-skeleton-line"></div>
          <div className="biz-skeleton-line short"></div>
        </div>
      </div>

      {/* Competitors List Skeleton */}
      <div className="biz-skeleton-card">
        <div className="biz-skeleton-line header"></div>
        <div className="biz-skeleton-line row"></div>
        <div className="biz-skeleton-line row"></div>
        <div className="biz-skeleton-line row"></div>
      </div>
    </div>
  );
}

export default AnalysisSkeleton;
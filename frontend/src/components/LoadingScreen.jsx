import React from "react";
import { LoaderCircle } from "lucide-react";
import AnalysisSkeleton from "./AnalysisSkeleton";

function LoadingScreen({
  title = "Analyzing Your Location...",
  subtitle = "Retrieving geographical insights, nearby competitors and business opportunity data.",
  showSkeleton = true,
}) {
  return (
    <div className="biz-loading-screen">
      <div className="biz-loading-header-card">
        <div className="biz-loading-spinner-wrap">
          <LoaderCircle size={44} className="biz-loading-spinner-icon" />
        </div>
        <h2 className="biz-loading-title">{title}</h2>
        <p className="biz-loading-subtitle">{subtitle}</p>
      </div>

      {showSkeleton && <AnalysisSkeleton />}
    </div>
  );
}

export default LoadingScreen;

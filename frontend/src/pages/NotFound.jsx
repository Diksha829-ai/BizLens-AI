import React from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Compass } from "lucide-react";
import BackButton from "../components/BackButton";

function NotFound() {
  const navigate = useNavigate();

  return (
    <div className="biz-notfound-page">
      <div className="biz-notfound-card">
        <div className="biz-notfound-icon">
          <Compass size={56} />
        </div>
        <span className="biz-notfound-code">404</span>
        <h1 className="biz-notfound-title">Page Not Found</h1>
        <p className="biz-notfound-desc">
          The page you are looking for doesn't exist, has been moved, or is temporarily unavailable.
        </p>

        <div className="biz-notfound-actions">
          <BackButton fallback="/dashboard" label="Go Back" />
          <button
            type="button"
            className="biz-button biz-button-primary"
            onClick={() => navigate("/dashboard")}
          >
            Dashboard
          </button>
        </div>
      </div>
    </div>
  );
}

export default NotFound;

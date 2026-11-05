import React from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";

/**
 * Reusable BackButton component for page-level navigation.
 * Uses browser history if available, with a safe fallback route.
 */
function BackButton({
  fallback = "/dashboard",
  label = "Back",
  className = "",
  style = {},
  hideIfNoHistory = false,
}) {
  const navigate = useNavigate();

  const hasHistory = window.history.state && window.history.state.idx > 0;

  if (hideIfNoHistory && !hasHistory) {
    return null;
  }

  const handleBack = () => {
    // If there is history within our app, go back; otherwise use the fallback route
    if (hasHistory) {
      navigate(-1);
    } else {
      navigate(fallback);
    }
  };

  return (
    <button
      type="button"
      onClick={handleBack}
      className={`biz-back-button ${className}`}
      style={style}
      aria-label={label}
    >
      <ArrowLeft size={18} aria-hidden="true" />
      <span>{label}</span>
    </button>
  );
}

export default BackButton;

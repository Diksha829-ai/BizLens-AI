import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./../styles/saved-analyses.css";

function SavedAnalyses() {
  const navigate = useNavigate();

  const [analyses, setAnalyses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchAnalyses = async () => {
    try {
      setLoading(true);
      setError("");

      const token = localStorage.getItem("token");

      if (!token) {
        navigate("/login");
        return;
      }

      const response = await fetch(
        "http://localhost:5000/api/analysis",
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await response.json();

      if (response.status === 401 || response.status === 403) {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        navigate("/login");
        return;
      }

      if (!response.ok) {
        throw new Error(data.message || "Failed to load saved analyses.");
      }

      setAnalyses(data.data || []);
    } catch (err) {
      console.error("Saved analyses error:", err);
      setError(err.message || "Unable to load saved analyses.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalyses();
  }, []);

  const handleDelete = async (id) => {
    const confirmed = window.confirm(
      "Are you sure you want to delete this analysis?"
    );

    if (!confirmed) return;

    try {
      const token = localStorage.getItem("token");

      const response = await fetch(
        `http://localhost:5000/api/analysis/${id}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to delete analysis.");
      }

      setAnalyses((prev) =>
        prev.filter((analysis) => analysis._id !== id)
      );
    } catch (err) {
      console.error("Delete analysis error:", err);
      alert(err.message || "Unable to delete analysis.");
    }
  };

  const getDate = (date) => {
    if (!date) return "Unknown date";

    return new Date(date).toLocaleString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getOpportunityClass = (level) => {
    if (!level) return "neutral";

    const value = level.toLowerCase();

    if (value.includes("high") || value.includes("good")) {
      return "good";
    }

    if (value.includes("medium") || value.includes("moderate")) {
      return "medium";
    }

    return "low";
  };

  const getRiskClass = (level) => {
    if (!level) return "neutral";

    const value = level.toLowerCase();

    if (value.includes("low")) return "good";
    if (value.includes("medium") || value.includes("moderate")) {
      return "medium";
    }

    return "low";
  };

  if (loading) {
    return (
      <div className="saved-page">
        <div className="saved-loading">
          <div className="saved-spinner"></div>
          <p>Loading saved analyses...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="saved-page">
      <div className="saved-container">

        {/* HEADER */}
        <div className="saved-header">
          <div>
            <h1>Saved Analyses</h1>
            <p>
              View, revisit, and manage your previous business location
              analyses.
            </p>
          </div>

          <button
            className="new-analysis-btn"
            onClick={() => navigate("/location-selection")}
          >
            + New Analysis
          </button>
        </div>

        {/* ERROR */}
        {error && (
          <div className="saved-error">
            {error}
          </div>
        )}

        {/* EMPTY STATE */}
        {!error && analyses.length === 0 && (
          <div className="saved-empty">
            <div className="empty-icon">📊</div>

            <h2>No saved analyses yet</h2>

            <p>
              Start your first business location analysis and it will
              appear here.
            </p>

            <button
              className="new-analysis-btn"
              onClick={() => navigate("/location-selection")}
            >
              Start Analysis
            </button>
          </div>
        )}

        {/* ANALYSIS LIST */}
        {analyses.length > 0 && (
          <div className="saved-list">

            <div className="saved-count">
              {analyses.length} saved{" "}
              {analyses.length === 1 ? "analysis" : "analyses"}
            </div>

            {analyses.map((analysis) => {
              const opportunityLevel =
                analysis.successLevel || "Unavailable";

              const riskLevel =
                analysis.riskLevel || "Unavailable";

              const mlAvailable =
                analysis.mlPrediction &&
                analysis.mlPrediction.opportunityProbabilityPercent !==
                  null &&
                analysis.mlPrediction.opportunityProbabilityPercent !==
                  undefined;

              const detailedDataAvailable =
                analysis.demand ||
                analysis.competitors ||
                analysis.accessibility;

              return (
                <div
                  className="saved-card"
                  key={analysis._id}
                >
                  {/* CARD TOP */}
                  <div className="saved-card-top">

                    <div>
                      <div className="saved-category">
                        {analysis.category || "Unknown Category"}
                      </div>

                      <div className="saved-location">
                        📍 {Number(analysis.latitude).toFixed(6)},{" "}
                        {Number(analysis.longitude).toFixed(6)}
                      </div>

                      <div className="saved-date">
                        {getDate(analysis.createdAt)}
                      </div>
                    </div>

                    <div className="saved-score">
                      <span>Opportunity</span>
                      <strong>
                        {analysis.successScore ?? "—"}
                      </strong>
                      <small>/ 100</small>
                    </div>
                  </div>

                  {/* METRICS */}
                  <div className="saved-metrics">

                    <div className="saved-metric">
                      <span>Opportunity</span>

                      <strong
                        className={getOpportunityClass(
                          opportunityLevel
                        )}
                      >
                        {opportunityLevel}
                      </strong>
                    </div>

                    <div className="saved-metric">
                      <span>Risk</span>

                      <strong
                        className={getRiskClass(riskLevel)}
                      >
                        {riskLevel}
                      </strong>

                      <small>
                        {analysis.riskScore ?? "—"}/100
                      </small>
                    </div>

                    <div className="saved-metric">
                      <span>Confidence</span>

                      <strong>
                        {analysis.confidence || "Unavailable"}
                      </strong>

                      <small>
                        {analysis.confidenceScore ?? "—"}/100
                      </small>
                    </div>

                    <div className="saved-metric">
                      <span>ML Opportunity</span>

                      <strong>
                        {mlAvailable
                          ? `${analysis.mlPrediction.opportunityProbabilityPercent.toFixed(
                              1
                            )}%`
                          : "Unavailable"}
                      </strong>
                    </div>

                  </div>

                  {/* HISTORICAL WARNING */}
                  {!detailedDataAvailable && (
                    <div className="saved-warning">
                      Detailed analysis data is unavailable for this
                      historical record.
                    </div>
                  )}

                  {/* ACTIONS */}
                  <div className="saved-actions">

                    <button
                      className="view-btn"
                      onClick={() =>
                        navigate(
                          `/analysis?savedId=${analysis._id}`
                        )
                      }
                    >
                      View Analysis
                    </button>

                    <button
                      className="delete-btn"
                      onClick={() =>
                        handleDelete(analysis._id)
                      }
                    >
                      Delete
                    </button>

                  </div>
                </div>
              );
            })}
          </div>
        )}

      </div>
    </div>
  );
}

export default SavedAnalyses;
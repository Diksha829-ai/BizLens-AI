import React, { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";

// Backend API base URL (production via VITE_API_URL, local fallback for development)
const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

const CompareBusinesses = () => {
  const navigate = useNavigate();

  const [analyses, setAnalyses] = useState([]);
  const [selectedIds, setSelectedIds] = useState([]);
  const [detailedAnalyses, setDetailedAnalyses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const comparisonResultsRef = useRef(null);

  // ============================================================
  // LOAD SAVED ANALYSES
  // ============================================================

  useEffect(() => {
    const fetchAnalyses = async () => {
      const token = localStorage.getItem("token");

      if (!token) {
        navigate("/login");
        return;
      }

      try {
        setLoading(true);
        setError("");

        const response = await fetch(
          `${API_URL}/api/analysis`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        const data = await response.json();

        if (!response.ok) {
          throw new Error(
            data.message || "Failed to load saved analyses."
          );
        }

        setAnalyses(data.data || []);
      } catch (err) {
        console.error("Compare analyses error:", err);
        setError(
          err.message || "Unable to load saved analyses."
        );
      } finally {
        setLoading(false);
      }
    };

    fetchAnalyses();
  }, [navigate]);

  // ============================================================
  // SELECT / DESELECT ANALYSIS
  // ============================================================

  const toggleSelection = (id) => {
    setSelectedIds((previous) => {
      if (previous.includes(id)) {
        return previous.filter(
          (selectedId) => selectedId !== id
        );
      }

      if (previous.length >= 4) {
        return previous;
      }

      return [...previous, id];
    });
  };

  // ============================================================
  // HELPERS
  // ============================================================

  const getOpportunityLevel = (score) => {
    const value = Number(score ?? 0);

    if (value >= 70) return "High";
    if (value >= 50) return "Moderate";
    return "Low";
  };

  const getRiskLevel = (score) => {
    const value = Number(score ?? 0);

    if (value >= 60) return "High";
    if (value >= 30) return "Moderate";
    return "Low";
  };

  const formatDate = (date) => {
    if (!date) {
      return "Unknown date";
    }

    return new Date(date).toLocaleDateString(
      "en-IN",
      {
        day: "2-digit",
        month: "short",
        year: "numeric",
      }
    );
  };

  const formatCoordinate = (value) => {
    const number = Number(value);

    if (Number.isNaN(number)) {
      return "—";
    }

    return number.toFixed(5);
  };

  // ============================================================
  // LOAD SELECTED ANALYSES
  // ============================================================

  useEffect(() => {
    const fetchSelectedAnalyses = async () => {
      if (selectedIds.length === 0) {
        setDetailedAnalyses([]);
        return;
      }

      const token = localStorage.getItem("token");

      if (!token) {
        navigate("/login");
        return;
      }

      try {
        const results = await Promise.all(
          selectedIds.map(async (id) => {
            const response = await fetch(
              `${API_URL}/api/analysis/${id}`,
              {
                headers: {
                  Authorization: `Bearer ${token}`,
                },
              }
            );

            const data = await response.json();

            if (!response.ok) {
              throw new Error(
                data.message ||
                  "Failed to load analysis details."
              );
            }

            return data.data;
          })
        );

        setDetailedAnalyses(results);
      } catch (err) {
        console.error(
          "Compare analysis details error:",
          err
        );

        setDetailedAnalyses([]);
      }
    };

    fetchSelectedAnalyses();
  }, [selectedIds, navigate]);

  const selectedAnalyses = detailedAnalyses;
  const scrollToComparison = () => {
  if (comparisonResultsRef.current) {
    comparisonResultsRef.current.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  }
};

  // ============================================================
  // RENDER
  // ============================================================

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#f7f9fc",
        color: "#172033",
        fontFamily:
          "Inter, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
      }}
    >
      {/* ========================================================
          HEADER
      ======================================================== */}

      <header
        style={{
          background: "#ffffff",
          borderBottom: "1px solid #e5e9f0",
          padding: "18px 32px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          position: "sticky",
          top: 0,
          zIndex: 10,
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "12px",
          }}
        >
          <div
            style={{
              width: "40px",
              height: "40px",
              borderRadius: "10px",
              background: "#172033",
              color: "#ffffff",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontWeight: "800",
              fontSize: "18px",
            }}
          >
            B
          </div>

          <div>
            <div
              style={{
                fontWeight: "800",
                fontSize: "18px",
              }}
            >
              BizLens
            </div>

            <div
              style={{
                fontSize: "11px",
                fontWeight: "700",
                color: "#6b7280",
                letterSpacing: "1px",
              }}
            >
              AI
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={() => navigate("/dashboard")}
          style={{
            border: "1px solid #dce2ea",
            background: "#ffffff",
            borderRadius: "9px",
            padding: "10px 16px",
            cursor: "pointer",
            fontWeight: "600",
            color: "#334155",
          }}
        >
          ← Dashboard
        </button>
      </header>

      {/* ========================================================
          MAIN
      ======================================================== */}

      <main
        style={{
          width: "min(1250px, calc(100% - 40px))",
          margin: "0 auto",
          padding: "42px 0 70px",
        }}
      >
        <div style={{ marginBottom: "30px" }}>
          <p
            style={{
              margin: "0 0 8px",
              fontSize: "12px",
              fontWeight: "800",
              letterSpacing: "1.5px",
              color: "#64748b",
            }}
          >
            BUSINESS INTELLIGENCE
          </p>

          <h1
            style={{
              margin: "0 0 10px",
              fontSize: "36px",
              lineHeight: "1.15",
            }}
          >
            Compare Businesses
          </h1>

          <p
            style={{
              margin: 0,
              color: "#64748b",
              fontSize: "15px",
              maxWidth: "720px",
            }}
          >
            Select 2 to 4 saved analyses to compare their
            location opportunities, competition, demand,
            accessibility, and risk.
          </p>
        </div>

        {/* ERROR */}

        {error && (
          <div
            style={{
              background: "#fff1f2",
              border: "1px solid #fecdd3",
              color: "#be123c",
              borderRadius: "10px",
              padding: "14px 16px",
              marginBottom: "20px",
            }}
          >
            {error}
          </div>
        )}

        {/* LOADING */}

        {loading ? (
          <div
            style={{
              background: "#ffffff",
              border: "1px solid #e5e9f0",
              borderRadius: "14px",
              padding: "50px",
              textAlign: "center",
              color: "#64748b",
            }}
          >
            Loading your saved analyses...
          </div>
        ) : analyses.length === 0 ? (
          /* EMPTY STATE */

          <div
            style={{
              background: "#ffffff",
              border: "1px solid #e5e9f0",
              borderRadius: "14px",
              padding: "60px 30px",
              textAlign: "center",
            }}
          >
            <div
              style={{
                fontSize: "42px",
                marginBottom: "16px",
              }}
            >
              📊
            </div>

            <h2
              style={{
                margin: "0 0 8px",
                fontSize: "22px",
              }}
            >
              No saved analyses yet
            </h2>

            <p
              style={{
                margin: "0 auto 22px",
                color: "#64748b",
                maxWidth: "500px",
              }}
            >
              Complete a location analysis first. Your
              saved reports will appear here and can then
              be compared.
            </p>

            <button
              type="button"
              onClick={() =>
                navigate("/location-selection")
              }
              style={{
                border: "none",
                background: "#172033",
                color: "#ffffff",
                borderRadius: "9px",
                padding: "12px 20px",
                cursor: "pointer",
                fontWeight: "700",
              }}
            >
              Start New Analysis →
            </button>
          </div>
        ) : (
          <>
            {/* ==================================================
                SELECTION HEADER
            ================================================== */}

            <section
              style={{
                background: "#ffffff",
                border: "1px solid #e5e9f0",
                borderRadius: "14px",
                padding: "22px",
                marginBottom: "22px",
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  gap: "20px",
                  flexWrap: "wrap",
                }}
              >
                <div>
                  <h2
                    style={{
                      margin: "0 0 5px",
                      fontSize: "19px",
                    }}
                  >
                    Select analyses
                  </h2>

                  <p
                    style={{
                      margin: 0,
                      color: "#64748b",
                      fontSize: "13px",
                    }}
                  >
                    Choose between 2 and 4 analyses.
                  </p>
                </div>

               <div
  style={{
    display: "flex",
    alignItems: "center",
    gap: "10px",
    flexWrap: "wrap",
  }}
>
  <div
    style={{
      padding: "8px 13px",
      borderRadius: "999px",
      background: "#f1f5f9",
      color: "#475569",
      fontSize: "13px",
      fontWeight: "700",
    }}
  >
    {selectedIds.length} / 4 selected
  </div>

  <button
    type="button"
    onClick={scrollToComparison}
    disabled={selectedIds.length < 2}
    style={{
      border: "none",
      background:
        selectedIds.length >= 2
          ? "#172033"
          : "#cbd5e1",
      color: "#ffffff",
      borderRadius: "9px",
      padding: "10px 16px",
      cursor:
        selectedIds.length >= 2
          ? "pointer"
          : "not-allowed",
      fontWeight: "700",
      fontSize: "13px",
      transition: "all 0.2s ease",
    }}
  >
    Compare Selected →
  </button>
</div>
              </div>
            </section>

            {/* ==================================================
                ANALYSIS CARDS
            ================================================== */}

            <section
              style={{
                display: "grid",
                gridTemplateColumns:
                  "repeat(auto-fit, minmax(260px, 1fr))",
                gap: "16px",
                marginBottom: "30px",
              }}
            >
              {analyses.map((analysis) => {
                const selected =
                  selectedIds.includes(analysis._id);

                const opportunity =
                  Number(analysis.successScore ?? 0);

                return (
                  <button
                    key={analysis._id}
                    type="button"
                    onClick={() =>
                      toggleSelection(analysis._id)
                    }
                    style={{
                      textAlign: "left",
                      background: "#ffffff",
                      border: selected
                        ? "2px solid #172033"
                        : "1px solid #e2e8f0",
                      borderRadius: "14px",
                      padding: "20px",
                      cursor: "pointer",
                      boxShadow: selected
                        ? "0 8px 24px rgba(15, 23, 42, 0.08)"
                        : "0 2px 8px rgba(15, 23, 42, 0.03)",
                      transition: "all 0.2s ease",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        justifyContent:
                          "space-between",
                        alignItems: "center",
                        marginBottom: "16px",
                      }}
                    >
                      <span
                        style={{
                          fontSize: "11px",
                          fontWeight: "800",
                          color: "#64748b",
                          letterSpacing: "1px",
                        }}
                      >
                        ANALYSIS
                      </span>

                      <span
                        style={{
                          width: "24px",
                          height: "24px",
                          borderRadius: "50%",
                          border: selected
                            ? "none"
                            : "1px solid #cbd5e1",
                          background: selected
                            ? "#172033"
                            : "#ffffff",
                          color: "#ffffff",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontSize: "13px",
                          fontWeight: "800",
                        }}
                      >
                        {selected ? "✓" : ""}
                      </span>
                    </div>

                    <h3
                      style={{
                        margin: "0 0 8px",
                        fontSize: "18px",
                        textTransform: "capitalize",
                      }}
                    >
                      {analysis.category ||
                        "Unknown Category"}
                    </h3>

                    <div
                      style={{
                        color: "#64748b",
                        fontSize: "13px",
                        lineHeight: "1.7",
                      }}
                    >
                      <div>
                        📍{" "}
                        {formatCoordinate(
                          analysis.latitude
                        )}
                        ,{" "}
                        {formatCoordinate(
                          analysis.longitude
                        )}
                      </div>

                      <div>
                        ◉ Radius:{" "}
                        {analysis.radius ?? "—"} km
                      </div>

                      <div>
                        📅{" "}
                        {formatDate(
                          analysis.createdAt
                        )}
                      </div>
                    </div>

                    <div
                      style={{
                        marginTop: "18px",
                        paddingTop: "15px",
                        borderTop:
                          "1px solid #eef2f7",
                        display: "flex",
                        justifyContent:
                          "space-between",
                        alignItems: "center",
                      }}
                    >
                      <span
                        style={{
                          fontSize: "12px",
                          color: "#64748b",
                        }}
                      >
                        Opportunity
                      </span>

                      <strong
                        style={{
                          fontSize: "20px",
                        }}
                      >
                        {opportunity}

                        <span
                          style={{
                            fontSize: "12px",
                            color: "#94a3b8",
                            fontWeight: "500",
                          }}
                        >
                          /100
                        </span>
                      </strong>
                    </div>
                  </button>
                );
              })}
            </section>

            {/* ==================================================
                COMPARISON PREVIEW
            ================================================== */}

            {selectedAnalyses.length >= 2 && (
  <section
    ref={comparisonResultsRef}
    style={{
                  background: "#ffffff",
                  border: "1px solid #e5e9f0",
                  borderRadius: "14px",
                  overflow: "hidden",
                  boxShadow:
                    "0 4px 18px rgba(15, 23, 42, 0.04)",
                }}
              >
                {(() => {
                  const metrics = [
                    
                    {
                      key: "successScore",
                      label: "Overall Opportunity",
                      getValue: (a) =>
                        Number(a.successScore ?? 0),
                      higherIsBetter: true,
                      primary: true,
                    },
                    {
                      key: "competitionScore",
                      label: "Competition Score",
                      getValue: (a) =>
                        Number(
                          a.competitionScore ??
                            a.competitors?.score ??
                            0
                        ),
                      higherIsBetter: true,
                    },
                    {
                      key: "demandScore",
                      label: "Demand Score",
                      getValue: (a) =>
                        Number(
                          a.demandScore ??
                            a.demand?.score ??
                            0
                        ),
                      higherIsBetter: true,
                    },
                    {
                      key: "accessibilityScore",
                      label: "Accessibility Score",
                      getValue: (a) =>
                        Number(
                          a.accessibilityScore ??
                            a.accessibility?.score ??
                            0
                        ),
                      higherIsBetter: true,
                    },
                    {
                      key: "locationAttractiveness",
                      label: "Location Attractiveness",
                      getValue: (a) =>
                        Number(
                          a.locationAttractiveness ?? 0
                        ),
                      higherIsBetter: true,
                    },
                    {
                      key: "riskScore",
                      label: "Risk Score",
                      getValue: (a) =>
                        Number(a.riskScore ?? 0),
                      higherIsBetter: false,
                    },
                    {
                      key: "confidenceScore",
                      label: "Confidence",
                      getValue: (a) =>
                        Number(
                          a.confidenceScore ?? 0
                        ),
                      higherIsBetter: true,
                    },
                  ];
                  const chartMetrics = [
  {
    key: "demandScore",
    label: "Demand",
    getValue: (a) =>
      Number(a.demandScore ?? a.demand?.score ?? 0),
  },
  {
    key: "accessibilityScore",
    label: "Accessibility",
    getValue: (a) =>
      Number(
        a.accessibilityScore ??
          a.accessibility?.score ??
          0
      ),
  },
  {
    key: "locationAttractiveness",
    label: "Location Attractiveness",
    getValue: (a) =>
      Number(a.locationAttractiveness ?? 0),
  },
];

                  const winner =
                    [...selectedAnalyses].sort(
                      (a, b) =>
                        Number(b.successScore ?? 0) -
                        Number(a.successScore ?? 0)
                    )[0];

                  const winnerScore = Number(
                    winner?.successScore ?? 0
                  );

                  const getMetricWinner = (metric) => {
                    const values =
                      selectedAnalyses.map(
                        (analysis) => ({
                          analysis,
                          value:
                            metric.getValue(
                              analysis
                            ),
                        })
                      );

                    return values.reduce(
                      (best, current) => {
                        if (!best) return current;

                        return metric.higherIsBetter
                          ? current.value >
                            best.value
                            ? current
                            : best
                          : current.value <
                            best.value
                          ? current
                          : best;
                      },
                      null
                    );
                  };

                  const metricWinnerIds = {};

                  metrics.forEach((metric) => {
                    metricWinnerIds[metric.key] =
                      getMetricWinner(
                        metric
                      )?.analysis?._id;
                  });

                  const winnerMetrics =
                    metrics
                      .filter(
                        (metric) =>
                          metric.key !==
                          "successScore"
                      )
                      .map((metric) => ({
                        ...metric,
                        value:
                          metric.getValue(
                            winner
                          ),
                      }))
                      .sort(
                        (a, b) =>
                          b.value - a.value
                      );

                  const aiSummary = `${winner?.category || "This business"} is the stronger overall opportunity with a score of ${winnerScore}/100. It provides the best balance of demand, accessibility, location attractiveness, competition, risk, and confidence among the selected analyses.`;

                  return (
                    <>
                      {/* WINNER SUMMARY */}

                      <div
                        style={{
                          padding: "24px",
                          background: "#f8fafc",
                          borderBottom:
                            "1px solid #e5e9f0",
                        }}
                      >
                        <div
                          style={{
                            display: "flex",
                            alignItems:
                              "center",
                            justifyContent:
                              "space-between",
                            gap: "20px",
                            flexWrap:
                              "wrap",
                          }}
                        >
                          <div>
                            <p
                              style={{
                                margin:
                                  "0 0 6px",
                                fontSize:
                                  "11px",
                                fontWeight:
                                  "800",
                                letterSpacing:
                                  "0.1em",
                                color:
                                  "#64748b",
                              }}
                            >
                              🏆 BEST OVERALL
                              OPPORTUNITY
                            </p>

                            <h3
                              style={{
                                margin: 0,
                                fontSize:
                                  "25px",
                                fontWeight:
                                  "800",
                                textTransform:
                                  "capitalize",
                                color:
                                  "#172033",
                              }}
                            >
                              {winner?.category ||
                                "Business"}
                            </h3>

                            <p
                              style={{
                                margin:
                                  "7px 0 0",
                                color:
                                  "#64748b",
                                fontSize:
                                  "13px",
                              }}
                            >
                              Highest overall
                              opportunity
                              among the
                              selected
                              analyses.
                            </p>
                          </div>

                          <div
                            style={{
                              minWidth:
                                "105px",
                              textAlign:
                                "center",
                              padding:
                                "13px 18px",
                              background:
                                "#ffffff",
                              border:
                                "1px solid #dce2ea",
                              borderRadius:
                                "12px",
                            }}
                          >
                            <strong
                              style={{
                                display:
                                  "block",
                                fontSize:
                                  "30px",
                                lineHeight:
                                  1,
                                color:
                                  "#172033",
                              }}
                            >
                              {winnerScore}
                            </strong>

                            <span
                              style={{
                                fontSize:
                                  "11px",
                                color:
                                  "#94a3b8",
                              }}
                            >
                              /100
                            </span>
                          </div>
                        </div>

                        {/* WINNER STRENGTHS */}

                        <div
                          style={{
                            display:
                              "grid",
                            gridTemplateColumns:
                              "repeat(auto-fit, minmax(170px, 1fr))",
                            gap: "10px",
                            marginTop:
                              "18px",
                          }}
                        >
                          {winnerMetrics
                            .slice(0, 3)
                            .map(
                              (metric) => (
                                <div
                                  key={
                                    metric.key
                                  }
                                  style={{
                                    background:
                                      "#ffffff",
                                    border:
                                      "1px solid #e2e8f0",
                                    borderRadius:
                                      "10px",
                                    padding:
                                      "13px 14px",
                                  }}
                                >
                                  <div
                                    style={{
                                      fontSize:
                                        "11px",
                                      color:
                                        "#64748b",
                                      marginBottom:
                                        "5px",
                                    }}
                                  >
                                    {
                                      metric.label
                                    }
                                  </div>

                                  <strong
                                    style={{
                                      fontSize:
                                        "20px",
                                      color:
                                        "#172033",
                                    }}
                                  >
                                    {
                                      metric.value
                                    }
                                  </strong>

                                  <span
                                    style={{
                                      fontSize:
                                        "11px",
                                      color:
                                        "#94a3b8",
                                      marginLeft:
                                        "3px",
                                    }}
                                  >
                                    /100
                                  </span>
                                </div>
                              )
                            )}
                        </div>
                      </div>

                      {/* AI RECOMMENDATION */}

                      <div
                        style={{
                          margin:
                            "20px 22px 0",
                          padding:
                            "16px 18px",
                          border:
                            "1px solid #e2e8f0",
                          borderRadius:
                            "10px",
                          background:
                            "#ffffff",
                        }}
                      >
                        <div
                          style={{
                            fontSize:
                              "11px",
                            fontWeight:
                              "800",
                            letterSpacing:
                              "0.08em",
                            color:
                              "#64748b",
                            marginBottom:
                              "7px",
                          }}
                        >
                          AI COMPARISON
                          INSIGHT
                        </div>

                        <p
                          style={{
                            margin: 0,
                            color:
                              "#334155",
                            fontSize:
                              "13px",
                            lineHeight:
                              1.65,
                          }}
                        >
                          {aiSummary}
                        </p>
                      </div>
{/* VISUAL COMPARISON */}

<div
  style={{
    margin: "22px",
    padding: "20px",
    border: "1px solid #e5e9f0",
    borderRadius: "12px",
    background: "#ffffff",
  }}
>
  <div style={{ marginBottom: "20px" }}>
    <h3
      style={{
        margin: "0 0 5px",
        fontSize: "18px",
      }}
    >
      Visual Comparison
    </h3>

    <p
      style={{
        margin: 0,
        color: "#64748b",
        fontSize: "13px",
      }}
    >
      Compare the key business opportunity factors at a glance.
    </p>
  </div>

  {chartMetrics.map((metric) => (
    <div
      key={metric.key}
      style={{
        marginBottom: "22px",
      }}
    >
      <div
        style={{
          fontSize: "12px",
          fontWeight: "700",
          color: "#475569",
          marginBottom: "10px",
        }}
      >
        {metric.label}
      </div>

      {selectedAnalyses.map((analysis) => {
        const value = Math.max(
          0,
          Math.min(100, metric.getValue(analysis))
        );

        return (
          <div
            key={analysis._id}
            style={{
              display: "grid",
              gridTemplateColumns: "110px 1fr 45px",
              alignItems: "center",
              gap: "10px",
              marginBottom: "8px",
            }}
          >
            <span
              style={{
                fontSize: "12px",
                color: "#64748b",
                textTransform: "capitalize",
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
              }}
            >
              {analysis.category || "Business"}
            </span>

            <div
              style={{
                height: "10px",
                background: "#eef2f7",
                borderRadius: "999px",
                overflow: "hidden",
              }}
            >
              <div
                style={{
                  width: `${value}%`,
                  height: "100%",
                  background: "#172033",
                  borderRadius: "999px",
                  transition: "width 0.4s ease",
                }}
              />
            </div>

            <strong
              style={{
                fontSize: "12px",
                textAlign: "right",
                color: "#172033",
              }}
            >
              {value}
            </strong>
          </div>
        );
      })}
    </div>
  ))}
</div>
                      {/* COMPARISON TABLE */}

                      <div
                        style={{
                          padding:
                            "22px 22px 0",
                        }}
                      >
                        <h2
                          style={{
                            margin:
                              "0 0 5px",
                            fontSize:
                              "20px",
                          }}
                        >
                          Comparison Preview
                        </h2>

                        <p
                          style={{
                            margin: 0,
                            color:
                              "#64748b",
                            fontSize:
                              "13px",
                          }}
                        >
                          Side-by-side
                          performance
                          of your
                          selected
                          analyses.
                        </p>
                      </div>

                      <div
                        style={{
                          overflowX:
                            "auto",
                          marginTop:
                            "16px",
                        }}
                      >
                        <table
                          style={{
                            width:
                              "100%",
                            borderCollapse:
                              "collapse",
                            minWidth:
                              selectedAnalyses.length *
                                220 +
                              190,
                          }}
                        >
                          <thead>
                            <tr>
                              <th
                                style={{
                                  textAlign:
                                    "left",
                                  padding:
                                    "15px 20px",
                                  borderBottom:
                                    "1px solid #e5e9f0",
                                  color:
                                    "#64748b",
                                  fontSize:
                                    "11px",
                                  letterSpacing:
                                    "0.06em",
                                }}
                              >
                                METRIC
                              </th>

                              {selectedAnalyses.map(
                                (
                                  analysis
                                ) => {
                                  const isOverallWinner =
                                    analysis._id ===
                                    winner?._id;

                                  return (
                                    <th
                                      key={
                                        analysis._id
                                      }
                                      style={{
                                        textAlign:
                                          "center",
                                        padding:
                                          "15px 20px",
                                        borderBottom:
                                          "1px solid #e5e9f0",
                                        fontSize:
                                          "14px",
                                        textTransform:
                                          "capitalize",
                                        color:
                                          "#172033",
                                      }}
                                    >
                                      {isOverallWinner && (
                                        <span
                                          style={{
                                            display:
                                              "block",
                                            fontSize:
                                              "10px",
                                            color:
                                              "#64748b",
                                            marginBottom:
                                              "4px",
                                            fontWeight:
                                              "800",
                                          }}
                                        >
                                          🏆 WINNER
                                        </span>
                                      )}

                                      {analysis.category ||
                                        "Business"}
                                    </th>
                                  );
                                }
                              )}
                            </tr>
                          </thead>

                          <tbody>
                            {metrics.map(
                              (metric) => (
                                <tr
                                  key={
                                    metric.key
                                  }
                                >
                                  <td
                                    style={{
                                      padding:
                                        "16px 20px",
                                      borderBottom:
                                        "1px solid #eef2f7",
                                      fontWeight:
                                        "600",
                                      whiteSpace:
                                        "nowrap",
                                    }}
                                  >
                                    {
                                      metric.label
                                    }

                                    {metric.key ===
                                      "riskScore" && (
                                      <span
                                        style={{
                                          display:
                                            "block",
                                          fontSize:
                                            "10px",
                                          color:
                                            "#94a3b8",
                                          fontWeight:
                                            "400",
                                          marginTop:
                                            "2px",
                                        }}
                                      >
                                        Lower is
                                        better
                                      </span>
                                    )}
                                  </td>

                                  {selectedAnalyses.map(
                                    (
                                      analysis
                                    ) => {
                                      const value =
                                        metric.getValue(
                                          analysis
                                        );

                                      const isWinner =
                                        metricWinnerIds[
                                          metric.key
                                        ] ===
                                        analysis._id;

                                      return (
                                        <td
                                          key={
                                            analysis._id
                                          }
                                          style={{
                                            textAlign:
                                              "center",
                                            padding:
                                              "16px 20px",
                                            borderBottom:
                                              "1px solid #eef2f7",
                                            fontWeight:
                                              metric.primary ||
                                              isWinner
                                                ? "800"
                                                : "500",
                                            fontSize:
                                              metric.primary
                                                ? "18px"
                                                : "15px",
                                            background:
                                              isWinner
                                                ? "#f8fafc"
                                                : "transparent",
                                            color:
                                              isWinner
                                                ? "#172033"
                                                : "#334155",
                                          }}
                                        >
                                          {value}

                                          {metric.primary && (
                                            <span
                                              style={{
                                                fontSize:
                                                  "11px",
                                                color:
                                                  "#94a3b8",
                                                fontWeight:
                                                  "500",
                                                marginLeft:
                                                  "2px",
                                              }}
                                            >
                                              /100
                                            </span>
                                          )}

                                          {isWinner && (
                                            <span
                                              style={{
                                                display:
                                                  "block",
                                                marginTop:
                                                  "4px",
                                                fontSize:
                                                  "10px",
                                                color:
                                                  "#64748b",
                                                fontWeight:
                                                  "700",
                                              }}
                                            >
                                              Best
                                            </span>
                                          )}
                                        </td>
                                      );
                                    }
                                  )}
                                </tr>
                              )
                            )}

                            {/* LOCATION */}

                            <tr>
                              <td
                                style={{
                                  padding:
                                    "16px 20px",
                                  fontWeight:
                                    "600",
                                }}
                              >
                                Location
                              </td>

                              {selectedAnalyses.map(
                                (analysis) => (
                                  <td
                                    key={
                                      analysis._id
                                    }
                                    style={{
                                      textAlign:
                                        "center",
                                      padding:
                                        "16px 20px",
                                      fontSize:
                                        "12px",
                                      color:
                                        "#64748b",
                                    }}
                                  >
                                    <span>
                                      {formatCoordinate(
                                        analysis.latitude
                                      )}
                                      ° N
                                    </span>

                                    <br />

                                    <span>
                                      {formatCoordinate(
                                        analysis.longitude
                                      )}
                                      ° E
                                    </span>
                                  </td>
                                )
                              )}
                            </tr>
                          </tbody>
                        </table>
                      </div>
                    </>
                  );
                })()}
              </section>
            )}

            {selectedAnalyses.length < 2 && (
              <div
                style={{
                  textAlign: "center",
                  padding: "25px",
                  color: "#64748b",
                  fontSize: "14px",
                }}
              >
                Select at least{" "}
                <strong>2 analyses</strong>{" "}
                to see the comparison.
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
};

export default CompareBusinesses;
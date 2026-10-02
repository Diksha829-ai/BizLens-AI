import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/dashboard.css";

function Dashboard() {
  const navigate = useNavigate();

  // =====================================================
  // AUTHENTICATION
  // =====================================================

  const token = localStorage.getItem("token");
  const isLoggedIn = !!token;

  // =====================================================
  // USER
  // =====================================================

  let user = null;

  try {
    user = JSON.parse(
      localStorage.getItem("user") || "null"
    );
  } catch (error) {
    console.error(
      "Unable to read user information:",
      error
    );

    user = null;
  }

  // =====================================================
  // DASHBOARD DATA
  // =====================================================

  const [analyses, setAnalyses] = useState([]);
  const [loadingAnalyses, setLoadingAnalyses] = useState(false);
  const [analysisError, setAnalysisError] = useState("");

  // =====================================================
  // FETCH SAVED ANALYSES
  // =====================================================

  useEffect(() => {
    const fetchDashboardData = async () => {
      if (!isLoggedIn) {
        setAnalyses([]);
        return;
      }

      try {
        setLoadingAnalyses(true);
        setAnalysisError("");

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
          throw new Error(
            data.message || "Failed to load dashboard data."
          );
        }

        setAnalyses(data.data || []);
      } catch (error) {
        console.error(
          "Dashboard analysis fetch error:",
          error
        );

        setAnalysisError(
          error.message ||
            "Unable to load dashboard data."
        );
      } finally {
        setLoadingAnalyses(false);
      }
    };

    fetchDashboardData();
  }, [isLoggedIn, token, navigate]);

  // =====================================================
  // DASHBOARD STATISTICS
  // =====================================================

  const totalAnalyses = analyses.length;

  const uniqueLocations = new Set(
    analyses.map(
      (analysis) =>
        `${analysis.latitude},${analysis.longitude}`
    )
  ).size;

  const uniqueCategories = new Set(
    analyses
      .map((analysis) => analysis.category)
      .filter(Boolean)
  ).size;

  const validOpportunityScores = analyses
    .map((analysis) => Number(analysis.successScore))
    .filter((score) => Number.isFinite(score));

  const averageOpportunity =
    validOpportunityScores.length > 0
      ? Math.round(
          validOpportunityScores.reduce(
            (sum, score) => sum + score,
            0
          ) / validOpportunityScores.length
        )
      : 0;

  const recentAnalyses = analyses.slice(0, 5);
// =====================================================
// DASHBOARD INSIGHTS
// =====================================================

const highOpportunityCount = analyses.filter(
  (analysis) => Number(analysis.successScore) >= 70
).length;

const moderateOpportunityCount = analyses.filter(
  (analysis) =>
    Number(analysis.successScore) >= 50 &&
    Number(analysis.successScore) < 70
).length;

const lowerOpportunityCount = analyses.filter(
  (analysis) => Number(analysis.successScore) < 50
).length;

const lowRiskCount = analyses.filter(
  (analysis) => Number(analysis.riskScore) < 30
).length;

const mediumRiskCount = analyses.filter(
  (analysis) =>
    Number(analysis.riskScore) >= 30 &&
    Number(analysis.riskScore) < 60
).length;

const highRiskCount = analyses.filter(
  (analysis) => Number(analysis.riskScore) >= 60
).length;

const mlPredictionCount = analyses.filter(
  (analysis) =>
    analysis.mlPrediction &&
    analysis.mlPrediction.opportunityProbabilityPercent !==
      null &&
    analysis.mlPrediction.opportunityProbabilityPercent !==
      undefined
).length;

// =====================================================
// CATEGORY DISTRIBUTION
// =====================================================

const categoryCounts = analyses.reduce(
  (counts, analysis) => {
    const category =
      analysis.category || "Unknown";

    counts[category] =
      (counts[category] || 0) + 1;

    return counts;
  },
  {}
);

const categoryDistribution = Object.entries(
  categoryCounts
)
  .sort((a, b) => b[1] - a[1])
  .slice(0, 5);
  // =====================================================
  // LOGOUT
  // =====================================================

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");

    navigate("/dashboard");
  };

  // =====================================================
  // NEW ANALYSIS
  // =====================================================

  const handleNewAnalysis = () => {
    if (!isLoggedIn) {
      navigate("/login");
      return;
    }

    navigate("/location-selection");
  };

  // =====================================================
  // SIGN IN
  // =====================================================

  const handleLogin = () => {
    navigate("/login");
  };

  // =====================================================
  // SIGN UP
  // =====================================================

  const handleSignup = () => {
    navigate("/register");
  };

  // =====================================================
  // VIEW SAVED ANALYSIS
  // =====================================================

  const handleViewAnalysis = (id) => {
    navigate(`/analysis?savedId=${id}`);
  };

  // =====================================================
  // DATE FORMAT
  // =====================================================

  const formatDate = (date) => {
    if (!date) {
      return "Unknown date";
    }

    return new Date(date).toLocaleString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // =====================================================
  // RENDER
  // =====================================================

  return (
    <div className="dashboard-page">

      {/* =================================================
          SIDEBAR
          ================================================= */}

      <aside className="dashboard-sidebar">

        {/* LOGO */}

        <div className="sidebar-logo">

          <div className="logo-icon">
            B
          </div>

          <div>
            <div className="logo-name">
              BizLens
            </div>

            <div className="logo-ai">
              AI
            </div>
          </div>

        </div>

        {/* NAVIGATION */}

        <nav className="sidebar-nav">

          {/* DASHBOARD */}

          <button
            className="sidebar-item active"
            type="button"
            onClick={() =>
              navigate("/dashboard")
            }
          >
            <span>📊</span>
            Dashboard
          </button>

          {/* NEW ANALYSIS */}

          <button
            className="sidebar-item"
            type="button"
            onClick={handleNewAnalysis}
          >
            <span>📍</span>
            New Analysis
          </button>

          {/* SAVED ANALYSES */}

          <button
            className="sidebar-item"
            type="button"
            onClick={() => {
              if (!isLoggedIn) {
                navigate("/login");
                return;
              }

              navigate("/saved-analyses");
            }}
          >
            <span>📁</span>
            Saved Analyses
          </button>

          {/* COMPARE BUSINESSES */}

          <button
            className="sidebar-item"
            type="button"
            onClick={() => {
              if (!isLoggedIn) {
                navigate("/login");
                return;
              }

              alert(
                "Business comparison will be added later."
              );
            }}
          >
            <span>⚖️</span>
            Compare Businesses
          </button>

        </nav>

        {/* SIDEBAR BOTTOM */}

        <div className="sidebar-bottom">

          {/* SETTINGS */}

          <button
            className="sidebar-item"
            type="button"
            onClick={() => {
              if (!isLoggedIn) {
                navigate("/login");
                return;
              }

              alert(
                "Settings will be added later."
              );
            }}
          >
            <span>⚙️</span>
            Settings
          </button>

          {/* LOGOUT */}

          {isLoggedIn && (
            <button
              className="sidebar-item logout-item"
              type="button"
              onClick={handleLogout}
            >
              <span>↪</span>
              Logout
            </button>
          )}

        </div>

      </aside>

      {/* =================================================
          MAIN CONTENT
          ================================================= */}

      <main className="dashboard-main">

        {/* =================================================
            TOP BAR
            ================================================= */}

        <header className="dashboard-header">

          <div>

            <p className="dashboard-eyebrow">
              AI-POWERED LOCATION INTELLIGENCE
            </p>

            <h1>
              {isLoggedIn
                ? `Good to see you, ${
                    user?.name || "there"
                  } 👋`
                : "Welcome to BizLens-AI 👋"}
            </h1>

            <p className="dashboard-subtitle">
              Find the Right Location. Build the Right Business.
            </p>

          </div>

          {/* AUTH / USER */}

          {isLoggedIn ? (

            <div className="user-profile">

              <div className="user-avatar">
                {(user?.name || "U")
                  .charAt(0)
                  .toUpperCase()}
              </div>

              <div className="user-details">

                <strong>
                  {user?.name || "User"}
                </strong>

                <span>
                  {user?.email || ""}
                </span>

              </div>

            </div>

          ) : (

            <div className="auth-buttons">

              <button
                type="button"
                className="signin-button"
                onClick={handleLogin}
              >
                Sign In
              </button>

              <button
                type="button"
                className="signup-button"
                onClick={handleSignup}
              >
                Sign Up
              </button>

            </div>

          )}

        </header>

        {/* =================================================
            HERO
            ================================================= */}
<section className="analysis-hero">

  {/* HERO CONTENT */}

  <div className="hero-content">

    <div className="hero-badge">
      <span className="hero-badge-dot"></span>
      AI-Powered Location Intelligence
    </div>

    <h2>
      Find the Right Location.
      <br />
      Build the Right Business.
    </h2>

    <p>
      Make smarter business decisions using
      location data, competition analysis,
      demand insights and AI-powered predictions.
    </p>

    <div className="hero-actions">

      <button
        className="hero-button"
        type="button"
        onClick={handleNewAnalysis}
      >
        <span>
          Start New Analysis
        </span>

        <span className="hero-button-arrow">
          →
        </span>
      </button>

      <div className="hero-trust">
        <span>✓</span>
        42 business categories
      </div>

    </div>

  </div>

  {/* HERO VISUAL */}

  <div className="hero-visual">

    <div className="hero-glow"></div>

    <div className="hero-orbit hero-orbit-one"></div>
    <div className="hero-orbit hero-orbit-two"></div>

    <div className="map-orb">

      <div className="map-grid">

        <span className="map-marker marker-one">
          📍
        </span>

        <span className="map-marker marker-two">
          🏪
        </span>

        <span className="map-marker marker-three">
          ☕
        </span>

        <span className="map-marker marker-four">
          🏢
        </span>

        <span className="map-marker marker-five">
          🏥
        </span>

      </div>

      <div className="map-score">

        <small>
          LOCATION
        </small>

        <strong>
          AI
        </strong>

        <span>
          INTELLIGENCE
        </span>

      </div>

    </div>

    {/* FLOATING DATA CARDS */}

    <div className="hero-floating-card hero-card-demand">

      <span className="floating-icon">
        📈
      </span>

      <div>
        <small>
          Demand
        </small>

        <strong>
          Smart
        </strong>
      </div>

    </div>

    <div className="hero-floating-card hero-card-competition">

      <span className="floating-icon">
        🎯
      </span>

      <div>
        <small>
          Competition
        </small>

        <strong>
          Analyzed
        </strong>
      </div>

    </div>

    <div className="hero-floating-card hero-card-ai">

      <span className="ai-pulse"></span>

      <div>
        <small>
          AI Engine
        </small>

        <strong>
          Ready
        </strong>
      </div>

    </div>

  </div>

</section>
        {/* =================================================
            QUICK STATS
            ================================================= */}

        <section className="dashboard-section">

          <div className="section-heading">

            <div>

              <h2>
                Your Workspace
              </h2>

              <p>
                Your BizLens-AI activity at a glance.
              </p>

            </div>

          </div>

          <div className="stats-grid">

            {/* ANALYSES */}

            <div className="biz-stat-card">

              <div className="stat-top">

                <div className="biz-icon-box biz-icon-blue">
                  📊
                </div>

                <span className="stat-label">
                  ANALYSES
                </span>

              </div>

              <strong className="stat-value">
                {loadingAnalyses
                  ? "..."
                  : totalAnalyses}
              </strong>

              <span className="stat-description">
                Business analyses completed
              </span>

            </div>

            {/* LOCATIONS */}

            <div className="biz-stat-card">

              <div className="stat-top">

                <div className="biz-icon-box biz-icon-green">
                  📍
                </div>

                <span className="stat-label">
                  LOCATIONS
                </span>

              </div>

              <strong className="stat-value">
                {loadingAnalyses
                  ? "..."
                  : uniqueLocations}
              </strong>

              <span className="stat-description">
                Unique locations analyzed
              </span>

            </div>

            {/* CATEGORIES */}

            <div className="biz-stat-card">

              <div className="stat-top">

                <div className="biz-icon-box biz-icon-orange">
                  🏢
                </div>

                <span className="stat-label">
                  CATEGORIES
                </span>

              </div>

              <strong className="stat-value">
                {loadingAnalyses
                  ? "..."
                  : uniqueCategories}
              </strong>

              <span className="stat-description">
                Business categories analyzed
              </span>

            </div>

            {/* AVERAGE OPPORTUNITY */}

            <div className="biz-stat-card">

              <div className="stat-top">

                <div className="biz-icon-box biz-icon-purple">
                  🎯
                </div>

                <span className="stat-label">
                  AVG. OPPORTUNITY
                </span>

              </div>

              <strong className="stat-value">
                {loadingAnalyses
                  ? "..."
                  : `${averageOpportunity}/100`}
              </strong>

              <span className="stat-description">
                Average business opportunity score
              </span>

            </div>

          </div>

          {analysisError && (
            <div
              style={{
                marginTop: "16px",
                padding: "12px 14px",
                borderRadius: "8px",
                background: "#fef2f2",
                color: "#b91c1c",
                border: "1px solid #fecaca",
                fontSize: "14px",
              }}
            >
              {analysisError}
            </div>
          )}

        </section>

        {/* =================================================
            RECENT ANALYSES
            ================================================= */}

        
        {isLoggedIn && (
  <section className="dashboard-section recent-analyses-section">

    {/* SECTION HEADER */}

    <div className="section-heading recent-section-heading">

      <div>

        <div className="section-mini-label">
          YOUR ACTIVITY
        </div>

        <h2>
          Recent Analyses
        </h2>

        <p>
          Quickly revisit your latest business
          location analyses.
        </p>

      </div>

      {analyses.length > 0 && (
        <button
          type="button"
          className="dashboard-link-button"
          onClick={() =>
            navigate("/saved-analyses")
          }
        >
          View All
          <span>→</span>
        </button>
      )}

    </div>

    {/* LOADING */}

    {loadingAnalyses ? (

      <div className="recent-empty">
        Loading your recent analyses...
      </div>

    ) : recentAnalyses.length === 0 ? (

      /* EMPTY STATE */

      <div className="recent-empty recent-empty-premium">

        <div className="recent-empty-icon">
          📊
        </div>

        <h3>
          No analyses yet
        </h3>

        <p>
          Start your first location analysis
          to see your results here.
        </p>

        <button
          type="button"
          className="hero-button"
          onClick={handleNewAnalysis}
        >
          Start New Analysis
          <span className="hero-button-arrow">
            →
          </span>
        </button>

      </div>

    ) : (

      /* ANALYSIS LIST */

      <div className="recent-analysis-list">

        {recentAnalyses.map((analysis) => {

          const opportunity =
            Number(analysis.successScore ?? 0);

          const risk =
            Number(analysis.riskScore ?? 0);

          const opportunityLevel =
            opportunity >= 70
              ? "High Opportunity"
              : opportunity >= 50
              ? "Moderate Opportunity"
              : "Lower Opportunity";

          const opportunityClass =
            opportunity >= 70
              ? "high"
              : opportunity >= 50
              ? "moderate"
              : "low";

          const riskClass =
            risk >= 60
              ? "high"
              : risk >= 30
              ? "moderate"
              : "low";

          return (

            <div
              className="recent-analysis-card"
              key={analysis._id}
            >

              {/* LEFT SIDE */}

              <div className="recent-analysis-info">

                <div className="recent-analysis-top">

                  <div className="recent-category">

                    <span className="recent-category-dot"></span>

                    {analysis.category ||
                      "Unknown Category"}

                  </div>

                  <span
                    className={`recent-opportunity-badge ${opportunityClass}`}
                  >
                    {opportunityLevel}
                  </span>

                </div>

                <div className="recent-location">
                  <span>📍</span>

                  {Number(
                    analysis.latitude
                  ).toFixed(5)}

                  ,{" "}

                  {Number(
                    analysis.longitude
                  ).toFixed(5)}

                </div>

                <div className="recent-date">
                  {formatDate(
                    analysis.createdAt
                  )}
                </div>

              </div>

              {/* OPPORTUNITY */}

              <div className="recent-score-block">

                <div className="recent-score-header">

                  <span>
                    Opportunity
                  </span>

                  <strong>
                    {analysis.successScore ?? "—"}
                    <small>/100</small>
                  </strong>

                </div>

                <div className="recent-progress-track">

                  <div
                    className={`recent-progress-fill opportunity-${opportunityClass}`}
                    style={{
                      width: `${Math.min(
                        Math.max(opportunity, 0),
                        100
                      )}%`,
                    }}
                  ></div>

                </div>

              </div>

              {/* RISK */}

              <div className="recent-score-block">

                <div className="recent-score-header">

                  <span>
                    Risk
                  </span>

                  <strong>
                    {analysis.riskScore ?? "—"}
                    <small>/100</small>
                  </strong>

                </div>

                <div className="recent-progress-track">

                  <div
                    className={`recent-progress-fill risk-${riskClass}`}
                    style={{
                      width: `${Math.min(
                        Math.max(risk, 0),
                        100
                      )}%`,
                    }}
                  ></div>

                </div>

              </div>

              {/* VIEW */}

              <button
                type="button"
                className="recent-view-button"
                onClick={() =>
                  handleViewAnalysis(
                    analysis._id
                  )
                }
              >
                <span>
                  View Analysis
                </span>

                <strong>
                  →
                </strong>

              </button>

            </div>

          );

        })}

      </div>

    )}

  </section>
)}
{/* =================================================
    ANALYSIS INSIGHTS
    ================================================= */}
<section className="dashboard-section analysis-insights-section">

  {/* =====================================================
      SECTION HEADER
      ===================================================== */}

  <div className="section-heading insights-main-heading">

    <div>

      <div className="section-mini-label">
        AI OVERVIEW
      </div>

      <h2>
        Analysis Insights
      </h2>

      <p>
        A quick overview of your location analysis history.
      </p>

    </div>

  </div>


  {/* =====================================================
      INSIGHT SUMMARY
      ===================================================== */}

  <div className="insights-grid">

    {/* HIGH OPPORTUNITY */}

    <div className="insight-card insight-card-green">

      <div className="insight-card-glow"></div>

      <div className="insight-card-top">

        <div className="insight-icon insight-icon-green">
          🎯
        </div>

        <span className="insight-status">
          70+
        </span>

      </div>

      <div className="insight-content">

        <span className="insight-label">
          HIGH OPPORTUNITY
        </span>

        <strong>
          {loadingAnalyses
            ? "..."
            : highOpportunityCount}
        </strong>

        <p>
          Analyses scoring 70 or above
        </p>

      </div>

    </div>


    {/* MODERATE OPPORTUNITY */}

    <div className="insight-card insight-card-orange">

      <div className="insight-card-glow"></div>

      <div className="insight-card-top">

        <div className="insight-icon insight-icon-orange">
          📊
        </div>

        <span className="insight-status">
          50–69
        </span>

      </div>

      <div className="insight-content">

        <span className="insight-label">
          MODERATE OPPORTUNITY
        </span>

        <strong>
          {loadingAnalyses
            ? "..."
            : moderateOpportunityCount}
        </strong>

        <p>
          Analyses scoring 50–69
        </p>

      </div>

    </div>


    {/* LOWER OPPORTUNITY */}

    <div className="insight-card insight-card-red">

      <div className="insight-card-glow"></div>

      <div className="insight-card-top">

        <div className="insight-icon insight-icon-red">
          📉
        </div>

        <span className="insight-status">
          &lt;50
        </span>

      </div>

      <div className="insight-content">

        <span className="insight-label">
          LOWER OPPORTUNITY
        </span>

        <strong>
          {loadingAnalyses
            ? "..."
            : lowerOpportunityCount}
        </strong>

        <p>
          Analyses scoring below 50
        </p>

      </div>

    </div>


    {/* ML PREDICTIONS */}

    <div className="insight-card insight-card-purple">

      <div className="insight-card-glow"></div>

      <div className="insight-card-top">

        <div className="insight-icon insight-icon-purple">
          🤖
        </div>

        <span className="insight-status">
          AI
        </span>

      </div>

      <div className="insight-content">

        <span className="insight-label">
          ML PREDICTIONS
        </span>

        <strong>
          {loadingAnalyses
            ? "..."
            : `${mlPredictionCount}/${totalAnalyses}`}
        </strong>

        <p>
          Analyses with ML prediction
        </p>

      </div>

    </div>

  </div>


  {/* =====================================================
      RISK DISTRIBUTION
      ===================================================== */}

  <div className="risk-summary premium-insight-panel">

    <div className="risk-summary-header">

      <div>

        <div className="panel-mini-label">
          RISK OVERVIEW
        </div>

        <h3>
          Risk Distribution
        </h3>

        <p>
          Distribution of risk scores across your analyses.
        </p>

      </div>

    </div>


    <div className="risk-grid">

      {/* LOW RISK */}

      <div className="risk-item risk-item-green">

        <span className="risk-dot risk-dot-green"></span>

        <div>

          <strong>
            {loadingAnalyses
              ? "..."
              : lowRiskCount}
          </strong>

          <span>
            Low Risk
          </span>

        </div>

      </div>


      {/* MEDIUM RISK */}

      <div className="risk-item risk-item-orange">

        <span className="risk-dot risk-dot-orange"></span>

        <div>

          <strong>
            {loadingAnalyses
              ? "..."
              : mediumRiskCount}
          </strong>

          <span>
            Medium Risk
          </span>

        </div>

      </div>


      {/* HIGH RISK */}

      <div className="risk-item risk-item-red">

        <span className="risk-dot risk-dot-red"></span>

        <div>

          <strong>
            {loadingAnalyses
              ? "..."
              : highRiskCount}
          </strong>

          <span>
            High Risk
          </span>

        </div>

      </div>

    </div>

  </div>


  {/* =====================================================
      CATEGORY DISTRIBUTION
      ===================================================== */}

  <div className="category-insights premium-insight-panel">

    <div className="category-insights-header">

      <div>

        <div className="panel-mini-label">
          BUSINESS ACTIVITY
        </div>

        <h3>
          Most Analyzed Categories
        </h3>

        <p>
          Business categories you have analyzed most often.
        </p>

      </div>

      {!loadingAnalyses &&
        categoryDistribution.length > 0 && (
          <span className="category-total-badge">
            {totalAnalyses} total analyses
          </span>
        )}

    </div>


    {loadingAnalyses ? (

      <div className="category-loading">
        Loading category data...
      </div>

    ) : categoryDistribution.length === 0 ? (

      <div className="category-loading">
        No category data available yet.
      </div>

    ) : (

      <div className="category-list">

        {categoryDistribution.map(
          ([category, count], index) => {

            const percentage =
              totalAnalyses > 0
                ? Math.round(
                    (count / totalAnalyses) * 100
                  )
                : 0;

            return (

              <div
                className="category-row"
                key={category}
              >

                <div className="category-name">

                  <span className="category-rank">
                    {String(index + 1).padStart(2, "0")}
                  </span>

                  <span>
                    {category}
                  </span>

                </div>


                <div className="category-bar-container">

                  <div
                    className="category-bar"
                    style={{
                      width: `${percentage}%`,
                    }}
                  ></div>

                </div>


                <div className="category-count">

                  <strong>
                    {count}
                  </strong>

                  <span>
                    {percentage}%
                  </span>

                </div>

              </div>

            );
          }
        )}

      </div>

    )}

  </div>

</section>
        {/* =================================================
            HOW IT WORKS
            ================================================= */}

        <section className="dashboard-section">

          <div className="section-heading">

            <div>

              <h2>
                How BizLens-AI Works
              </h2>

              <p>
                Turn a location into a data-driven
                business decision.
              </p>

            </div>

          </div>

          <div className="workflow-grid">

            {/* STEP 1 */}

            <div className="workflow-card">

              <div className="workflow-number">
                01
              </div>

              <div className="workflow-icon">
                📍
              </div>

              <h3>
                Select Location
              </h3>

              <p>
                Choose a location on the
                interactive map or search for
                an address.
              </p>

            </div>

            <div className="workflow-line">
              →
            </div>

            {/* STEP 2 */}

            <div className="workflow-card">

              <div className="workflow-number">
                02
              </div>

              <div className="workflow-icon">
                🏪
              </div>

              <h3>
                Choose Business
              </h3>

              <p>
                Select the type of business
                you want to establish.
              </p>

            </div>

            <div className="workflow-line">
              →
            </div>

            {/* STEP 3 */}

            <div className="workflow-card">

              <div className="workflow-number">
                03
              </div>

              <div className="workflow-icon">
                🤖
              </div>

              <h3>
                Get AI Insights
              </h3>

              <p>
                Receive competition, demand,
                risk and success insights.
              </p>

            </div>

          </div>

        </section>

        {/* =================================================
            FOOTER
            ================================================= */}

        <footer className="dashboard-footer">

          <span>
            © {new Date().getFullYear()} BizLens-AI
          </span>

          <span>
            AI-Powered Business Location Intelligence
          </span>

        </footer>

      </main>

    </div>
  );
}

export default Dashboard;
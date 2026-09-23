import { useNavigate } from "react-router-dom";

import "../styles/variables.css";
import "../styles/components.css";
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
  // LOGOUT
  // =====================================================

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");

    // Return to public dashboard
    navigate("/dashboard");
  };

  // =====================================================
  // NEW ANALYSIS
  // =====================================================

  const handleNewAnalysis = () => {
    // ---------------------------------------------------
    // User is not logged in
    // ---------------------------------------------------

    if (!isLoggedIn) {
      navigate("/login");
      return;
    }

    // ---------------------------------------------------
    // User is logged in
    // ---------------------------------------------------

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
  // RENDER
  // =====================================================

  return (
    <div className="dashboard-page">

      {/* =================================================
          SIDEBAR
          ================================================= */}

      <aside className="dashboard-sidebar">

        {/* =================================================
            LOGO
            ================================================= */}

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

        {/* =================================================
            NAVIGATION
            ================================================= */}

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

              alert(
                "Saved analyses will be added later."
              );

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

        {/* =================================================
            SIDEBAR BOTTOM
            ================================================= */}

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

          {/* =================================================
              LOGGED-IN USER → LOGOUT
              ================================================= */}

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

            {/* =================================================
                GREETING
                ================================================= */}

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

          {/* =================================================
              TOP RIGHT AUTH / USER
              ================================================= */}

          {isLoggedIn ? (

            /* =================================================
               LOGGED-IN USER
               ================================================= */

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

            /* =================================================
               LOGGED-OUT USER
               ================================================= */

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

          <div className="hero-content">

            <div className="hero-badge">
              ✨ AI-Powered Location Intelligence
            </div>

            <h2>

              Validate a Business Idea Before You Invest

              <br />


            </h2>

            <p>

              Analyze competition, demand,
              nearby businesses, accessibility
              and location factors before
              investing your money.

            </p>

            {/* =================================================
                START ANALYSIS
                ================================================= */}

            <button
              className="hero-button"
              type="button"
              onClick={handleNewAnalysis}
            >

              Start New Analysis

              <span>
                →
              </span>

            </button>

          </div>

          {/* =================================================
              HERO VISUAL
              ================================================= */}

          <div className="hero-visual">

            <div className="map-orb">

              <div className="map-grid">

                <span>📍</span>

                <span>🏪</span>

                <span>☕</span>

                <span>🏢</span>

                <span>🏥</span>

              </div>

              <div className="map-score">

                <small>
                  Potential
                </small>

                <strong>
                  AI
                </strong>

                <small>
                  Analysis
                </small>

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
                0
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
                0
              </strong>

              <span className="stat-description">
                Locations analyzed
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
                7
              </strong>

              <span className="stat-description">
                Business categories available
              </span>

            </div>

            {/* AI INSIGHTS */}

            <div className="biz-stat-card">

              <div className="stat-top">

                <div className="biz-icon-box biz-icon-purple">
                  🤖
                </div>

                <span className="stat-label">
                  AI INSIGHTS
                </span>

              </div>

              <strong className="stat-value">
                Ready
              </strong>

              <span className="stat-description">
                AI recommendation engine
              </span>

            </div>

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
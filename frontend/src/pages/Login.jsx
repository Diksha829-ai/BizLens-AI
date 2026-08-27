import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import "../styles/auth.css";

function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();

    try {
      const response = await fetch(
        "http://localhost:5000/api/auth/login",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            email,
            password,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        alert(data.message || "Login failed");
        return;
      }

      // Store JWT token
      localStorage.setItem("token", data.token);

      // Store user information
      localStorage.setItem(
        "user",
        JSON.stringify(data.user)
      );

      console.log("Logged-in user:", data.user);
      console.log("JWT token:", data.token);

      alert("Login successful!");

      navigate("/dashboard");
    } catch (error) {
      console.error("Login error:", error);

      alert(
        "Unable to connect to the backend"
      );
    }
  };

  return (
    <div className="auth-page">

      {/* LEFT SIDE */}

      <div className="auth-brand">

        <div className="auth-brand-content">

          <div className="auth-logo">
            <div className="auth-logo-icon">
              B
            </div>

            <div>
              <div className="auth-logo-name">
                BizLens
              </div>

              <div className="auth-logo-ai">
                AI
              </div>
            </div>
          </div>

          <div className="auth-brand-text">

            <div className="auth-badge">
              ✨ AI-Powered Location Intelligence
            </div>

            <h1>
              Make smarter
              <br />
              business decisions.
            </h1>

            <p>
              Analyze competition, demand,
              accessibility and location factors
              before investing in your next business.
            </p>

          </div>

          <div className="auth-features">

            <div className="auth-feature">
              <span>📍</span>
              <div>
                <strong>
                  Location Intelligence
                </strong>

                <small>
                  Analyze any business location
                </small>
              </div>
            </div>

            <div className="auth-feature">
              <span>📊</span>
              <div>
                <strong>
                  Business Analytics
                </strong>

                <small>
                  Understand demand and competition
                </small>
              </div>
            </div>

            <div className="auth-feature">
              <span>🤖</span>
              <div>
                <strong>
                  AI Recommendations
                </strong>

                <small>
                  Get data-driven business insights
                </small>
              </div>
            </div>

          </div>

        </div>

      </div>


      {/* RIGHT SIDE */}

      <div className="auth-form-section">

        <div className="auth-form-container">

          {/* MOBILE LOGO */}

          <div className="auth-mobile-logo">

            <div className="auth-logo-icon">
              B
            </div>

            <div>
              <div className="auth-logo-name">
                BizLens
              </div>

              <div className="auth-logo-ai">
                AI
              </div>
            </div>

          </div>


          {/* FORM HEADER */}

          <div className="auth-form-header">

            <h2>
              Welcome back
            </h2>

            <p>
              Sign in to continue to BizLens-AI
            </p>

          </div>


          {/* LOGIN FORM */}

          <form
            className="auth-form"
            onSubmit={handleLogin}
          >

            {/* EMAIL */}

            <div className="auth-input-group">

              <label htmlFor="email">
                Email Address
              </label>

              <input
                id="email"
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={(e) =>
                  setEmail(e.target.value)
                }
                required
              />

            </div>


            {/* PASSWORD */}

            <div className="auth-input-group">

              <label htmlFor="password">
                Password
              </label>

              <input
                id="password"
                type="password"
                placeholder="Enter your password"
                value={password}
                onChange={(e) =>
                  setPassword(e.target.value)
                }
                required
              />

            </div>


            {/* LOGIN BUTTON */}

            <button
              className="auth-submit-button"
              type="submit"
            >
              Sign In
              <span>→</span>
            </button>

          </form>


          {/* REGISTER */}

          <div className="auth-switch">

            <span>
              Don't have an account?
            </span>

            <Link to="/register">
              Create an account
            </Link>

          </div>


          {/* BACK TO DASHBOARD */}

          <button
            className="auth-back-button"
            type="button"
            onClick={() =>
              navigate("/dashboard")
            }
          >
            ← Continue without signing in
          </button>

        </div>

      </div>

    </div>
  );
}

export default Login;
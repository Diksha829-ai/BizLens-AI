import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import "../styles/register.css";

function Register() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const navigate = useNavigate();

  const handleRegister = async (e) => {
    e.preventDefault();

    try {
      const response = await fetch(
        "http://localhost:5000/api/auth/register",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            name,
            email,
            password,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        alert(data.message || "Registration failed");
        return;
      }

      console.log("Registered user:", data.user);

      alert("Registration successful!");

      // Clear form
      setName("");
      setEmail("");
      setPassword("");

      // Go to login
      navigate("/login");
    } catch (error) {
      console.error("Registration error:", error);
      alert("Unable to connect to the backend");
    }
  };

  return (
    <div className="register-page">

      {/* LEFT SIDE */}
      <div className="register-brand-section">

        <div className="register-brand">

          <div className="register-logo-icon">
            B
          </div>

          <div>
            <div className="register-logo-name">
              BizLens
            </div>

            <div className="register-logo-ai">
              AI
            </div>
          </div>

        </div>

        <div className="register-brand-content">

          <span className="register-badge">
            ✨ AI-Powered Location Intelligence
          </span>

          <h1>
            Make smarter
            <br />
            business decisions.
          </h1>

          <p>
            Analyze locations, competition, demand
            and business opportunities before
            investing your money.
          </p>

          <div className="register-features">

            <div className="register-feature">
              <span>📍</span>
              <div>
                <strong>Location Intelligence</strong>
                <small>
                  Discover better locations for your business.
                </small>
              </div>
            </div>

            <div className="register-feature">
              <span>📊</span>
              <div>
                <strong>Data-Driven Insights</strong>
                <small>
                  Understand demand and competition.
                </small>
              </div>
            </div>

            <div className="register-feature">
              <span>🤖</span>
              <div>
                <strong>AI Recommendations</strong>
                <small>
                  Get intelligent business recommendations.
                </small>
              </div>
            </div>

          </div>

        </div>

        <div className="register-brand-footer">
          AI-Powered Business Location Intelligence
        </div>

      </div>

      {/* RIGHT SIDE */}
      <div className="register-form-section">

        <div className="register-form-card">

          <div className="register-mobile-logo">

            <div className="register-logo-icon">
              B
            </div>

            <div>
              <div className="register-logo-name">
                BizLens
              </div>

              <div className="register-logo-ai">
                AI
              </div>
            </div>

          </div>

          <div className="register-heading">

            <span className="register-small-title">
              GET STARTED
            </span>

            <h2>
              Create your account
            </h2>

            <p>
              Join BizLens-AI and start making
              smarter business location decisions.
            </p>

          </div>

          <form
            className="register-form"
            onSubmit={handleRegister}
          >

            {/* NAME */}
            <div className="register-field">

              <label htmlFor="name">
                Full Name
              </label>

              <div className="register-input-wrapper">

                <span className="register-input-icon">
                  👤
                </span>

                <input
                  id="name"
                  type="text"
                  placeholder="Enter your full name"
                  value={name}
                  onChange={(e) =>
                    setName(e.target.value)
                  }
                  required
                />

              </div>

            </div>

            {/* EMAIL */}
            <div className="register-field">

              <label htmlFor="email">
                Email Address
              </label>

              <div className="register-input-wrapper">

                <span className="register-input-icon">
                  ✉️
                </span>

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

            </div>

            {/* PASSWORD */}
            <div className="register-field">

              <label htmlFor="password">
                Password
              </label>

              <div className="register-input-wrapper">

                <span className="register-input-icon">
                  🔒
                </span>

                <input
                  id="password"
                  type="password"
                  placeholder="Create a password"
                  value={password}
                  onChange={(e) =>
                    setPassword(e.target.value)
                  }
                  required
                />

              </div>

              <small className="register-password-hint">
                Use a strong password to keep your account secure.
              </small>

            </div>

            {/* REGISTER BUTTON */}
            <button
              type="submit"
              className="register-submit-button"
            >
              Create Account
              <span>→</span>
            </button>

          </form>

          {/* LOGIN LINK */}
          <div className="register-login-link">

            <span>
              Already have an account?
            </span>

            <Link to="/login">
              Sign In
            </Link>

          </div>

        </div>

      </div>

    </div>
  );
}

export default Register;
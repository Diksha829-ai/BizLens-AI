
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/Settings.css";

const API_URL = (
  import.meta.env.VITE_API_URL || "http://localhost:5000"
).replace(/\/+$/, "");

const Settings = () => {
  const navigate = useNavigate();

  const [user, setUser] = useState(null);
  const [savedMessage, setSavedMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordMessage, setPasswordMessage] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [passwordLoading, setPasswordLoading] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("token");
    const storedUser = localStorage.getItem("user");

    if (!token) {
      navigate("/login");
      return;
    }

    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser));
      } catch {
        setUser(null);
      }
    }
  }, [navigate]);

  const handleSave = () => {
    if (!user) return;

    localStorage.setItem("user", JSON.stringify(user));
    setSavedMessage("Settings saved successfully.");
    setErrorMessage("");

    setTimeout(() => setSavedMessage(""), 2500);
  };

  const resetPasswordForm = () => {
    setCurrentPassword("");
    setNewPassword("");
    setConfirmPassword("");
    setPasswordMessage("");
    setPasswordError("");
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();

    setPasswordMessage("");
    setPasswordError("");

    if (!currentPassword || !newPassword || !confirmPassword) {
      setPasswordError("Please fill in all password fields.");
      return;
    }

    if (newPassword.length < 8) {
      setPasswordError(
        "Your new password must contain at least 8 characters."
      );
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordError("New passwords do not match.");
      return;
    }

    if (currentPassword === newPassword) {
      setPasswordError(
        "Your new password must be different from your current password."
      );
      return;
    }

    const token = localStorage.getItem("token");

    if (!token) {
      navigate("/login");
      return;
    }

    setPasswordLoading(true);

    try {
      const response = await fetch(
        `${API_URL}/api/auth/change-password`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            currentPassword,
            newPassword,
            confirmPassword,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        if (response.status === 401) {
          setPasswordError(
            data.message || "Your session has expired. Please log in again."
          );

          if (
            data.message?.toLowerCase().includes("token") ||
            data.message?.toLowerCase().includes("authentication")
          ) {
            localStorage.removeItem("token");
            localStorage.removeItem("user");
            navigate("/login");
          }

          return;
        }

        throw new Error(
          data.message || "Unable to change password."
        );
      }

      resetPasswordForm();
      setPasswordMessage("Password changed successfully!");
      setShowPasswordForm(false);
    } catch (error) {
      setPasswordError(
        error.message || "Unable to connect to the server."
      );
    } finally {
      setPasswordLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/login");
  };

  const initials = user?.name
    ? user.name
        .split(" ")
        .map((word) => word[0])
        .join("")
        .slice(0, 2)
        .toUpperCase()
    : "U";

  return (
    <div className="settings-page">
      {/* SIDEBAR */}
      <aside className="settings-sidebar">
        <div className="settings-brand">
          <div className="settings-brand-icon">B</div>
          <div>
            <strong>BizLens</strong>
            <span>AI</span>
          </div>
        </div>

        <nav className="settings-nav">
          <button
            type="button"
            className="settings-nav-item"
            onClick={() => navigate("/dashboard")}
          >
            <span>📊</span>
            Dashboard
          </button>

          <button
            type="button"
            className="settings-nav-item"
            onClick={() => navigate("/location-selection")}
          >
            <span>📍</span>
            New Analysis
          </button>

          <button
            type="button"
            className="settings-nav-item"
            onClick={() => navigate("/saved-analyses")}
          >
            <span>📁</span>
            Saved Analyses
          </button>

          <button
            type="button"
            className="settings-nav-item"
            onClick={() => navigate("/compare-businesses")}
          >
            <span>⚖️</span>
            Compare Businesses
          </button>
        </nav>

        <div className="settings-sidebar-bottom">
          <button
            type="button"
            className="settings-nav-item active"
          >
            <span>⚙️</span>
            Settings
          </button>

          <button
            type="button"
            className="settings-nav-item logout"
            onClick={handleLogout}
          >
            <span>↪</span>
            Logout
          </button>
        </div>
      </aside>

      {/* MAIN CONTENT */}
      <main className="settings-main">
        <header className="settings-header">
          <div>
            <p className="settings-eyebrow">
              ACCOUNT &amp; PREFERENCES
            </p>
            <h1>Settings</h1>
            <p>Manage your profile and BizLens-AI preferences.</p>
          </div>
        </header>

        {/* PROFILE */}
        <section className="settings-card">
          <div className="settings-card-header">
            <div>
              <h2>Profile</h2>
              <p>Your basic account information.</p>
            </div>
          </div>

          <div className="settings-profile">
            <div className="settings-avatar">{initials}</div>
            <div>
              <h3>{user?.name || "User"}</h3>
              <p>{user?.email || "No email available"}</p>
            </div>
          </div>

          <div className="settings-form">
            <div className="settings-field">
              <label htmlFor="fullName">Full Name</label>
              <input
                id="fullName"
                type="text"
                value={user?.name || ""}
                onChange={(e) =>
                  setUser((previous) => ({
                    ...previous,
                    name: e.target.value,
                  }))
                }
                placeholder="Enter your name"
              />
            </div>

            <div className="settings-field">
              <label htmlFor="emailAddress">Email Address</label>
              <input
                id="emailAddress"
                type="email"
                value={user?.email || ""}
                readOnly
              />
              <small>Email address cannot be changed here.</small>
            </div>
          </div>
        </section>

        {/* PREFERENCES */}
        <section className="settings-card">
          <div className="settings-card-header">
            <div>
              <h2>Preferences</h2>
              <p>Customize your BizLens-AI experience.</p>
            </div>
          </div>

          <div className="settings-preference">
            <div>
              <strong>Default Analysis Radius</strong>
              <p>
                Choose the radius used when starting a new analysis.
              </p>
            </div>

            <select
              value={localStorage.getItem("selectedRadius") || "2"}
              onChange={(e) => {
                localStorage.setItem(
                  "selectedRadius",
                  e.target.value
                );
                localStorage.setItem(
                  "analysisRadius",
                  e.target.value
                );
              }}
            >
              <option value="1">1 km</option>
              <option value="2">2 km</option>
              <option value="3">3 km</option>
              <option value="5">5 km</option>
              <option value="10">10 km</option>
            </select>
          </div>
        </section>

        {/* SECURITY */}
        <section className="settings-card">
          <div className="settings-card-header">
            <div>
              <h2>Security</h2>
              <p>Manage your account security.</p>
            </div>
          </div>

          <div className="settings-security-row">
            <div>
              <strong>Password</strong>
              <p>
                Change your password to keep your account secure.
              </p>
            </div>

            <button
              type="button"
              className="settings-secondary-button"
              onClick={() => {
                resetPasswordForm();
                setPasswordMessage("");
                setPasswordError("");
                setShowPasswordForm((previous) => !previous);
              }}
            >
              {showPasswordForm ? "Cancel" : "Change Password"}
            </button>
          </div>

          {passwordMessage && (
            <p className="settings-success" role="status">
              ✓ {passwordMessage}
            </p>
          )}

          {passwordError && (
            <p className="settings-error" role="alert">
              {passwordError}
            </p>
          )}

          {showPasswordForm && (
            <form
              className="settings-password-form"
              onSubmit={handleChangePassword}
            >
              <div className="settings-field">
                <label htmlFor="currentPassword">
                  Current Password
                </label>
                <input
                  id="currentPassword"
                  type="password"
                  autoComplete="current-password"
                  value={currentPassword}
                  onChange={(e) =>
                    setCurrentPassword(e.target.value)
                  }
                  required
                />
              </div>

              <div className="settings-field">
                <label htmlFor="newPassword">New Password</label>
                <input
                  id="newPassword"
                  type="password"
                  autoComplete="new-password"
                  minLength={8}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                />
                <small>Use at least 8 characters.</small>
              </div>

              <div className="settings-field">
                <label htmlFor="confirmPassword">
                  Confirm New Password
                </label>
                <input
                  id="confirmPassword"
                  type="password"
                  autoComplete="new-password"
                  minLength={8}
                  value={confirmPassword}
                  onChange={(e) =>
                    setConfirmPassword(e.target.value)
                  }
                  required
                />
              </div>

              <button
                type="submit"
                className="settings-save-button"
                disabled={passwordLoading}
              >
                {passwordLoading
                  ? "Updating Password..."
                  : "Update Password"}
              </button>
            </form>
          )}
        </section>

        {/* ACTIONS */}
        <div className="settings-actions">
          {savedMessage && (
            <span className="settings-success" role="status">
              ✓ {savedMessage}
            </span>
          )}

          {errorMessage && (
            <span className="settings-error" role="alert">
              {errorMessage}
            </span>
          )}

          <button
            type="button"
            className="settings-save-button"
            onClick={handleSave}
          >
            Save Changes
          </button>
        </div>
      </main>
    </div>
  );
};

export default Settings;

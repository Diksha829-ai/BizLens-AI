import { useEffect, useState } from "react";
import { Navigate, Route, Routes } from "react-router-dom";

import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import LocationSelection from "./pages/LocationSelection";
import BusinessCategory from "./pages/BusinessCategory";
import AnalysisPreview from "./pages/AnalysisPreview";
import Analysis from "./pages/Analysis";
import SavedAnalyses from "./pages/SavedAnalyses";
import Settings from "./pages/Settings";
import CompareBusinesses from "./pages/CompareBusinesses";

// =====================================================
// PROTECTED ROUTE
// =====================================================

function ProtectedRoute({ children }) {
  const token = localStorage.getItem("token");

  return token ? (
    children
  ) : (
    <Navigate to="/login" replace />
  );
}

// =====================================================
// PUBLIC AUTH ROUTE
// If already logged in, don't allow Login/Register
// =====================================================

function PublicAuthRoute({ children }) {
  const token = localStorage.getItem("token");

  return token ? (
    <Navigate to="/dashboard" replace />
  ) : (
    children
  );
}

// =====================================================
// APP
// =====================================================

function App() {

  // ===================================================
  // SESSION INITIALIZATION
  //
  // A new browser tab/session starts logged out.
  // Refreshing the same tab keeps the current login.
  // ===================================================

  const [sessionReady, setSessionReady] = useState(false);

  useEffect(() => {

    const sessionStarted =
      sessionStorage.getItem(
        "bizlensSessionStarted"
      );

    // -----------------------------------------------
    // NEW BROWSER SESSION
    // -----------------------------------------------

    if (!sessionStarted) {

      // Clear previous login
      localStorage.removeItem("token");
      localStorage.removeItem("user");

      // Mark this browser tab/session as started
      sessionStorage.setItem(
        "bizlensSessionStarted",
        "true"
      );
    }

    setSessionReady(true);

  }, []);


  // ===================================================
  // WAIT UNTIL SESSION IS INITIALIZED
  // ===================================================

  if (!sessionReady) {
    return null;
  }


  // ===================================================
  // ROUTES
  // ===================================================

  return (
    <Routes>

      {/* =================================================
          DEFAULT
          ================================================= */}

      <Route
        path="/"
        element={
          <Navigate to="/login" replace />
        }
      />


      {/* =================================================
          PUBLIC DASHBOARD

          Kept exactly as your current application.
          Dashboard itself handles logged-in/logged-out
          states.
          ================================================= */}

      <Route
        path="/dashboard"
        element={<Dashboard />}
      />


      {/* =================================================
          AUTHENTICATION
          ================================================= */}

      <Route
        path="/login"
        element={
          <PublicAuthRoute>
            <Login />
          </PublicAuthRoute>
        }
      />

      <Route
        path="/register"
        element={
          <PublicAuthRoute>
            <Register />
          </PublicAuthRoute>
        }
      />


      {/* =================================================
          PROTECTED APPLICATION
          ================================================= */}

      <Route
        path="/business-category"
        element={
          <ProtectedRoute>
            <BusinessCategory />
          </ProtectedRoute>
        }
      />

      <Route
        path="/location-selection"
        element={
          <ProtectedRoute>
            <LocationSelection />
          </ProtectedRoute>
        }
      />

      <Route
        path="/analysis-preview"
        element={
          <ProtectedRoute>
            <AnalysisPreview />
          </ProtectedRoute>
        }
      />

      <Route
        path="/analysis"
        element={
          <ProtectedRoute>
            <Analysis />
          </ProtectedRoute>
        }
      />

      <Route
        path="/saved-analyses"
        element={
          <ProtectedRoute>
            <SavedAnalyses />
          </ProtectedRoute>
        }
      />


      {/* =================================================
          UNKNOWN ROUTE
          ================================================= */}

      <Route
        path="*"
        element={
          <Navigate to="/login" replace />
        }
      />
      <Route
  path="/settings"
  element={
    <ProtectedRoute>
      <Settings />
    </ProtectedRoute>
  }
/>
<Route
  path="/compare-businesses"
  element={
    <ProtectedRoute>
      <CompareBusinesses />
    </ProtectedRoute>
  }
/>

    </Routes>
  );
}

export default App;
import { Navigate, Route, Routes } from "react-router-dom";

import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import LocationSelection from "./pages/LocationSelection";
import BusinessCategory from "./pages/BusinessCategory";
import AnalysisPreview from "./pages/AnalysisPreview";
import Analysis from "./pages/Analysis";
import SavedAnalyses from "./pages/SavedAnalyses";

// =====================================================
// PROTECTED ROUTE
// =====================================================

function ProtectedRoute({ children }) {
  const token = localStorage.getItem("token");

  return token ? children : <Navigate to="/login" replace />;
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
  return (
    <Routes>

      {/* =================================================
          DEFAULT
          ================================================= */}

      <Route
        path="/"
        element={
          <Navigate to="/dashboard" replace />
        }
      />

      {/* =================================================
          PUBLIC DASHBOARD
          
          IMPORTANT:
          Dashboard must NOT be protected.
          
          Logged-out users can explore the dashboard.
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
          <Navigate to="/dashboard" replace />
        }
      />

    </Routes>
  );
}

export default App;
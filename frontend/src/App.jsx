import { Navigate, Route, Routes } from "react-router-dom";

import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import LocationSelection from "./pages/LocationSelection";
import BusinessCategory from "./pages/BusinessCategory";
import AnalysisPreview from "./pages/AnalysisPreview";
import Analysis from "./pages/Analysis";

// =====================================================
// PROTECTED ROUTE
// =====================================================

function ProtectedRoute({ children }) {
  const token = localStorage.getItem("token");

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  return children;
}

// =====================================================
// APP
// =====================================================

function App() {
  return (
    <Routes>

      {/* =================================================
          DEFAULT ROUTE
      ================================================= */}

      <Route
        path="/"
        element={
          <Navigate
            to="/login"
            replace
          />
        }
      />

      {/* =================================================
          PUBLIC ROUTES
      ================================================= */}

      <Route
        path="/login"
        element={<Login />}
      />

      <Route
        path="/register"
        element={<Register />}
      />

      {/* =================================================
          DASHBOARD
      ================================================= */}

      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        }
      />

      {/* =================================================
          LOCATION SELECTION
      ================================================= */}

      <Route
        path="/location-selection"
        element={
          <ProtectedRoute>
            <LocationSelection />
          </ProtectedRoute>
        }
      />

      {/* =================================================
          BUSINESS CATEGORY
      ================================================= */}

      <Route
        path="/business-category"
        element={
          <ProtectedRoute>
            <BusinessCategory />
          </ProtectedRoute>
        }
      />

      {/* =================================================
          ANALYSIS PREVIEW
      ================================================= */}

      <Route
        path="/analysis-preview"
        element={
          <ProtectedRoute>
            <AnalysisPreview />
          </ProtectedRoute>
        }
      />

      {/* =================================================
          BUSINESS ANALYSIS
      ================================================= */}

      <Route
        path="/analysis"
        element={
          <ProtectedRoute>
            <Analysis />
          </ProtectedRoute>
        }
      />

      {/* =================================================
          UNKNOWN ROUTE
      ================================================= */}

      <Route
        path="*"
        element={
          <Navigate
            to="/login"
            replace
          />
        }
      />

    </Routes>
  );
}

export default App;
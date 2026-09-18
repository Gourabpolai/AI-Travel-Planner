import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import { AuthProvider } from "../context/AuthContext";
import { ProtectedRoute } from "../components/ProtectedRoute";
import { ErrorBoundary } from "../components/ErrorBoundary";
import { LandingPage } from "../pages/LandingPage";
import { AuthPage } from "../pages/AuthPage";
import { DashboardPage } from "../pages/DashboardPage";
import { TripDetailPage } from "../pages/TripDetailPage";
import { ProfilePage } from "../pages/ProfilePage";
import DestinationExplorer from "../pages/DestinationExplorer";
import { DestinationDetailPage } from "../pages/DestinationDetailPage";
import { PlaceDetailsPage } from "../pages/PlaceDetailsPage";

function AppRouter() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <Toaster position="top-center" toastOptions={{ duration: 4000 }} />
        <BrowserRouter>
          <Routes>
            {/* Public Routes */}
            <Route path="/" element={<LandingPage />} />
            <Route path="/signin" element={<AuthPage mode="signin" />} />
            <Route path="/signup" element={<AuthPage mode="signup" />} />

            {/* Protected Routes */}
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <DashboardPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/destination/:placeName"
              element={
                <ProtectedRoute>
                  <DestinationDetailPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/place/:placeId"
              element={<PlaceDetailsPage />}
            />
            <Route
              path="/trips/:tripId"
              element={
                <ProtectedRoute>
                  <TripDetailPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/profile"
              element={
                <ProtectedRoute>
                  <ProfilePage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/trips/:tripId/explore"
              element={
                <ProtectedRoute>
                  <DestinationExplorer />
                </ProtectedRoute>
              }
            />

            {/* Fallback */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </ErrorBoundary>
  );
}

export default AppRouter;
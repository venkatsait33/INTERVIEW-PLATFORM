/**
 * Main App Component with Router
 */

import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import { AuthProvider, useAuth } from "./context/AuthContext";
// import { ProtectedRoute, RoleGuard } from "./routes/Guards";

// Layouts
import DashboardLayout from "./components/layout/DashboardLayout";
import PublicLayout from "./components/layout/PublicLayout";

// ── Public pages ──────────────────────────────────────────
import HomePage from "./pages/HomePage";
import FeaturesPage from "./pages/FeaturesPage";
import PricingPage from "./pages/PricingPage";
import AboutPage from "./pages/AboutPage";

// Auth Pages
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";

// Dashboard Pages
import AdminDashboard from "./pages/admin/AdminDashboard";
import HRDashboard from "./pages/hr/HRDashboard";
import InterviewerDashboard from "./pages/interviewer/InterviewerDashboard";
import CandidateDashboard from "./pages/candidate/CandidateDashboard";

// Shared Pages
import InterviewsPage from "./pages/InterviewsPage";
import InterviewDetailPage from "./pages/InterviewDetailPage";
import ScheduleInterviewPage from "./pages/hr/ScheduleInterviewPage";
import UsersPage from "./pages/admin/UsersPage";

// Room
import InterviewRoomPage from "./pages/room/InterviewRoomPage";
import LobbyPage from "./pages/room/LobbyPage";

const LoadingSpinner = () => (
  <div className="min-h-screen flex items-center justify-center bg-[#04091a]">
    <div className="w-10 h-10 border-2 border-teal-400 border-t-transparent rounded-full animate-spin" />
  </div>
);
// Role-based dashboard redirect
/** Redirect unauthenticated users to /login */
const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return <LoadingSpinner />;
  if (!user) return <Navigate to="/login" replace />;
  return children;
};

/** Only allow specified roles; others are redirected to their dashboard */
const RoleGuard = ({ roles, children }) => {
  const { user, loading } = useAuth();
  if (loading) return <LoadingSpinner />;
  if (!user) return <Navigate to="/login" replace />;
  if (!roles.includes(user.role)) return <Navigate to="/dashboard" replace />;
  return children;
};

/** Push logged-in users to their role dashboard */
const DashboardRedirect = () => {
  const { user, loading } = useAuth();
  if (loading) return <LoadingSpinner />;
  if (!user) return <Navigate to="/login" replace />;
  const map = {
    admin: "/admin",
    hr: "/hr",
    interviewer: "/interviewer",
    candidate: "/candidate",
  };
  return <Navigate to={map[user.role] || "/login"} replace />;
};

/** If already logged in, redirect away from auth pages */
const GuestRoute = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return <LoadingSpinner />;
  if (user) return <DashboardRedirect />;
  return children;
};
const AppRoutes = () => (
  <Routes>
    {/* Public */}
    <Route element={<PublicLayout />}>
      <Route index element={<HomePage />} />
      <Route path="features" element={<FeaturesPage />} />
      <Route path="pricing" element={<PricingPage />} />
      <Route path="about" element={<AboutPage />} />
      <Route
        path="login"
        element={
          <GuestRoute>
            <LoginPage />
          </GuestRoute>
        }
      />
      <Route
        path="register"
        element={
          <GuestRoute>
            <RegisterPage />
          </GuestRoute>
        }
      />
    </Route>

    {/* Dashboard redirect */}
    <Route
      path="/dashboard"
      element={
        <ProtectedRoute>
          <DashboardRedirect />
        </ProtectedRoute>
      }
    />

    {/* ── Full-screen room pages (no layout) ───────────── */}
    <Route
      path="/room/:id"
      element={
        <ProtectedRoute>
          <InterviewRoomPage />
        </ProtectedRoute>
      }
    />
    <Route
      path="/lobby/:id"
      element={
        <ProtectedRoute>
          <LobbyPage />
        </ProtectedRoute>
      }
    />

    {/* ── Authenticated dashboard routes ───────────────── */}
    <Route
      element={
        <ProtectedRoute>
          <DashboardLayout />
        </ProtectedRoute>
      }
    >
      {/* Shared */}
      <Route path="interviews" element={<InterviewsPage />} />
      <Route path="interviews/:id" element={<InterviewDetailPage />} />

      {/* Admin */}
      <Route
        path="admin"
        element={
          <RoleGuard roles={["admin"]}>
            <AdminDashboard />
          </RoleGuard>
        }
      />
      <Route
        path="admin/users"
        element={
          <RoleGuard roles={["admin"]}>
            <UsersPage />
          </RoleGuard>
        }
      />

      {/* HR */}
      <Route
        path="hr"
        element={
          <RoleGuard roles={["hr", "admin"]}>
            <HRDashboard />
          </RoleGuard>
        }
      />
      <Route
        path="hr/schedule"
        element={
          <RoleGuard roles={["hr", "admin"]}>
            <ScheduleInterviewPage />
          </RoleGuard>
        }
      />

      {/* Interviewer */}
      <Route
        path="interviewer"
        element={
          <RoleGuard roles={["interviewer"]}>
            <InterviewerDashboard />
          </RoleGuard>
        }
      />

      {/* Candidate */}
      <Route
        path="candidate"
        element={
          <RoleGuard roles={["candidate"]}>
            <CandidateDashboard />
          </RoleGuard>
        }
      />
    </Route>
    {/* ── Fallback ─────────────────────────────────────── */}
    <Route path="*" element={<Navigate to="/" replace />} />
  </Routes>
);

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 4000,
            style: {
              background: "#1e293b",
              color: "#f8fafc",
              borderRadius: "10px",
            },
            success: { iconTheme: { primary: "#22c55e", secondary: "#fff" } },
            error: { iconTheme: { primary: "#ef4444", secondary: "#fff" } },
          }}
        />
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;

/**
 * Main App Component with Router
 */

import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { ProtectedRoute, RoleGuard } from "./routes/Guards";

// Layouts
import DashboardLayout from "./components/layout/DashboardLayout";

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

// Role-based dashboard redirect
const DashboardRedirect = () => {
  const { user } = useAuth();
  const roleRoutes = {
    admin: "/admin",
    hr: "/hr",
    interviewer: "/interviewer",
    candidate: "/candidate",
  };
  return <Navigate to={roleRoutes[user?.role] || "/login"} replace />;
};

const AppRoutes = () => (
  <Routes>
    {/* Public */}
    <Route path="/login" element={<LoginPage />} />
    <Route path="/register" element={<RegisterPage />} />

    {/* Dashboard redirect */}
    <Route
      path="/dashboard"
      element={
        <ProtectedRoute>
          <DashboardRedirect />
        </ProtectedRoute>
      }
    />

    {/* Authenticated routes with layout */}
    <Route
      path="/"
      element={
        <ProtectedRoute>
          <DashboardLayout />
        </ProtectedRoute>
      }
    >
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

      {/* Shared */}
      <Route path="interviews" element={<InterviewsPage />} />
      <Route path="interviews/:id" element={<InterviewDetailPage />} />
    </Route>

    {/* Interview Room - no sidebar layout */}
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

    {/* Default */}
    <Route path="/" element={<Navigate to="/dashboard" replace />} />
    <Route path="*" element={<Navigate to="/dashboard" replace />} />
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

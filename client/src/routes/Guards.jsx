/**
 * Route Guards
 * ProtectedRoute - requires authentication
 * RoleGuard - requires specific role(s)
 */

import React from "react";
import { Link, Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

// Full-page loading spinner
const LoadingScreen = () => (
  <div className="flex items-center justify-center min-h-screen bg-gray-50">
    <div className="text-center">
      <div className="w-12 h-12 mx-auto mb-4 border-4 border-indigo-500 rounded-full border-t-transparent animate-spin" />
      <p className="text-sm text-gray-500">Loading...</p>
    </div>
  </div>
);

/**
 * ProtectedRoute - Redirects to login if not authenticated
 */
export const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) return <LoadingScreen />;
  if (!user) return <Link to="/login" state={{ from: location }} replace />;

  return children;
};

/**
 * RoleGuard - Redirects if user doesn't have required role
 * @param {string[]} roles - Allowed roles
 */
export const RoleGuard = ({ roles, children }) => {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) return <LoadingScreen />;
  if (!user) return <Link to="/login" state={{ from: location }} replace />;
  if (!roles.includes(user.role)) {
    return <Link to="/dashboard" replace />;
  }

  return children;
};

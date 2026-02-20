/**
 * Dashboard Layout
 * Sidebar navigation with role-based menu items
 */

import React, { useState } from "react";
import { Outlet, NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

const roleMenus = {
  admin: [
    { label: "Dashboard", path: "/admin", icon: "📊" },
    { label: "All Interviews", path: "/interviews", icon: "🎯" },
    { label: "Users", path: "/admin/users", icon: "👥" },
  ],
  hr: [
    { label: "Dashboard", path: "/hr", icon: "🏢" },
    { label: "Interviews", path: "/interviews", icon: "🎯" },
    { label: "Schedule New", path: "/hr/schedule", icon: "📅" },
  ],
  interviewer: [
    { label: "Dashboard", path: "/interviewer", icon: "👨‍💻" },
    { label: "My Interviews", path: "/interviews", icon: "🎯" },
  ],
  candidate: [
    { label: "Dashboard", path: "/candidate", icon: "👩‍💼" },
    { label: "My Interviews", path: "/interviews", icon: "🎯" },
  ],
};

const roleBadgeColors = {
  admin: "bg-red-100 text-red-700",
  hr: "bg-blue-100 text-blue-700",
  interviewer: "bg-green-100 text-green-700",
  candidate: "bg-purple-100 text-purple-700",
};

export default function DashboardLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const menuItems = roleMenus[user?.role] || [];

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* Sidebar */}
      <aside
        className={`${sidebarOpen ? "w-64" : "w-16"} bg-gray-900 text-white flex flex-col transition-all duration-300`}
      >
        {/* Logo */}
        <div className="flex items-center h-16 gap-3 px-4 border-b border-gray-700">
          <div className="flex items-center justify-center flex-shrink-0 w-8 h-8 text-sm font-bold rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600">
            🎯
          </div>
          {sidebarOpen && (
            <span className="text-lg font-bold tracking-tight">
              InterviewPro
            </span>
          )}
        </div>

        {/* Nav Items */}
        <nav className="flex-1 px-2 py-6 space-y-1">
          {menuItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              end={
                item.path.includes("/admin") ||
                item.path.includes("/hr") ||
                item.path.includes("/interviewer") ||
                item.path.includes("/candidate")
              }
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                  isActive
                    ? "bg-indigo-600 text-white"
                    : "text-gray-400 hover:bg-gray-800 hover:text-white"
                }`
              }
            >
              <span className="text-base">{item.icon}</span>
              {sidebarOpen && <span>{item.label}</span>}
            </NavLink>
          ))}
        </nav>

        {/* User Info */}
        <div className="p-4 border-t border-gray-700">
          {sidebarOpen ? (
            <div>
              <p className="text-sm font-medium text-white truncate">
                {user?.name}
              </p>
              <span className={`badge mt-1 ${roleBadgeColors[user?.role]}`}>
                {user?.role}
              </span>
              <button
                onClick={handleLogout}
                className="w-full mt-3 text-xs text-left text-gray-400 transition-colors hover:text-red-400"
              >
                → Sign out
              </button>
            </div>
          ) : (
            <button
              onClick={handleLogout}
              className="w-full text-center text-gray-400 hover:text-red-400"
              title="Sign out"
            >
              ⇥
            </button>
          )}
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex flex-col flex-1 overflow-hidden">
        {/* Top Bar */}
        <header className="flex items-center h-16 gap-4 px-6 bg-white border-b border-gray-100">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="text-gray-500 transition-colors hover:text-gray-700"
          >
            ☰
          </button>
          <div className="flex-1" />
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-8 h-8 text-sm font-bold text-indigo-700 bg-indigo-100 rounded-full">
              {user?.name?.charAt(0).toUpperCase()}
            </div>
            <div className="hidden sm:block">
              <p className="text-sm font-medium text-gray-700">{user?.name}</p>
              <p className="text-xs text-gray-400 capitalize">{user?.role}</p>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 p-6 overflow-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

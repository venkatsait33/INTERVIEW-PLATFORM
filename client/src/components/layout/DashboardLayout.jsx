/**
 * Dashboard Layout
 * Sidebar navigation with role-based menu items
 */

import React, { useState } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const roleMenus = {
  admin: [
    { label: 'Dashboard', path: '/admin', icon: '📊' },
    { label: 'All Interviews', path: '/interviews', icon: '🎯' },
    { label: 'Users', path: '/admin/users', icon: '👥' },
  ],
  hr: [
    { label: 'Dashboard', path: '/hr', icon: '🏢' },
    { label: 'Interviews', path: '/interviews', icon: '🎯' },
    { label: 'Schedule New', path: '/hr/schedule', icon: '📅' },
  ],
  interviewer: [
    { label: 'Dashboard', path: '/interviewer', icon: '👨‍💻' },
    { label: 'My Interviews', path: '/interviews', icon: '🎯' },
  ],
  candidate: [
    { label: 'Dashboard', path: '/candidate', icon: '👩‍💼' },
    { label: 'My Interviews', path: '/interviews', icon: '🎯' },
  ],
};

const roleBadgeColors = {
  admin: 'bg-red-100 text-red-700',
  hr: 'bg-blue-100 text-blue-700',
  interviewer: 'bg-green-100 text-green-700',
  candidate: 'bg-purple-100 text-purple-700',
};

export default function DashboardLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const menuItems = roleMenus[user?.role] || [];

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen flex bg-gray-50">
      {/* Sidebar */}
      <aside className={`${sidebarOpen ? 'w-64' : 'w-16'} bg-gray-900 text-white flex flex-col transition-all duration-300`}>
        {/* Logo */}
        <div className="h-16 flex items-center px-4 border-b border-gray-700 gap-3">
          <div className="w-8 h-8 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg flex items-center justify-center text-sm font-bold flex-shrink-0">
            🎯
          </div>
          {sidebarOpen && (
            <span className="font-bold text-lg tracking-tight">InterviewPro</span>
          )}
        </div>

        {/* Nav Items */}
        <nav className="flex-1 py-6 px-2 space-y-1">
          {menuItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.path.includes('/admin') || item.path.includes('/hr') || item.path.includes('/interviewer') || item.path.includes('/candidate')}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                  isActive
                    ? 'bg-indigo-600 text-white'
                    : 'text-gray-400 hover:bg-gray-800 hover:text-white'
                }`
              }
            >
              <span className="text-base">{item.icon}</span>
              {sidebarOpen && <span>{item.label}</span>}
            </NavLink>
          ))}
        </nav>

        {/* User Info */}
        <div className="border-t border-gray-700 p-4">
          {sidebarOpen ? (
            <div>
              <p className="text-sm font-medium text-white truncate">{user?.name}</p>
              <span className={`badge mt-1 ${roleBadgeColors[user?.role]}`}>{user?.role}</span>
              <button
                onClick={handleLogout}
                className="mt-3 w-full text-left text-xs text-gray-400 hover:text-red-400 transition-colors"
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
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Bar */}
        <header className="h-16 bg-white border-b border-gray-100 flex items-center px-6 gap-4">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="text-gray-500 hover:text-gray-700 transition-colors"
          >
            ☰
          </button>
          <div className="flex-1" />
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-700 font-bold text-sm">
              {user?.name?.charAt(0).toUpperCase()}
            </div>
            <div className="hidden sm:block">
              <p className="text-sm font-medium text-gray-700">{user?.name}</p>
              <p className="text-xs text-gray-400 capitalize">{user?.role}</p>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-auto p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

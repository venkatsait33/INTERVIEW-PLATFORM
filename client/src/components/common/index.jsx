/**
 * Common Reusable Components
 */

import React from 'react';

// ── Status Badge ──
const statusStyles = {
  SCHEDULED: 'bg-blue-100 text-blue-700',
  IN_PROGRESS: 'bg-green-100 text-green-700',
  COMPLETED: 'bg-gray-100 text-gray-700',
  CANCELLED: 'bg-red-100 text-red-700',
  NO_SHOW: 'bg-orange-100 text-orange-700',
  PENDING: 'bg-yellow-100 text-yellow-700',
  HIRED: 'bg-emerald-100 text-emerald-700',
  REJECTED: 'bg-red-100 text-red-700',
};

const statusIcons = {
  SCHEDULED: '📅',
  IN_PROGRESS: '🔴',
  COMPLETED: '✅',
  CANCELLED: '❌',
  NO_SHOW: '👻',
  PENDING: '⏳',
  HIRED: '🎉',
  REJECTED: '❌',
};

export const StatusBadge = ({ status }) => (
  <span className={`badge ${statusStyles[status] || 'bg-gray-100 text-gray-600'}`}>
    {statusIcons[status]} {status}
  </span>
);

// ── Loading Spinner ──
export const Spinner = ({ size = 'md', className = '' }) => {
  const sizes = { sm: 'w-4 h-4', md: 'w-8 h-8', lg: 'w-12 h-12' };
  return (
    <div className={`${sizes[size]} border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin ${className}`} />
  );
};

export const LoadingPage = ({ message = 'Loading...' }) => (
  <div className="flex flex-col items-center justify-center py-20 gap-4">
    <Spinner size="lg" />
    <p className="text-gray-500 text-sm">{message}</p>
  </div>
);

// ── Stat Card ──
export const StatCard = ({ title, value, icon, color = 'indigo', trend }) => {
  const colors = {
    indigo: 'from-indigo-500 to-purple-600',
    green: 'from-green-500 to-emerald-600',
    blue: 'from-blue-500 to-cyan-600',
    orange: 'from-orange-500 to-red-500',
    teal: 'from-teal-500 to-green-500',
  };

  return (
    <div className="card overflow-hidden relative">
      <div className={`absolute top-0 right-0 w-24 h-24 bg-gradient-to-br ${colors[color]} opacity-10 rounded-bl-full`} />
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-gray-500 font-medium">{title}</p>
          <p className="text-3xl font-bold text-gray-900 mt-1">{value}</p>
          {trend && <p className="text-xs text-gray-400 mt-1">{trend}</p>}
        </div>
        <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${colors[color]} flex items-center justify-center text-2xl`}>
          {icon}
        </div>
      </div>
    </div>
  );
};

// ── Empty State ──
export const EmptyState = ({ icon = '📭', title, description, action }) => (
  <div className="text-center py-16">
    <div className="text-5xl mb-4">{icon}</div>
    <h3 className="text-lg font-semibold text-gray-700 mb-2">{title}</h3>
    {description && <p className="text-gray-400 text-sm mb-6">{description}</p>}
    {action}
  </div>
);

// ── Interview Card ──
export const InterviewCard = ({ interview, actions }) => {
  const dateStr = new Date(interview.scheduledAt).toLocaleDateString('en-US', {
    weekday: 'short', month: 'short', day: 'numeric',
  });
  const timeStr = new Date(interview.scheduledAt).toLocaleTimeString('en-US', {
    hour: '2-digit', minute: '2-digit',
  });

  return (
    <div className="card hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between mb-3">
        <h3 className="font-semibold text-gray-800 text-base">{interview.title}</h3>
        <StatusBadge status={interview.status} />
      </div>
      <div className="space-y-1.5 text-sm text-gray-500">
        <p>📅 {dateStr} at {timeStr}</p>
        {interview.interviewer && (
          <p>👨‍💻 {interview.interviewer.name}</p>
        )}
        {interview.candidate && (
          <p>👩‍💼 {interview.candidate.name}</p>
        )}
        {interview.duration && <p>⏱ {interview.duration} min</p>}
        {interview.result !== 'PENDING' && (
          <StatusBadge status={interview.result} />
        )}
      </div>
      {actions && <div className="mt-4 flex gap-2">{actions}</div>}
    </div>
  );
};

// ── Modal ──
export const Modal = ({ isOpen, onClose, title, children }) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-lg font-semibold">{title}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl">×</button>
        </div>
        <div className="p-6">{children}</div>
      </div>
    </div>
  );
};

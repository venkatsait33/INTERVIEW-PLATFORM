/**
 * Admin Dashboard
 * System-wide analytics and overview
 */

import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { adminService } from '../../services/interviews';
import { StatCard, LoadingPage } from '../../components/common';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import toast from 'react-hot-toast';

const COLORS = ['#667eea', '#22c55e', '#f59e0b', '#ef4444', '#8b5cf6'];

export default function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    adminService.getStats()
      .then(res => setStats(res.data.data))
      .catch(() => toast.error('Failed to load stats'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <LoadingPage />;
  if (!stats) return null;

  const roleData = stats.roleBreakdown.map(r => ({
    name: r._id, value: r.count,
  }));

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
        <p className="text-gray-500 text-sm mt-1">System-wide overview</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard title="Total Users" value={stats.totalUsers} icon="👥" color="indigo" />
        <StatCard title="Total Interviews" value={stats.totalInterviews} icon="🎯" color="blue" />
        <StatCard title="Active Sessions" value={stats.activeInterviews} icon="🔴" color="green" />
        <StatCard title="Hiring Rate" value={`${stats.hiringRate}%`} icon="🎉" color="teal" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Role Distribution */}
        <div className="card">
          <h2 className="text-base font-semibold mb-4">User Role Distribution</h2>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie data={roleData} cx="50%" cy="50%" outerRadius={80} dataKey="value" label={({ name, value }) => `${name}: ${value}`}>
                {roleData.map((_, i) => (
                  <Cell key={i} fill={COLORS[i % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Interview Results */}
        <div className="card">
          <h2 className="text-base font-semibold mb-4">Interview Results</h2>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={[
              { name: 'Completed', value: stats.completedInterviews },
              { name: 'Hired', value: stats.hiredCount },
              { name: 'Rejected', value: stats.rejectedCount },
            ]}>
              <XAxis dataKey="name" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip />
              <Bar dataKey="value" fill="#667eea" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-semibold">Recent Activity</h2>
          <Link to="/admin/users" className="text-sm text-indigo-600 hover:underline">View Users →</Link>
        </div>
        <div className="space-y-3">
          {stats.recentActivity.slice(0, 8).map((log) => (
            <div key={log._id} className="flex items-center gap-3 py-2 border-b border-gray-50 last:border-0">
              <div className="w-8 h-8 bg-indigo-50 rounded-full flex items-center justify-center text-indigo-600 text-xs font-bold">
                {log.user?.name?.charAt(0) || '?'}
              </div>
              <div className="flex-1">
                <p className="text-sm text-gray-700">
                  <span className="font-medium">{log.user?.name}</span>
                  {' '}<span className="text-gray-400">{log.action.replace(/_/g, ' ').toLowerCase()}</span>
                </p>
                <p className="text-xs text-gray-400">
                  {new Date(log.createdAt).toLocaleString()}
                </p>
              </div>
              <span className={`badge ${log.user?.role === 'admin' ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-600'}`}>
                {log.user?.role}
              </span>
            </div>
          ))}
          {!stats.recentActivity.length && (
            <p className="text-center text-gray-400 py-8">No recent activity</p>
          )}
        </div>
      </div>
    </div>
  );
}

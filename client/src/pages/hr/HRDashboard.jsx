/**
 * HR Dashboard
 */

import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { interviewService } from '../../services/interviews';
import { StatCard, InterviewCard, LoadingPage, EmptyState } from '../../components/common';
import toast from 'react-hot-toast';

export default function HRDashboard() {
  const [interviews, setInterviews] = useState([]);
  const [stats, setStats] = useState({});
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('');

  useEffect(() => {
    interviewService.getAll({ limit: 50 })
      .then(res => {
        const data = res.data.data.interviews;
        setInterviews(data);
        setStats({
          total: data.length,
          scheduled: data.filter(i => i.status === 'SCHEDULED').length,
          inProgress: data.filter(i => i.status === 'IN_PROGRESS').length,
          completed: data.filter(i => i.status === 'COMPLETED').length,
          hired: data.filter(i => i.result === 'HIRED').length,
        });
      })
      .catch(() => toast.error('Failed to load interviews'))
      .finally(() => setLoading(false));
  }, []);

  const filtered = filter ? interviews.filter(i => i.status === filter) : interviews;

  if (loading) return <LoadingPage />;

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">HR Dashboard</h1>
          <p className="text-gray-500 text-sm mt-1">Manage your interviews</p>
        </div>
        <Link to="/hr/schedule" className="btn-primary">
          + Schedule Interview
        </Link>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Total" value={stats.total} icon="🎯" color="indigo" />
        <StatCard title="Scheduled" value={stats.scheduled} icon="📅" color="blue" />
        <StatCard title="In Progress" value={stats.inProgress} icon="🔴" color="green" />
        <StatCard title="Hired" value={stats.hired} icon="🎉" color="teal" />
      </div>

      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-semibold">All Interviews</h2>
          <select
            value={filter}
            onChange={e => setFilter(e.target.value)}
            className="input-field w-auto"
          >
            <option value="">All Status</option>
            {['SCHEDULED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'].map(s => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </div>

        {filtered.length === 0 ? (
          <EmptyState
            icon="🎯"
            title="No interviews yet"
            description="Schedule your first interview to get started"
            action={<Link to="/hr/schedule" className="btn-primary">Schedule Interview</Link>}
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {filtered.map(interview => (
              <InterviewCard
                key={interview._id}
                interview={interview}
                actions={
                  <Link to={`/interviews/${interview._id}`} className="btn-secondary text-xs py-1.5">
                    View Details →
                  </Link>
                }
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

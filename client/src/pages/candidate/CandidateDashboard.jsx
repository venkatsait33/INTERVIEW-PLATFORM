/**
 * Candidate Dashboard
 */

import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { interviewService } from '../../services/interviews';
import { InterviewCard, LoadingPage, StatCard, EmptyState, StatusBadge } from '../../components/common';
import toast from 'react-hot-toast';

export default function CandidateDashboard() {
  const [interviews, setInterviews] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    interviewService.getAll()
      .then(res => setInterviews(res.data.data.interviews))
      .catch(() => toast.error('Failed to load'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <LoadingPage />;

  const upcoming = interviews.filter(i => i.status === 'SCHEDULED');
  const active = interviews.filter(i => i.status === 'IN_PROGRESS');
  const completed = interviews.filter(i => i.status === 'COMPLETED');
  const hired = completed.filter(i => i.result === 'HIRED').length;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold">My Interview Journey</h1>
        <p className="text-gray-500 text-sm mt-1">Track your progress and results</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Total" value={interviews.length} icon="🎯" color="indigo" />
        <StatCard title="Upcoming" value={upcoming.length} icon="📅" color="blue" />
        <StatCard title="Completed" value={completed.length} icon="✅" color="green" />
        <StatCard title="Offers" value={hired} icon="🎉" color="teal" />
      </div>

      {/* Active Session Alert */}
      {active.length > 0 && (
        <div className="bg-green-50 border border-green-200 rounded-xl p-4 flex items-center justify-between">
          <div>
            <p className="font-semibold text-green-800">🔴 Interview In Progress!</p>
            <p className="text-green-600 text-sm">{active[0].title}</p>
          </div>
          <Link
            to={`/lobby/${active[0]._id}`}
            className="bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-green-700"
          >
            Join Now →
          </Link>
        </div>
      )}

      {/* Upcoming */}
      <div>
        <h2 className="text-base font-semibold mb-4">Upcoming Interviews</h2>
        {upcoming.length === 0 ? (
          <EmptyState icon="📅" title="No upcoming interviews" description="Check back when something is scheduled" />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {upcoming.map(i => (
              <InterviewCard
                key={i._id}
                interview={i}
                actions={
                  <Link to={`/interviews/${i._id}`} className="btn-secondary text-xs py-1.5">
                    View Details
                  </Link>
                }
              />
            ))}
          </div>
        )}
      </div>

      {/* Past with Results */}
      {completed.length > 0 && (
        <div>
          <h2 className="text-base font-semibold mb-4">Interview History</h2>
          <div className="card p-0 divide-y divide-gray-50">
            {completed.map(i => (
              <div key={i._id} className="flex items-center justify-between p-4">
                <div>
                  <p className="font-medium text-gray-800 text-sm">{i.title}</p>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {new Date(i.scheduledAt).toLocaleDateString('en-US', { dateStyle: 'medium' })}
                    {' · '}{i.interviewer?.name}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <StatusBadge status={i.result} />
                  <Link to={`/interviews/${i._id}`} className="text-xs text-indigo-600 hover:underline">
                    Details
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

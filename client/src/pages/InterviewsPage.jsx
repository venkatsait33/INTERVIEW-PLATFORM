/**
 * Interviews List Page (shared)
 */

import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { interviewService } from '../services/interviews';
import { InterviewCard, LoadingPage, EmptyState } from '../components/common';
import toast from 'react-hot-toast';

export default function InterviewsPage() {
  const [interviews, setInterviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(1);
  const [meta, setMeta] = useState({});

  const fetchInterviews = () => {
    setLoading(true);
    interviewService.getAll({ status, page, limit: 12 })
      .then(res => {
        setInterviews(res.data.data.interviews);
        setMeta(res.data.meta);
      })
      .catch(() => toast.error('Failed to load interviews'))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    setPage(1);
  }, [status]);

  useEffect(() => {
    fetchInterviews();
  }, [status, page]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Interviews</h1>
        <div className="flex gap-3">
          <select
            value={status}
            onChange={e => setStatus(e.target.value)}
            className="input-field w-auto"
          >
            <option value="">All Status</option>
            {['SCHEDULED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'].map(s => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <div className="w-8 h-8 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin" />
        </div>
      ) : interviews.length === 0 ? (
        <EmptyState icon="🎯" title="No interviews found" />
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {interviews.map(i => (
              <InterviewCard
                key={i._id}
                interview={i}
                actions={
                  <Link to={`/interviews/${i._id}`} className="btn-secondary text-xs py-1.5">
                    View Details →
                  </Link>
                }
              />
            ))}
          </div>

          {/* Pagination */}
          {meta.pages > 1 && (
            <div className="flex justify-center gap-2 mt-8">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="btn-secondary px-3 py-1.5 text-sm disabled:opacity-40"
              >
                ← Prev
              </button>
              <span className="px-4 py-1.5 text-sm text-gray-600">
                {page} / {meta.pages}
              </span>
              <button
                onClick={() => setPage(p => Math.min(meta.pages, p + 1))}
                disabled={page === meta.pages}
                className="btn-secondary px-3 py-1.5 text-sm disabled:opacity-40"
              >
                Next →
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}

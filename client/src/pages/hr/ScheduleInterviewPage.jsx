/**
 * Schedule Interview Page (HR)
 */

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { interviewService, userService } from '../../services/interviews';
import { LoadingPage } from '../../components/common';
import toast from 'react-hot-toast';

export default function ScheduleInterviewPage() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    title: '',
    description: '',
    interviewerId: '',
    candidateId: '',
    scheduledAt: '',
    duration: 60,
  });
  const [interviewers, setInterviewers] = useState([]);
  const [candidates, setCandidates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    Promise.all([userService.getInterviewers(), userService.getCandidates()])
      .then(([iv, cd]) => {
        setInterviewers(iv.data.data.interviewers);
        setCandidates(cd.data.data.candidates);
      })
      .catch(() => toast.error('Failed to load users'))
      .finally(() => setLoading(false));
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await interviewService.schedule(form);
      toast.success('Interview scheduled! Notifications sent.');
      navigate('/interviews');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to schedule');
    } finally {
      setSubmitting(false);
    }
  };

  const set = (key, val) => setForm(f => ({ ...f, [key]: val }));

  if (loading) return <LoadingPage />;

  // Get min datetime (now)
  const minDateTime = new Date().toISOString().slice(0, 16);

  return (
    <div className="max-w-2xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Schedule Interview</h1>
        <p className="text-gray-500 text-sm mt-1">Set up a new interview session</p>
      </div>

      <div className="card">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Interview Title *</label>
            <input
              type="text"
              value={form.title}
              onChange={e => set('title', e.target.value)}
              className="input-field"
              placeholder="e.g. Senior Frontend Engineer - Round 2"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Description</label>
            <textarea
              value={form.description}
              onChange={e => set('description', e.target.value)}
              className="input-field h-24 resize-none"
              placeholder="Optional instructions or context..."
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Interviewer *</label>
              <select
                value={form.interviewerId}
                onChange={e => set('interviewerId', e.target.value)}
                className="input-field"
                required
              >
                <option value="">Select Interviewer</option>
                {interviewers.map(i => (
                  <option key={i._id} value={i._id}>{i.name} ({i.email})</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Candidate *</label>
              <select
                value={form.candidateId}
                onChange={e => set('candidateId', e.target.value)}
                className="input-field"
                required
              >
                <option value="">Select Candidate</option>
                {candidates.map(c => (
                  <option key={c._id} value={c._id}>{c.name} ({c.email})</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Date & Time *</label>
              <input
                type="datetime-local"
                value={form.scheduledAt}
                onChange={e => set('scheduledAt', e.target.value)}
                className="input-field"
                min={minDateTime}
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Duration (minutes)</label>
              <select
                value={form.duration}
                onChange={e => set('duration', parseInt(e.target.value))}
                className="input-field"
              >
                {[30, 45, 60, 90, 120].map(d => (
                  <option key={d} value={d}>{d} minutes</option>
                ))}
              </select>
            </div>
          </div>

          {/* Preview */}
          {form.interviewerId && form.candidateId && form.scheduledAt && (
            <div className="bg-indigo-50 border border-indigo-100 rounded-xl p-4 text-sm">
              <p className="font-semibold text-indigo-800 mb-2">📧 Email notifications will be sent to:</p>
              <p className="text-indigo-600">
                • {interviewers.find(i => i._id === form.interviewerId)?.name} (Interviewer)
              </p>
              <p className="text-indigo-600">
                • {candidates.find(c => c._id === form.candidateId)?.name} (Candidate)
              </p>
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <button type="submit" disabled={submitting} className="btn-primary">
              {submitting ? 'Scheduling...' : '📅 Schedule Interview'}
            </button>
            <button type="button" onClick={() => navigate(-1)} className="btn-secondary">
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

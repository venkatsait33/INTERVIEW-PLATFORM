/**
 * Interview Detail Page
 */

import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { interviewService } from '../services/interviews';
import { StatusBadge, LoadingPage, Modal } from '../components/common';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

export default function InterviewDetailPage() {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [interview, setInterview] = useState(null);
  const [loading, setLoading] = useState(true);
  const [cancelModal, setCancelModal] = useState(false);
  const [cancelReason, setCancelReason] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    interviewService.getOne(id)
      .then(res => setInterview(res.data.data.interview))
      .catch(() => {
        toast.error('Interview not found');
        navigate(-1);
      })
      .finally(() => setLoading(false));
  }, [id]);

  const handleStart = async () => {
    setActionLoading(true);
    try {
      const res = await interviewService.start(id);
      toast.success('Session started!');
      navigate(`/room/${id}?token=${res.data.data.roomToken}`);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to start');
    } finally {
      setActionLoading(false);
    }
  };

  const handleCancel = async () => {
    setActionLoading(true);
    try {
      await interviewService.cancel(id, cancelReason);
      toast.success('Interview cancelled');
      setInterview(prev => ({ ...prev, status: 'CANCELLED' }));
      setCancelModal(false);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to cancel');
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) return <LoadingPage />;
  if (!interview) return null;

  const dateStr = new Date(interview.scheduledAt).toLocaleString('en-US', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });

  return (
    <div className="max-w-3xl space-y-6">
      <div className="flex items-center gap-3">
        <button onClick={() => navigate(-1)} className="text-gray-400 hover:text-gray-600 text-lg">←</button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold">{interview.title}</h1>
          <div className="flex items-center gap-2 mt-1">
            <StatusBadge status={interview.status} />
            {interview.result !== 'PENDING' && <StatusBadge status={interview.result} />}
          </div>
        </div>
      </div>

      {/* Details Card */}
      <div className="card space-y-4">
        <h2 className="font-semibold text-gray-700 border-b pb-2">Interview Details</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
          <div><span className="text-gray-400">📅 Scheduled</span><p className="font-medium mt-0.5">{dateStr}</p></div>
          <div><span className="text-gray-400">⏱ Duration</span><p className="font-medium mt-0.5">{interview.duration} minutes</p></div>
          <div><span className="text-gray-400">👨‍💻 Interviewer</span><p className="font-medium mt-0.5">{interview.interviewer?.name}</p></div>
          <div><span className="text-gray-400">👩‍💼 Candidate</span><p className="font-medium mt-0.5">{interview.candidate?.name}</p></div>
          {interview.startedAt && (
            <div><span className="text-gray-400">▶ Started</span><p className="font-medium mt-0.5">{new Date(interview.startedAt).toLocaleString()}</p></div>
          )}
          {interview.endedAt && (
            <div><span className="text-gray-400">⏹ Ended</span><p className="font-medium mt-0.5">{new Date(interview.endedAt).toLocaleString()}</p></div>
          )}
        </div>
        {interview.description && (
          <div className="pt-2 border-t">
            <p className="text-gray-400 text-sm mb-1">Description</p>
            <p className="text-sm text-gray-700">{interview.description}</p>
          </div>
        )}
      </div>

      {/* Feedback Card (if completed) */}
      {interview.status === 'COMPLETED' && (
        <div className="card space-y-4">
          <h2 className="font-semibold text-gray-700 border-b pb-2">Interview Feedback</h2>
          {interview.rating && (
            <div>
              <p className="text-gray-400 text-sm">Rating</p>
              <div className="flex items-center gap-1 mt-1">
                {Array.from({ length: 10 }).map((_, i) => (
                  <div
                    key={i}
                    className={`w-6 h-6 rounded text-xs flex items-center justify-center ${
                      i < interview.rating ? 'bg-indigo-500 text-white' : 'bg-gray-100 text-gray-400'
                    }`}
                  >
                    {i + 1}
                  </div>
                ))}
              </div>
            </div>
          )}
          {interview.feedback && (
            <div>
              <p className="text-gray-400 text-sm">Feedback</p>
              <p className="text-sm text-gray-700 mt-1 bg-gray-50 p-3 rounded-lg">{interview.feedback}</p>
            </div>
          )}
          {interview.technicalNotes && user?.role !== 'candidate' && (
            <div>
              <p className="text-gray-400 text-sm">Technical Notes</p>
              <p className="text-sm text-gray-700 mt-1 bg-gray-50 p-3 rounded-lg">{interview.technicalNotes}</p>
            </div>
          )}
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-3">
        {user?.role === 'interviewer' && interview.status === 'SCHEDULED' && (
          <button onClick={handleStart} disabled={actionLoading} className="btn-primary">
            {actionLoading ? 'Starting...' : '▶ Start Session'}
          </button>
        )}

        {user?.role === 'interviewer' && interview.status === 'IN_PROGRESS' && (
          <Link to={`/room/${id}`} className="btn-primary">
            → Rejoin Room
          </Link>
        )}

        {user?.role === 'candidate' && interview.status === 'IN_PROGRESS' && (
          <Link to={`/lobby/${id}`} className="btn-primary">
            → Join Lobby
          </Link>
        )}

        {['hr', 'admin'].includes(user?.role) && !['COMPLETED', 'CANCELLED'].includes(interview.status) && (
          <button onClick={() => setCancelModal(true)} className="btn-danger">
            ✕ Cancel Interview
          </button>
        )}
      </div>

      {/* Cancel Modal */}
      <Modal isOpen={cancelModal} onClose={() => setCancelModal(false)} title="Cancel Interview">
        <div className="space-y-4">
          <p className="text-sm text-gray-600">
            This will cancel the interview and notify both the interviewer and candidate.
          </p>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Reason (optional)</label>
            <textarea
              value={cancelReason}
              onChange={e => setCancelReason(e.target.value)}
              className="input-field h-24 resize-none"
              placeholder="Provide a reason..."
            />
          </div>
          <div className="flex gap-3">
            <button onClick={handleCancel} disabled={actionLoading} className="btn-danger flex-1 justify-center">
              {actionLoading ? 'Cancelling...' : 'Yes, Cancel Interview'}
            </button>
            <button onClick={() => setCancelModal(false)} className="btn-secondary flex-1 justify-center">
              Keep Interview
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

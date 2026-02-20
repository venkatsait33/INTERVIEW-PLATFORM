/**
 * Interviewer Dashboard
 */

import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { interviewService } from "../../services/interviews";
import {
  InterviewCard,
  LoadingPage,
  StatCard,
  EmptyState,
} from "../../components/common";
import toast from "react-hot-toast";
import { Group, Panel, Separator } from "react-resizable-panels";

export default function InterviewerDashboard() {
  const navigate = useNavigate();
  const [interviews, setInterviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [starting, setStarting] = useState(null);

  useEffect(() => {
    interviewService
      .getAll()
      .then((res) => setInterviews(res.data.data.interviews))
      .catch(() => toast.error("Failed to load interviews"))
      .finally(() => setLoading(false));
  }, []);

  const handleStart = async (id) => {
    setStarting(id);
    try {
      const res = await interviewService.start(id);
      toast.success("Session started! Candidate notified via email.");
      navigate(`/room/${id}?token=${res.data.data.roomToken}`);
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to start");
    } finally {
      setStarting(null);
    }
  };

  if (loading) return <LoadingPage />;

  const upcoming = interviews.filter((i) => i.status === "SCHEDULED");
  const active = interviews.filter((i) => i.status === "IN_PROGRESS");
  const past = interviews.filter((i) =>
    ["COMPLETED", "CANCELLED"].includes(i.status),
  );

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold">Interviewer Dashboard</h1>
        <p className="mt-1 text-sm text-gray-500">
          Manage your interview sessions
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard
          title="Total"
          value={interviews.length}
          icon="🎯"
          color="indigo"
        />
        <StatCard
          title="Upcoming"
          value={upcoming.length}
          icon="📅"
          color="blue"
        />
        <StatCard
          title="Active Now"
          value={active.length}
          icon="🔴"
          color="green"
        />
        <StatCard
          title="Completed"
          value={past.length}
          icon="✅"
          color="teal"
        />
      </div>

      {/* Active Sessions */}
      {active.length > 0 && (
        <div>
          <h2 className="flex items-center gap-2 mb-4 text-base font-semibold text-red-600">
            <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
            Active Sessions
          </h2>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {active.map((i) => (
              <InterviewCard
                key={i._id}
                interview={i}
                actions={
                  <Link
                    to={`/room/${i._id}`}
                    className="btn-primary text-xs py-1.5"
                  >
                    Rejoin Room →
                  </Link>
                }
              />
            ))}
          </div>
        </div>
      )}

      {/* <div>
        <Group>
          <Panel>
            <div className="p-2 bg-gray-200 rounded shadow ">
              {" "}
              <p>hello world</p>
            </div>
          </Panel>
         
          <Panel>
            <p>hello world</p>
          </Panel>
        </Group>
      </div> */}

      {/* Upcoming */}
      <div>
        <h2 className="mb-4 text-base font-semibold">Upcoming Interviews</h2>
        {upcoming.length === 0 ? (
          <EmptyState
            icon="📅"
            title="No upcoming interviews"
            description="You're all caught up!"
          />
        ) : (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
            {upcoming.map((i) => (
              <InterviewCard
                key={i._id}
                interview={i}
                actions={
                  <>
                    <button
                      onClick={() => handleStart(i._id)}
                      disabled={starting === i._id}
                      className="btn-primary text-xs py-1.5 flex-1"
                    >
                      {starting === i._id ? "Starting..." : "▶ Start Session"}
                    </button>
                    <Link
                      to={`/interviews/${i._id}`}
                      className="btn-secondary text-xs py-1.5"
                    >
                      Details
                    </Link>
                  </>
                }
              />
            ))}
          </div>
        )}
      </div>

      {/* Past Interviews */}
      {past.length > 0 && (
        <div>
          <h2 className="mb-4 text-base font-semibold">Past Interviews</h2>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
            {past.slice(0, 6).map((i) => (
              <InterviewCard
                key={i._id}
                interview={i}
                actions={
                  <Link
                    to={`/interviews/${i._id}`}
                    className="btn-secondary text-xs py-1.5"
                  >
                    View Report →
                  </Link>
                }
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

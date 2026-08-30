import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAppData } from "../context/AppDataContext";
import { useAuth } from "../context/AuthContext";
import { apiRequest, ApiError } from "../lib/apiClient";
import RevenueChart from "../components/RevenueChart";

const statCards = [
  { label: "Today", key: "today" as const },
  { label: "This Week", key: "week" as const },
  { label: "This Month", key: "month" as const },
  { label: "Lifetime", key: "lifetime" as const },
];

interface SessionHistoryEntry {
  id: string;
  speakerLabel: string;
  status: "COMPLETED" | "REJECTED" | "EXPIRED";
  endedAt: string | null;
  listenerAmount: number | null;
}

export default function Earnings() {
  const { listenerEarnings, refreshEarnings } = useAppData();
  const { token } = useAuth();
  const [completedSessions, setCompletedSessions] = useState<SessionHistoryEntry[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    apiRequest<{ data: SessionHistoryEntry[] }>("/listener/sessions", { token })
      .then((response) => setCompletedSessions(response.data.filter((session) => session.status === "COMPLETED")))
      .catch((err) => setError(err instanceof ApiError ? err.message : "Could not load your earnings history."));
  }, [token]);

  // Same gap as ListenerDashboard: listenerEarnings only otherwise updates
  // via a live WALLET_UPDATED push, never on a plain route navigation.
  useEffect(() => {
    refreshEarnings();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="mx-auto max-w-5xl space-y-6 p-8">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-ink-900">Earnings</h1>
        <Link
          to="/listener/withdrawals"
          className="rounded-lg bg-brand-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-brand-700"
        >
          Withdraw
        </Link>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {statCards.map((card) => (
          <div
            key={card.key}
            className="rounded-2xl border border-gray-100 bg-white p-5"
          >
            <p className="text-xs text-gray-500">{card.label}</p>
            <p className="mt-1 text-lg font-bold text-ink-900">
              ₹{listenerEarnings[card.key].toLocaleString("en-IN")}
            </p>
          </div>
        ))}
      </div>

      <div className="rounded-2xl border border-gray-100 bg-white p-5">
        <p className="font-semibold text-ink-900">Earnings this week</p>
        <div className="mt-4">
          {listenerEarnings.chart.length > 0 && <RevenueChart data={listenerEarnings.chart} />}
        </div>
        <div className="mt-2 flex justify-between text-xs text-gray-400">
          {listenerEarnings.chart.map((point) => (
            <span key={point.day}>{point.day}</span>
          ))}
        </div>
      </div>

      <div className="rounded-2xl border border-gray-100 bg-white p-5">
        <p className="font-semibold text-ink-900">Recent earning entries</p>
        {error && <p className="mt-3 text-sm text-red-500">{error}</p>}
        <div className="mt-4 divide-y divide-gray-100">
          {completedSessions.map((session) => (
            <div
              key={session.id}
              className="flex items-center justify-between py-3"
            >
              <div>
                <p className="text-sm font-medium text-ink-900">
                  {session.speakerLabel}
                </p>
                <p className="text-xs text-gray-400">
                  {session.endedAt
                    ? new Date(session.endedAt).toLocaleDateString("en-IN", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })
                    : "—"}
                </p>
              </div>
              <p className="text-sm font-semibold text-green-600">
                +₹{(session.listenerAmount ?? 0).toFixed(2)}
              </p>
            </div>
          ))}

          {completedSessions.length === 0 && !error && (
            <p className="py-6 text-center text-sm text-gray-400">
              No earnings recorded yet.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

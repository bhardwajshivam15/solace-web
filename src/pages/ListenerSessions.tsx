import { useEffect, useState } from "react";
import { AlertCircle } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { apiRequest, ApiError } from "../lib/apiClient";

const tabs = ["All", "Completed", "Cancelled"] as const;
type Tab = (typeof tabs)[number];

interface SessionHistoryEntry {
  id: string;
  speakerId: string;
  speakerLabel: string;
  status: "COMPLETED" | "REJECTED" | "EXPIRED";
  requestedAt: string;
  startedAt: string | null;
  endedAt: string | null;
  durationSeconds: number | null;
  listenerAmount: number | null;
}

const statusStyles: Record<string, string> = {
  completed: "bg-green-50 text-green-600",
  cancelled: "bg-red-50 text-red-500",
};

function formatDuration(seconds: number | null): string {
  if (!seconds) return "—";
  const minutes = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${minutes}m ${secs}s`;
}

export default function ListenerSessions() {
  const { token } = useAuth();
  const [sessions, setSessions] = useState<SessionHistoryEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tab, setTab] = useState<Tab>("All");

  useEffect(() => {
    apiRequest<{ data: SessionHistoryEntry[] }>("/listener/sessions", { token })
      .then((response) => setSessions(response.data))
      .catch((err) => setError(err instanceof ApiError ? err.message : "Could not load your sessions."))
      .finally(() => setLoading(false));
  }, [token]);

  const filtered = sessions.filter((session) => {
    if (tab === "All") return true;
    if (tab === "Completed") return session.status === "COMPLETED";
    return session.status === "REJECTED" || session.status === "EXPIRED";
  });

  return (
    <div className="mx-auto max-w-3xl p-8">
      <h1 className="text-xl font-bold text-ink-900">Sessions</h1>

      {error && (
        <div className="mt-4 flex items-start gap-2 rounded-xl bg-red-50 px-3 py-2.5 text-sm text-red-600">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          {error}
        </div>
      )}

      <div className="mt-5 inline-flex rounded-xl bg-gray-100 p-1">
        {tabs.map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`rounded-lg px-5 py-2 text-sm font-medium transition-colors ${
              tab === t
                ? "bg-brand-600 text-white shadow-sm"
                : "text-gray-500 hover:text-ink-900"
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      <div className="mt-5 space-y-3">
        {loading && <p className="py-10 text-center text-sm text-gray-400">Loading…</p>}

        {!loading &&
          filtered.map((session) => (
            <div
              key={session.id}
              className="flex items-center gap-4 rounded-2xl border border-gray-100 p-4"
            >
              <div className="flex-1">
                <p className="font-semibold text-ink-900">
                  {session.speakerLabel}
                </p>
                <p className="text-xs text-gray-400">
                  {new Date(session.requestedAt).toLocaleDateString("en-IN", {
                    day: "numeric",
                    month: "short",
                  })}{" "}
                  ·{" "}
                  {new Date(session.requestedAt).toLocaleTimeString("en-IN", {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </p>
              </div>

              <div className="text-center">
                <p className="text-sm font-semibold text-ink-900">
                  {session.status === "COMPLETED" ? formatDuration(session.durationSeconds) : "—"}
                </p>
                <span
                  className={`mt-1 inline-block rounded-full px-3 py-1 text-xs font-medium capitalize ${
                    statusStyles[session.status === "COMPLETED" ? "completed" : "cancelled"]
                  }`}
                >
                  {session.status === "COMPLETED" ? "completed" : "cancelled"}
                </span>
              </div>

              <div className="w-24 text-right">
                <p className="font-semibold text-ink-900">
                  {session.listenerAmount != null ? `₹${session.listenerAmount.toFixed(2)}` : "—"}
                </p>
              </div>
            </div>
          ))}

        {!loading && filtered.length === 0 && (
          <p className="py-10 text-center text-sm text-gray-400">
            No sessions here yet.
          </p>
        )}
      </div>
    </div>
  );
}

import { useEffect, useState } from "react";
import { Star, AlertCircle } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { apiRequest, resolveAssetUrl, ApiError } from "../lib/apiClient";

const tabs = ["All", "Completed", "Cancelled"] as const;
type Tab = (typeof tabs)[number];

interface SessionHistoryEntry {
  id: string;
  listenerId: string;
  listenerName: string;
  listenerAvatar: string | null;
  status: "COMPLETED" | "REJECTED" | "EXPIRED";
  requestedAt: string;
  startedAt: string | null;
  endedAt: string | null;
  durationSeconds: number | null;
  speakerAmount: number | null;
}

function formatDuration(seconds: number | null): string {
  if (!seconds) return "—";
  const minutes = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${minutes}m ${secs}s`;
}

function initialsAvatar(name: string): string {
  const initial = name.trim().charAt(0).toUpperCase() || "?";
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="150" height="150"><rect width="150" height="150" fill="#ede9fe"/><text x="50%" y="50%" dy=".35em" text-anchor="middle" font-family="sans-serif" font-size="60" fill="#6d28d9">${initial}</text></svg>`;
  return `data:image/svg+xml,${encodeURIComponent(svg)}`;
}

function RatingCell({
  listenerId,
  token,
}: {
  listenerId: string;
  token: string | null;
}) {
  const [editing, setEditing] = useState(false);
  const [rating, setRating] = useState(0);
  const [submitted, setSubmitted] = useState(false);

  const handleRate = (value: number) => {
    setRating(value);
    setEditing(false);
    apiRequest(`/speaker/listeners/${listenerId}/rating`, {
      method: "POST",
      token,
      body: { rating: value },
    })
      .then(() => setSubmitted(true))
      .catch(() => {});
  };

  if (editing) {
    return (
      <div className="flex items-center gap-0.5">
        {[1, 2, 3, 4, 5].map((value) => (
          <button key={value} onClick={() => handleRate(value)}>
            <Star
              className={`h-4 w-4 ${
                value <= rating ? "fill-amber-400 text-amber-400" : "text-gray-300"
              }`}
            />
          </button>
        ))}
      </div>
    );
  }

  return (
    <button
      onClick={() => setEditing(true)}
      className="text-xs font-medium text-brand-600 hover:text-brand-700"
    >
      {submitted ? (
        <span className="flex items-center gap-1 text-gray-500">
          <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
          {rating.toFixed(1)}
        </span>
      ) : (
        "Rate"
      )}
    </button>
  );
}

export default function MySessions() {
  const { token } = useAuth();
  const [sessions, setSessions] = useState<SessionHistoryEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tab, setTab] = useState<Tab>("All");

  useEffect(() => {
    apiRequest<{ data: SessionHistoryEntry[] }>("/speaker/sessions", { token })
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
      <h1 className="text-xl font-bold text-ink-900">My Sessions</h1>

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
              <img
                src={resolveAssetUrl(session.listenerAvatar) ?? initialsAvatar(session.listenerName)}
                alt={session.listenerName}
                className="h-12 w-12 rounded-full object-cover"
              />

              <div className="flex-1">
                <p className="font-semibold text-ink-900">
                  {session.listenerName}
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
                <p className="text-xs capitalize text-gray-400">
                  {session.status === "COMPLETED" ? "completed" : "cancelled"}
                </p>
              </div>

              <div className="w-20 text-right">
                <p className="font-semibold text-ink-900">
                  {session.speakerAmount != null ? `₹${session.speakerAmount.toFixed(2)}` : "—"}
                </p>
                {session.status === "COMPLETED" && (
                  <RatingCell listenerId={session.listenerId} token={token} />
                )}
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

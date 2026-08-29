import { useEffect, useState } from "react";
import { AlertCircle } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { apiRequest, ApiError, resolveAssetUrl } from "../lib/apiClient";

const medals = ["🥇", "🥈", "🥉"];

interface LeaderboardEntry {
  listenerId: string;
  name: string;
  avatarUrl: string | null;
  rating: number;
  reviewCount: number;
  revenue: number;
  sessionCount: number;
}

function initialsAvatar(name: string): string {
  const initial = name.trim().charAt(0).toUpperCase() || "?";
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="150" height="150"><rect width="150" height="150" fill="#ede9fe"/><text x="50%" y="50%" dy=".35em" text-anchor="middle" font-family="sans-serif" font-size="60" fill="#6d28d9">${initial}</text></svg>`;
  return `data:image/svg+xml,${encodeURIComponent(svg)}`;
}

export default function AdminLeaderboard() {
  const { token } = useAuth();
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    apiRequest<{ data: LeaderboardEntry[] }>("/admin/leaderboard", { token })
      .then((response) => setEntries(response.data))
      .catch((err) => setError(err instanceof ApiError ? err.message : "Could not load leaderboard."))
      .finally(() => setLoading(false));
  }, [token]);

  return (
    <div className="p-8">
      <h1 className="text-xl font-bold text-ink-900">Leaderboard</h1>

      {error && (
        <div className="mt-4 flex items-start gap-2 rounded-xl bg-red-50 px-3 py-2.5 text-sm text-red-600">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          {error}
        </div>
      )}

      <div className="mt-6 divide-y divide-gray-100 rounded-2xl border border-gray-100 bg-white">
        {loading && <p className="px-5 py-6 text-center text-sm text-gray-400">Loading...</p>}

        {!loading &&
          entries.map((entry, index) => (
            <div key={entry.listenerId} className="flex items-center gap-4 px-5 py-4">
              <span className="flex w-8 items-center justify-center text-lg font-semibold text-gray-400">
                {medals[index] ?? index + 1}
              </span>
              <img
                src={resolveAssetUrl(entry.avatarUrl) ?? initialsAvatar(entry.name)}
                alt={entry.name}
                className="h-10 w-10 rounded-full object-cover"
              />
              <div className="flex-1">
                <p className="text-sm font-medium text-ink-900">{entry.name}</p>
                <p className="text-xs text-gray-400">
                  {entry.sessionCount} sessions · ★ {entry.rating.toFixed(1)}
                </p>
              </div>
              <p className="text-sm font-semibold text-ink-900">
                ₹{entry.revenue.toLocaleString("en-IN")}
              </p>
            </div>
          ))}

        {!loading && entries.length === 0 && (
          <p className="px-5 py-6 text-center text-sm text-gray-400">No listener activity yet.</p>
        )}
      </div>
    </div>
  );
}

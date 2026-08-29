import { useEffect, useState } from "react";
import { AlertCircle, BadgeCheck } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { apiRequest, resolveAssetUrl, ApiError } from "../lib/apiClient";

interface AdminListener {
  id: string;
  name: string;
  email: string;
  avatar: string | null;
  verified: boolean;
  online: boolean;
  active: boolean;
  joinedDate: string;
}

function initialsAvatar(name: string): string {
  const initial = name.trim().charAt(0).toUpperCase() || "?";
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="150" height="150"><rect width="150" height="150" fill="#ede9fe"/><text x="50%" y="50%" dy=".35em" text-anchor="middle" font-family="sans-serif" font-size="60" fill="#6d28d9">${initial}</text></svg>`;
  return `data:image/svg+xml,${encodeURIComponent(svg)}`;
}

type PresenceFilter = "all" | "online" | "offline";
type StatusFilter = "all" | "active" | "suspended";
type VerifiedFilter = "all" | "verified" | "unverified";

const presenceFilterOptions: { value: PresenceFilter; label: string }[] = [
  { value: "all", label: "All" },
  { value: "online", label: "Online" },
  { value: "offline", label: "Offline" },
];

const statusFilterOptions: { value: StatusFilter; label: string }[] = [
  { value: "all", label: "All" },
  { value: "active", label: "Active" },
  { value: "suspended", label: "Suspended" },
];

const verifiedFilterOptions: { value: VerifiedFilter; label: string }[] = [
  { value: "all", label: "All" },
  { value: "verified", label: "Verified" },
  { value: "unverified", label: "Unverified" },
];

export default function AdminListeners() {
  const { token } = useAuth();
  const [listeners, setListeners] = useState<AdminListener[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [presenceFilter, setPresenceFilter] = useState<PresenceFilter>("all");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [verifiedFilter, setVerifiedFilter] = useState<VerifiedFilter>("all");

  useEffect(() => {
    setLoading(true);
    apiRequest<{ data: AdminListener[] }>("/admin/listeners", { token })
      .then((response) => setListeners(response.data))
      .catch((err) => setError(err instanceof ApiError ? err.message : "Could not load listeners."))
      .finally(() => setLoading(false));
  }, [token]);

  // Stat cards above stay unfiltered (whole platform) — only the list below
  // reacts to filters, same convention as AdminUsers.tsx.
  const visibleListeners = listeners
    .filter((l) => presenceFilter === "all" || (presenceFilter === "online" ? l.online : !l.online))
    .filter((l) => statusFilter === "all" || (statusFilter === "active" ? l.active : !l.active))
    .filter((l) => verifiedFilter === "all" || (verifiedFilter === "verified" ? l.verified : !l.verified));

  const toggleStatus = async (listener: AdminListener) => {
    setError(null);
    setUpdatingId(listener.id);
    try {
      const { listener: updated } = await apiRequest<{ listener: AdminListener }>(
        `/admin/listeners/${listener.id}/status`,
        { method: "PATCH", token, body: { active: !listener.active } },
      );
      setListeners((prev) => prev.map((l) => (l.id === listener.id ? updated : l)));
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not update this listener.");
    } finally {
      setUpdatingId(null);
    }
  };

  return (
    <div className="p-8">
      <h1 className="text-xl font-bold text-ink-900">Listeners</h1>

      {error && (
        <div className="mt-4 flex items-start gap-2 rounded-xl bg-red-50 px-3 py-2.5 text-sm text-red-600">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          {error}
        </div>
      )}

      <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-gray-100 bg-white p-5">
          <p className="text-sm text-gray-500">Total Listeners</p>
          <p className="mt-2 text-2xl font-bold text-ink-900">{listeners.length}</p>
        </div>
        <div className="rounded-2xl border border-gray-100 bg-white p-5">
          <p className="text-sm text-gray-500">Online</p>
          <p className="mt-2 text-2xl font-bold text-ink-900">
            {listeners.filter((l) => l.online).length}
          </p>
        </div>
        <div className="rounded-2xl border border-gray-100 bg-white p-5">
          <p className="text-sm text-gray-500">Verified</p>
          <p className="mt-2 text-2xl font-bold text-ink-900">
            {listeners.filter((l) => l.verified).length}
          </p>
        </div>
      </div>

      <div className="mt-6 flex flex-wrap items-center gap-4">
        <div className="flex items-center gap-1 rounded-lg border border-gray-200 bg-white p-1">
          {presenceFilterOptions.map((option) => (
            <button
              key={option.value}
              onClick={() => setPresenceFilter(option.value)}
              className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
                presenceFilter === option.value
                  ? "bg-brand-600 text-white"
                  : "text-gray-500 hover:bg-gray-50"
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-1 rounded-lg border border-gray-200 bg-white p-1">
          {statusFilterOptions.map((option) => (
            <button
              key={option.value}
              onClick={() => setStatusFilter(option.value)}
              className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
                statusFilter === option.value
                  ? "bg-brand-600 text-white"
                  : "text-gray-500 hover:bg-gray-50"
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-1 rounded-lg border border-gray-200 bg-white p-1">
          {verifiedFilterOptions.map((option) => (
            <button
              key={option.value}
              onClick={() => setVerifiedFilter(option.value)}
              className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
                verifiedFilter === option.value
                  ? "bg-brand-600 text-white"
                  : "text-gray-500 hover:bg-gray-50"
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-4 divide-y divide-gray-100 rounded-2xl border border-gray-100 bg-white">
        {loading && <p className="py-10 text-center text-sm text-gray-400">Loading…</p>}

        {!loading && visibleListeners.length === 0 && (
          <p className="py-10 text-center text-sm text-gray-400">
            {listeners.length === 0 ? "No listeners yet." : "No listeners match these filters."}
          </p>
        )}

        {visibleListeners.map((listener) => (
          <div key={listener.id} className="flex items-center gap-3 px-5 py-4">
            <img
              src={resolveAssetUrl(listener.avatar) ?? initialsAvatar(listener.name)}
              alt={listener.name}
              className="h-9 w-9 shrink-0 rounded-full object-cover"
            />
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5">
                <p className="truncate text-sm font-medium text-ink-900">{listener.name}</p>
                {listener.verified && <BadgeCheck className="h-4 w-4 shrink-0 text-brand-600" />}
              </div>
              <p className="truncate text-xs text-gray-400">
                Joined{" "}
                {new Date(listener.joinedDate).toLocaleDateString("en-IN", {
                  day: "numeric",
                  month: "short",
                  year: "numeric",
                })}
              </p>
            </div>
            <span
              className={`shrink-0 rounded-full px-3 py-1 text-xs font-medium ${
                listener.online ? "bg-green-50 text-green-600" : "bg-gray-100 text-gray-500"
              }`}
            >
              {listener.online ? "Online" : "Offline"}
            </span>
            <span
              className={`shrink-0 rounded-full px-3 py-1 text-xs font-medium ${
                listener.active ? "bg-green-50 text-green-600" : "bg-red-50 text-red-500"
              }`}
            >
              {listener.active ? "Active" : "Suspended"}
            </span>
            <button
              onClick={() => toggleStatus(listener)}
              disabled={updatingId === listener.id}
              className={`shrink-0 rounded-lg border px-3 py-1.5 text-xs font-semibold disabled:cursor-not-allowed disabled:opacity-50 ${
                listener.active
                  ? "border-red-200 text-red-500 hover:bg-red-50"
                  : "border-green-200 text-green-600 hover:bg-green-50"
              }`}
            >
              {updatingId === listener.id ? "…" : listener.active ? "Suspend" : "Reinstate"}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

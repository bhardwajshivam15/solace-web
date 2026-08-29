import { useEffect, useState } from "react";
import { AlertCircle, ChevronLeft, ChevronRight } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { apiRequest, ApiError } from "../lib/apiClient";

const PAGE_SIZE = 10;

type UiStatus = "completed" | "cancelled" | "ongoing";

interface PlatformSession {
  id: string;
  speakerName: string;
  listenerName: string;
  status: string;
  requestedAt: string;
  startedAt: string | null;
  endedAt: string | null;
  durationSeconds: number | null;
  amount: number | null;
}

const statusStyles: Record<UiStatus, string> = {
  completed: "bg-green-50 text-green-600",
  cancelled: "bg-gray-100 text-gray-500",
  ongoing: "bg-amber-50 text-amber-600",
};

const statusLabels: Record<UiStatus, string> = {
  completed: "Completed",
  cancelled: "Cancelled",
  ongoing: "Ongoing",
};

type StatusFilter = "all" | UiStatus;

const statusFilterOptions: { value: StatusFilter; label: string }[] = [
  { value: "all", label: "All" },
  { value: "completed", label: "Completed" },
  { value: "ongoing", label: "Ongoing" },
  { value: "cancelled", label: "Cancelled" },
];

// Collapses the real 8-state session lifecycle (REQUESTED/ACCEPTED/
// CONNECTING/ACTIVE/DISCONNECTED/COMPLETED/REJECTED/EXPIRED) into the same
// 3-bucket view this page already showed — preserves the existing UI/summary
// cards rather than redesigning around every granular backend status.
function toUiStatus(status: string): UiStatus {
  if (status === "COMPLETED") return "completed";
  if (status === "REJECTED" || status === "EXPIRED") return "cancelled";
  return "ongoing";
}

function formatDuration(seconds: number | null): string {
  if (!seconds) return "—";
  const minutes = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${minutes}m ${secs}s`;
}

export default function AdminSessions() {
  const { token } = useAuth();
  const [sessions, setSessions] = useState<PlatformSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");

  useEffect(() => {
    apiRequest<{ data: PlatformSession[] }>("/admin/sessions", { token })
      .then((response) => setSessions(response.data))
      .catch((err) => setError(err instanceof ApiError ? err.message : "Could not load sessions."))
      .finally(() => setLoading(false));
  }, [token]);

  // Stat cards stay unfiltered (whole platform) — only the paginated list
  // below reacts to the filter, same convention as AdminUsers/AdminListeners.
  const counts = {
    completed: sessions.filter((s) => toUiStatus(s.status) === "completed").length,
    ongoing: sessions.filter((s) => toUiStatus(s.status) === "ongoing").length,
    cancelled: sessions.filter((s) => toUiStatus(s.status) === "cancelled").length,
  };

  const visibleSessions = sessions.filter((s) => statusFilter === "all" || toUiStatus(s.status) === statusFilter);

  const totalPages = Math.max(1, Math.ceil(visibleSessions.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const pagedSessions = visibleSessions.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  const setStatusFilterAndResetPage = (value: StatusFilter) => {
    setStatusFilter(value);
    setPage(1);
  };

  return (
    <div className="p-8">
      <h1 className="text-xl font-bold text-ink-900">Sessions</h1>

      {error && (
        <div className="mt-4 flex items-start gap-2 rounded-xl bg-red-50 px-3 py-2.5 text-sm text-red-600">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          {error}
        </div>
      )}

      <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
        <div className="rounded-2xl border border-gray-100 bg-white p-5">
          <p className="text-sm text-gray-500">Total Sessions</p>
          <p className="mt-2 text-2xl font-bold text-ink-900">{sessions.length}</p>
        </div>
        <div className="rounded-2xl border border-gray-100 bg-white p-5">
          <p className="text-sm text-gray-500">Completed</p>
          <p className="mt-2 text-2xl font-bold text-ink-900">{counts.completed}</p>
        </div>
        <div className="rounded-2xl border border-gray-100 bg-white p-5">
          <p className="text-sm text-gray-500">Ongoing</p>
          <p className="mt-2 text-2xl font-bold text-ink-900">{counts.ongoing}</p>
        </div>
        <div className="rounded-2xl border border-gray-100 bg-white p-5">
          <p className="text-sm text-gray-500">Cancelled</p>
          <p className="mt-2 text-2xl font-bold text-ink-900">{counts.cancelled}</p>
        </div>
      </div>

      <div className="mt-6 flex items-center gap-1 rounded-lg border border-gray-200 bg-white p-1 w-fit">
        {statusFilterOptions.map((option) => (
          <button
            key={option.value}
            onClick={() => setStatusFilterAndResetPage(option.value)}
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

      <div className="mt-4 divide-y divide-gray-100 rounded-2xl border border-gray-100 bg-white">
        {loading && <p className="px-5 py-6 text-center text-sm text-gray-400">Loading...</p>}

        {!loading &&
          pagedSessions.map((session) => {
            const uiStatus = toUiStatus(session.status);
            return (
              <div key={session.id} className="flex items-center gap-3 px-5 py-4">
                <div className="flex-1">
                  <p className="text-sm font-medium text-ink-900">
                    {session.speakerName} <span className="text-gray-400">→</span> {session.listenerName}
                  </p>
                  <p className="text-xs text-gray-400">
                    {new Date(session.requestedAt).toLocaleDateString("en-IN", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })}
                  </p>
                </div>
                <div className="hidden w-24 sm:block">
                  <p className="text-xs text-gray-400">Duration</p>
                  <p className="text-sm text-ink-900">{formatDuration(session.durationSeconds)}</p>
                </div>
                <div className="hidden w-24 sm:block">
                  <p className="text-xs text-gray-400">Amount</p>
                  <p className="text-sm font-semibold text-ink-900">
                    {session.amount != null ? `₹${session.amount.toFixed(2)}` : "—"}
                  </p>
                </div>
                <span className={`rounded-full px-3 py-1 text-xs font-medium ${statusStyles[uiStatus]}`}>
                  {statusLabels[uiStatus]}
                </span>
              </div>
            );
          })}

        {!loading && visibleSessions.length === 0 && (
          <p className="px-5 py-6 text-center text-sm text-gray-400">
            {sessions.length === 0 ? "No sessions yet." : "No sessions match this filter."}
          </p>
        )}
      </div>

      {!loading && visibleSessions.length > 0 && (
        <div className="mt-4 flex items-center justify-between">
          <p className="text-sm text-gray-500">
            Showing {(currentPage - 1) * PAGE_SIZE + 1}–{Math.min(currentPage * PAGE_SIZE, visibleSessions.length)} of{" "}
            {visibleSessions.length}
          </p>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="flex items-center gap-1 rounded-lg border border-gray-200 px-3 py-1.5 text-sm font-medium text-gray-600 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <ChevronLeft className="h-4 w-4" />
              Previous
            </button>
            <span className="text-sm text-gray-500">
              Page {currentPage} of {totalPages}
            </span>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="flex items-center gap-1 rounded-lg border border-gray-200 px-3 py-1.5 text-sm font-medium text-gray-600 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Next
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

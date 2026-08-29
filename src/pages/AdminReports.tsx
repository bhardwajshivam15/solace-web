import { useEffect, useState } from "react";
import { AlertCircle } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { apiRequest, ApiError } from "../lib/apiClient";

type Priority = "High" | "Medium" | "Low";
type Status = "Open" | "Reviewing" | "Resolved";

interface ConversationReport {
  id: string;
  reportedByName: string;
  reportedUserName: string;
  reason: string;
  status: Status;
  priority: Priority;
  createdAt: string;
}

const priorityStyles: Record<Priority, string> = {
  High: "bg-red-50 text-red-500",
  Medium: "bg-amber-50 text-amber-600",
  Low: "bg-gray-100 text-gray-500",
};

const statusStyles: Record<Status, string> = {
  Open: "bg-red-50 text-red-500",
  Reviewing: "bg-amber-50 text-amber-600",
  Resolved: "bg-green-50 text-green-600",
};

type StatusFilter = "all" | Status;
type PriorityFilter = "all" | Priority;

const statusFilterOptions: { value: StatusFilter; label: string }[] = [
  { value: "all", label: "All" },
  { value: "Open", label: "Open" },
  { value: "Reviewing", label: "Reviewing" },
  { value: "Resolved", label: "Resolved" },
];

const priorityFilterOptions: { value: PriorityFilter; label: string }[] = [
  { value: "all", label: "All" },
  { value: "High", label: "High" },
  { value: "Medium", label: "Medium" },
  { value: "Low", label: "Low" },
];

export default function AdminReports() {
  const { token } = useAuth();
  const [reports, setReports] = useState<ConversationReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [priorityFilter, setPriorityFilter] = useState<PriorityFilter>("all");

  useEffect(() => {
    apiRequest<{ data: ConversationReport[] }>("/admin/reports", { token })
      .then((response) => setReports(response.data))
      .catch((err) => setError(err instanceof ApiError ? err.message : "Could not load reports."))
      .finally(() => setLoading(false));
  }, [token]);

  const setReportStatus = async (id: string, status: "Reviewing" | "Resolved") => {
    setUpdatingId(id);
    setError(null);
    try {
      const { report } = await apiRequest<{ report: ConversationReport }>(`/admin/reports/${id}/status`, {
        method: "PATCH",
        token,
        body: { status: status.toUpperCase() },
      });
      setReports((prev) => prev.map((r) => (r.id === id ? report : r)));
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not update this report.");
    } finally {
      setUpdatingId(null);
    }
  };

  const counts = {
    open: reports.filter((r) => r.status === "Open").length,
    reviewing: reports.filter((r) => r.status === "Reviewing").length,
    resolved: reports.filter((r) => r.status === "Resolved").length,
  };

  // Stat cards stay unfiltered (whole platform) — only the list below reacts
  // to the filters, same convention as the other admin list pages.
  const visibleReports = reports
    .filter((r) => statusFilter === "all" || r.status === statusFilter)
    .filter((r) => priorityFilter === "all" || r.priority === priorityFilter);

  return (
    <div className="p-8">
      <h1 className="text-xl font-bold text-ink-900">Reports</h1>

      {error && (
        <div className="mt-4 flex items-start gap-2 rounded-xl bg-red-50 px-3 py-2.5 text-sm text-red-600">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          {error}
        </div>
      )}

      <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-gray-100 bg-white p-5">
          <p className="text-sm text-gray-500">Open</p>
          <p className="mt-2 text-2xl font-bold text-ink-900">{counts.open}</p>
        </div>
        <div className="rounded-2xl border border-gray-100 bg-white p-5">
          <p className="text-sm text-gray-500">Reviewing</p>
          <p className="mt-2 text-2xl font-bold text-ink-900">{counts.reviewing}</p>
        </div>
        <div className="rounded-2xl border border-gray-100 bg-white p-5">
          <p className="text-sm text-gray-500">Resolved</p>
          <p className="mt-2 text-2xl font-bold text-ink-900">{counts.resolved}</p>
        </div>
      </div>

      <div className="mt-6 flex flex-wrap items-center gap-4">
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
          {priorityFilterOptions.map((option) => (
            <button
              key={option.value}
              onClick={() => setPriorityFilter(option.value)}
              className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
                priorityFilter === option.value
                  ? "bg-brand-600 text-white"
                  : "text-gray-500 hover:bg-gray-50"
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-4 space-y-3">
        {loading && <p className="py-10 text-center text-sm text-gray-400">Loading...</p>}

        {!loading &&
          visibleReports.map((report) => (
            <div
              key={report.id}
              className="flex items-center gap-3 rounded-2xl border border-gray-100 bg-white px-5 py-4"
            >
              <div className="flex-1">
                <p className="text-sm font-medium text-ink-900">
                  {report.reportedUserName}
                  <span className="ml-2 font-normal text-gray-400">reported by {report.reportedByName}</span>
                </p>
                <p className="text-xs text-gray-400">{report.reason}</p>
              </div>
              <span className={`rounded-full px-3 py-1 text-xs font-medium ${priorityStyles[report.priority]}`}>
                {report.priority}
              </span>
              <span className={`rounded-full px-3 py-1 text-xs font-medium ${statusStyles[report.status]}`}>
                {report.status}
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setReportStatus(report.id, "Resolved")}
                  disabled={report.status === "Resolved" || updatingId === report.id}
                  className="rounded-lg border border-green-200 px-3 py-1.5 text-xs font-semibold text-green-600 hover:bg-green-50 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  Resolve
                </button>
                <button
                  onClick={() => setReportStatus(report.id, "Reviewing")}
                  disabled={report.status === "Reviewing" || updatingId === report.id}
                  className="rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-semibold text-ink-900 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  Dismiss
                </button>
              </div>
            </div>
          ))}

        {!loading && visibleReports.length === 0 && (
          <p className="py-10 text-center text-sm text-gray-400">
            {reports.length === 0 ? "No reports yet." : "No reports match these filters."}
          </p>
        )}
      </div>
    </div>
  );
}

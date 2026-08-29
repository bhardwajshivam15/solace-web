import { useEffect, useState } from "react";
import { AlertCircle, ChevronDown } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { apiRequest, ApiError } from "../lib/apiClient";

type TicketStatus = "Open" | "In Progress" | "Resolved";
type TicketPriority = "Low" | "Medium" | "High";

interface SupportTicket {
  id: string;
  user: string;
  subject: string;
  message: string;
  status: TicketStatus;
  priority: TicketPriority;
  createdAt: string;
}

const statusStyles: Record<TicketStatus, string> = {
  Open: "bg-red-50 text-red-500",
  "In Progress": "bg-amber-50 text-amber-600",
  Resolved: "bg-green-50 text-green-600",
};

const priorityStyles: Record<TicketPriority, string> = {
  High: "bg-red-50 text-red-500",
  Medium: "bg-amber-50 text-amber-600",
  Low: "bg-gray-100 text-gray-500",
};

type StatusFilter = "all" | TicketStatus;
type PriorityFilter = "all" | TicketPriority;

const statusFilterOptions: { value: StatusFilter; label: string }[] = [
  { value: "all", label: "All" },
  { value: "Open", label: "Open" },
  { value: "In Progress", label: "In Progress" },
  { value: "Resolved", label: "Resolved" },
];

const priorityFilterOptions: { value: PriorityFilter; label: string }[] = [
  { value: "all", label: "All" },
  { value: "High", label: "High" },
  { value: "Medium", label: "Medium" },
  { value: "Low", label: "Low" },
];

export default function AdminSupportTickets() {
  const { token } = useAuth();
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [priorityFilter, setPriorityFilter] = useState<PriorityFilter>("all");

  useEffect(() => {
    setLoading(true);
    apiRequest<{ data: SupportTicket[] }>("/admin/support-tickets", { token })
      .then((response) => setTickets(response.data))
      .catch((err) => setError(err instanceof ApiError ? err.message : "Could not load support tickets."))
      .finally(() => setLoading(false));
  }, [token]);

  // Stat cards stay unfiltered (whole platform) — only the list below reacts
  // to the filters, same convention as the other admin list pages.
  const visibleTickets = tickets
    .filter((t) => statusFilter === "all" || t.status === statusFilter)
    .filter((t) => priorityFilter === "all" || t.priority === priorityFilter);

  const updateStatus = async (ticket: SupportTicket, status: TicketStatus) => {
    setError(null);
    setUpdatingId(ticket.id);
    try {
      const { ticket: updated } = await apiRequest<{ ticket: SupportTicket }>(
        `/admin/support-tickets/${ticket.id}/status`,
        { method: "PATCH", token, body: { status } },
      );
      setTickets((prev) => prev.map((t) => (t.id === ticket.id ? updated : t)));
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not update this ticket.");
    } finally {
      setUpdatingId(null);
    }
  };

  return (
    <div className="p-8">
      <h1 className="text-xl font-bold text-ink-900">Support Tickets</h1>

      {error && (
        <div className="mt-4 flex items-start gap-2 rounded-xl bg-red-50 px-3 py-2.5 text-sm text-red-600">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          {error}
        </div>
      )}

      <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-gray-100 bg-white p-5">
          <p className="text-sm text-gray-500">Open</p>
          <p className="mt-2 text-2xl font-bold text-ink-900">
            {tickets.filter((t) => t.status === "Open").length}
          </p>
        </div>
        <div className="rounded-2xl border border-gray-100 bg-white p-5">
          <p className="text-sm text-gray-500">In Progress</p>
          <p className="mt-2 text-2xl font-bold text-ink-900">
            {tickets.filter((t) => t.status === "In Progress").length}
          </p>
        </div>
        <div className="rounded-2xl border border-gray-100 bg-white p-5">
          <p className="text-sm text-gray-500">Resolved</p>
          <p className="mt-2 text-2xl font-bold text-ink-900">
            {tickets.filter((t) => t.status === "Resolved").length}
          </p>
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
        {loading && <p className="text-sm text-gray-400">Loading tickets…</p>}

        {!loading && visibleTickets.length === 0 && (
          <p className="rounded-2xl border border-gray-100 bg-white p-5 text-center text-sm text-gray-400">
            {tickets.length === 0 ? "No support tickets yet." : "No tickets match these filters."}
          </p>
        )}

        {visibleTickets.map((ticket) => {
          const expanded = expandedId === ticket.id;
          return (
            <div
              key={ticket.id}
              className="rounded-2xl border border-gray-100 bg-white px-5 py-4"
            >
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setExpandedId(expanded ? null : ticket.id)}
                  className="flex min-w-0 flex-1 items-start gap-2 text-left"
                >
                  <ChevronDown
                    className={`mt-0.5 h-4 w-4 shrink-0 text-gray-400 transition-transform ${expanded ? "rotate-180" : ""}`}
                  />
                  <div className="min-w-0 flex-1">
                    <p className={`text-sm font-medium text-ink-900 ${expanded ? "" : "truncate"}`}>
                      {ticket.subject} <span className="text-gray-400">·</span> {ticket.user}
                    </p>
                    {!expanded && (
                      <p className="mt-0.5 truncate text-xs text-gray-400">{ticket.message}</p>
                    )}
                  </div>
                </button>
                <span
                  className={`shrink-0 rounded-full px-3 py-1 text-xs font-medium ${priorityStyles[ticket.priority]}`}
                >
                  {ticket.priority}
                </span>
                <span
                  className={`shrink-0 rounded-full px-3 py-1 text-xs font-medium ${statusStyles[ticket.status]}`}
                >
                  {ticket.status}
                </span>
                <div className="flex shrink-0 items-center gap-2">
                  {ticket.status === "Open" && (
                    <button
                      onClick={() => updateStatus(ticket, "In Progress")}
                      disabled={updatingId === ticket.id}
                      className="rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-semibold text-ink-900 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      {updatingId === ticket.id ? "Updating…" : "Start Progress"}
                    </button>
                  )}
                  {ticket.status !== "Resolved" && (
                    <button
                      onClick={() => updateStatus(ticket, "Resolved")}
                      disabled={updatingId === ticket.id}
                      className="rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-semibold text-ink-900 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      {updatingId === ticket.id ? "Updating…" : "Mark Resolved"}
                    </button>
                  )}
                </div>
              </div>

              {expanded && (
                <p className="mt-3 whitespace-pre-line break-words border-t border-gray-100 pt-3 text-sm text-gray-600">
                  {ticket.message}
                </p>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

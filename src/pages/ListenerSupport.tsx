import { useEffect, useState } from "react";
import { AlertCircle } from "lucide-react";
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
  Open: "bg-amber-50 text-amber-600",
  "In Progress": "bg-brand-50 text-brand-700",
  Resolved: "bg-green-50 text-green-600",
};

const priorityStyles: Record<TicketPriority, string> = {
  High: "bg-red-50 text-red-500",
  Medium: "bg-amber-50 text-amber-600",
  Low: "bg-gray-100 text-gray-500",
};

const priorityOptions: TicketPriority[] = ["Low", "Medium", "High"];

export default function ListenerSupport() {
  const { token } = useAuth();
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [priority, setPriority] = useState<TicketPriority>("Medium");
  const [submitting, setSubmitting] = useState(false);
  const [supportEmail, setSupportEmail] = useState<string | null>(null);

  useEffect(() => {
    apiRequest<{ supportEmail: string }>("/support/contact")
      .then((response) => setSupportEmail(response.supportEmail))
      .catch(() => {});
  }, []);

  const loadTickets = () => {
    setLoading(true);
    apiRequest<{ data: SupportTicket[] }>("/listener/support-tickets", { token })
      .then((response) => setTickets(response.data))
      .catch((err) => setError(err instanceof ApiError ? err.message : "Could not load your tickets."))
      .finally(() => setLoading(false));
  };

  useEffect(loadTickets, [token]);

  const handleSubmit = async () => {
    if (!subject.trim() || !message.trim()) return;
    setError(null);
    setSubmitting(true);
    try {
      const { ticket } = await apiRequest<{ ticket: SupportTicket }>("/listener/support-tickets", {
        method: "POST",
        token,
        body: { subject: subject.trim(), message: message.trim(), priority },
      });
      setTickets((prev) => [ticket, ...prev]);
      setSubject("");
      setMessage("");
      setPriority("Medium");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not submit this ticket.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="mx-auto max-w-3xl p-8">
      <h1 className="text-xl font-bold text-ink-900">Help &amp; Support</h1>
      {supportEmail && (
        <p className="mt-1 text-sm text-gray-500">
          Need something faster? Email us at{" "}
          <a href={`mailto:${supportEmail}`} className="font-medium text-brand-600 hover:text-brand-700">
            {supportEmail}
          </a>
          .
        </p>
      )}

      {error && (
        <div className="mt-4 flex items-start gap-2 rounded-xl bg-red-50 px-3 py-2.5 text-sm text-red-600">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          {error}
        </div>
      )}

      <div className="mt-6">
        <p className="text-sm font-medium text-gray-500">
          Your Support Tickets
        </p>
        <div className="mt-3 divide-y divide-gray-100 rounded-2xl border border-gray-100">
          {loading && <p className="py-10 text-center text-sm text-gray-400">Loading…</p>}

          {!loading &&
            tickets.map((ticket) => (
              <div key={ticket.id} className="px-4 py-3.5">
                <div className="flex items-center justify-between gap-2">
                  <p className="font-medium text-ink-900">{ticket.subject}</p>
                  <div className="flex shrink-0 items-center gap-2">
                    <span
                      className={`rounded-full px-3 py-1 text-xs font-medium ${
                        priorityStyles[ticket.priority]
                      }`}
                    >
                      {ticket.priority}
                    </span>
                    <span
                      className={`rounded-full px-3 py-1 text-xs font-medium ${
                        statusStyles[ticket.status]
                      }`}
                    >
                      {ticket.status}
                    </span>
                  </div>
                </div>
                <p className="mt-1 break-words text-sm text-gray-500">{ticket.message}</p>
                <p className="mt-1 text-xs text-gray-400">
                  {new Date(ticket.createdAt).toLocaleString()}
                </p>
              </div>
            ))}

          {!loading && tickets.length === 0 && (
            <p className="py-10 text-center text-sm text-gray-400">
              No support tickets yet.
            </p>
          )}
        </div>
      </div>

      <div className="mt-8 rounded-2xl border border-gray-100 p-6">
        <p className="font-semibold text-ink-900">Raise a new ticket</p>
        <div className="mt-4 space-y-3">
          <div>
            <label className="text-xs font-medium text-gray-500">
              Subject
            </label>
            <input
              value={subject}
              onChange={(event) => setSubject(event.target.value)}
              placeholder="What do you need help with?"
              className="mt-1.5 w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm text-ink-900 outline-none placeholder:text-gray-400 focus:border-brand-300"
            />
          </div>
          <div>
            <label className="text-xs font-medium text-gray-500">
              Message
            </label>
            <textarea
              value={message}
              onChange={(event) => setMessage(event.target.value)}
              placeholder="Describe the issue in detail..."
              rows={4}
              className="mt-1.5 w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm text-ink-900 outline-none placeholder:text-gray-400 focus:border-brand-300"
            />
          </div>
          <div>
            <label className="text-xs font-medium text-gray-500">
              Priority
            </label>
            <select
              value={priority}
              onChange={(event) => setPriority(event.target.value as TicketPriority)}
              className="mt-1.5 w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm text-ink-900 outline-none focus:border-brand-300"
            >
              {priorityOptions.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </div>
          <button
            onClick={handleSubmit}
            disabled={submitting || !subject.trim() || !message.trim()}
            className="rounded-lg bg-brand-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {submitting ? "Submitting…" : "Submit Ticket"}
          </button>
        </div>
      </div>
    </div>
  );
}

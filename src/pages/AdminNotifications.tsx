import { useEffect, useState } from "react";
import { AlertCircle, CheckCircle2, ChevronDown, Megaphone } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { apiRequest, ApiError } from "../lib/apiClient";

type Audience = "All Users" | "All Listeners" | "Everyone";

interface Announcement {
  id: string;
  title: string;
  message: string;
  audience: Audience;
  sentAt: string;
}

const audiences: Audience[] = ["All Users", "All Listeners", "Everyone"];

const audienceStyles: Record<Audience, string> = {
  "All Users": "bg-brand-50 text-brand-700",
  "All Listeners": "bg-amber-50 text-amber-600",
  Everyone: "bg-green-50 text-green-600",
};

export default function AdminNotifications() {
  const { token } = useAuth();

  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);

  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [audience, setAudience] = useState<Audience>("Everyone");
  const [sending, setSending] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const loadAnnouncements = () => {
    setLoading(true);
    apiRequest<{ data: Announcement[] }>("/admin/announcements", { token })
      .then((response) => setAnnouncements(response.data))
      .catch((err) => setError(err instanceof ApiError ? err.message : "Could not load announcements."))
      .finally(() => setLoading(false));
  };

  useEffect(loadAnnouncements, [token]);

  const handleSend = async () => {
    if (!title.trim() || !message.trim()) return;
    setError(null);
    setSent(false);
    setSending(true);
    try {
      const { announcement } = await apiRequest<{ announcement: Announcement }>("/admin/announcements", {
        method: "POST",
        token,
        body: { title: title.trim(), message: message.trim(), audience },
      });
      setAnnouncements((prev) => [announcement, ...prev]);
      setTitle("");
      setMessage("");
      setAudience("Everyone");
      setSent(true);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not send this announcement.");
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="p-8">
      <h1 className="text-xl font-bold text-ink-900">Notifications</h1>

      {error && (
        <div className="mt-4 flex items-center gap-2 rounded-lg bg-red-50 px-3 py-2.5 text-sm text-red-600">
          <AlertCircle className="h-4 w-4 shrink-0" />
          {error}
        </div>
      )}

      {sent && (
        <div className="mt-4 flex items-center gap-2 rounded-lg bg-green-50 px-3 py-2.5 text-sm text-green-700">
          <CheckCircle2 className="h-4 w-4 shrink-0" />
          Announcement sent.
        </div>
      )}

      <div className="mt-6 rounded-2xl border border-gray-100 bg-white p-5">
        <p className="font-semibold text-ink-900">Send Announcement</p>
        <div className="mt-4 space-y-3">
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Title"
            className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm text-ink-900 placeholder:text-gray-400 focus:border-brand-400 focus:outline-none"
          />
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Message"
            rows={3}
            className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm text-ink-900 placeholder:text-gray-400 focus:border-brand-400 focus:outline-none"
          />
          <div className="flex items-center gap-3">
            <select
              value={audience}
              onChange={(e) => setAudience(e.target.value as Audience)}
              className="rounded-xl border border-gray-200 px-4 py-2.5 text-sm text-ink-900 focus:border-brand-400 focus:outline-none"
            >
              {audiences.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
            <button
              onClick={handleSend}
              disabled={sending || !title.trim() || !message.trim()}
              className="flex items-center gap-2 rounded-xl bg-brand-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Megaphone className="h-4 w-4" />
              {sending ? "Sending…" : "Send Announcement"}
            </button>
          </div>
        </div>
      </div>

      <div className="mt-6 space-y-3">
        {loading && <p className="text-sm text-gray-400">Loading announcements…</p>}

        {!loading && announcements.length === 0 && (
          <p className="rounded-2xl border border-gray-100 bg-white p-5 text-center text-sm text-gray-400">
            No announcements sent yet.
          </p>
        )}

        {announcements.map((announcement) => {
          const expanded = expandedId === announcement.id;
          return (
            <div
              key={announcement.id}
              className="rounded-2xl border border-gray-100 bg-white p-5"
            >
              <button
                onClick={() => setExpandedId(expanded ? null : announcement.id)}
                className="flex w-full items-center gap-3 text-left"
              >
                <ChevronDown
                  className={`h-4 w-4 shrink-0 text-gray-400 transition-transform ${expanded ? "rotate-180" : ""}`}
                />
                <p className={`min-w-0 flex-1 font-semibold text-ink-900 ${expanded ? "" : "truncate"}`}>
                  {announcement.title}
                </p>
                <span
                  className={`shrink-0 rounded-full px-3 py-1 text-xs font-medium ${audienceStyles[announcement.audience]}`}
                >
                  {announcement.audience}
                </span>
              </button>
              <p
                className={`mt-2 text-sm text-gray-600 ${expanded ? "whitespace-pre-line break-words" : "truncate"}`}
              >
                {announcement.message}
              </p>
              <p className="mt-3 text-xs text-gray-400">
                {new Date(announcement.sentAt).toLocaleString()}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
}

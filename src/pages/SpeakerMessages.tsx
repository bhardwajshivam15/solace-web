import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { MessageCircle, AlertCircle } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useAppData } from "../context/AppDataContext";
import { apiRequest, resolveAssetUrl, ApiError } from "../lib/apiClient";

interface ConversationSummary {
  listenerId: string;
  listenerName: string;
  listenerAvatar: string | null;
  listenerOnline: boolean;
  lastMessage: string;
  lastMessageSender: "speaker" | "listener" | "";
  lastMessageAt: string;
}

function initialsAvatar(name: string): string {
  const initial = name.trim().charAt(0).toUpperCase() || "?";
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="150" height="150"><rect width="150" height="150" fill="#ede9fe"/><text x="50%" y="50%" dy=".35em" text-anchor="middle" font-family="sans-serif" font-size="60" fill="#6d28d9">${initial}</text></svg>`;
  return `data:image/svg+xml,${encodeURIComponent(svg)}`;
}

export default function SpeakerMessages() {
  const { token } = useAuth();
  const { listenerPresence } = useAppData();
  const [threads, setThreads] = useState<ConversationSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    apiRequest<{ data: ConversationSummary[] }>("/speaker/conversations", { token })
      .then((response) => setThreads(response.data))
      .catch((err) => setError(err instanceof ApiError ? err.message : "Could not load your messages."))
      .finally(() => setLoading(false));
  }, [token]);

  return (
    <div className="mx-auto max-w-3xl p-8">
      <h1 className="text-xl font-bold text-ink-900">Messages</h1>

      {error && (
        <div className="mt-4 flex items-start gap-2 rounded-xl bg-red-50 px-3 py-2.5 text-sm text-red-600">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          {error}
        </div>
      )}

      <div className="mt-5 divide-y divide-gray-100 rounded-2xl border border-gray-100">
        {loading && <p className="py-14 text-center text-sm text-gray-400">Loading…</p>}

        {!loading &&
          threads.map((thread) => (
            <Link
              key={thread.listenerId}
              to={`/app/find-listeners?listener=${thread.listenerId}`}
              className="flex items-center gap-3 px-4 py-3.5 hover:bg-gray-50"
            >
              <div className="relative shrink-0">
                <img
                  src={resolveAssetUrl(thread.listenerAvatar) ?? initialsAvatar(thread.listenerName)}
                  alt={thread.listenerName}
                  className="h-11 w-11 rounded-full bg-brand-100 object-cover"
                />
                <span
                  className={`absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-white ${
                    (listenerPresence[thread.listenerId] ?? thread.listenerOnline) ? "bg-green-500" : "bg-gray-300"
                  }`}
                />
              </div>

              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-2">
                  <p className="font-semibold text-ink-900">{thread.listenerName}</p>
                  <p className="shrink-0 text-xs text-gray-400">
                    {new Date(thread.lastMessageAt).toLocaleTimeString("en-IN", {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                </div>
                <p className="truncate text-sm text-gray-500">
                  {thread.lastMessageSender === "speaker" ? "You: " : ""}
                  {thread.lastMessage}
                </p>
              </div>
            </Link>
          ))}

        {!loading && threads.length === 0 && (
          <div className="flex flex-col items-center gap-3 py-14 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-50">
              <MessageCircle className="h-7 w-7 text-brand-600" />
            </div>
            <p className="font-semibold text-ink-900">No messages yet</p>
            <p className="max-w-xs text-sm text-gray-400">
              Start a conversation with a listener and it will show up here.
            </p>
            <Link
              to="/app/find-listeners"
              className="mt-2 rounded-lg bg-brand-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-brand-700"
            >
              Find a Listener
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}

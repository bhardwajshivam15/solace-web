import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { MessageCircle, AlertCircle } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useAppData } from "../context/AppDataContext";
import { apiRequest, resolveAssetUrl, ApiError } from "../lib/apiClient";
import { ensureKeysRegistered, getSharedKey, decryptText } from "../lib/e2ee";

interface RawConversationSummary {
  listenerId: string;
  listenerName: string;
  listenerAvatar: string | null;
  listenerOnline: boolean;
  lastMessageCiphertext: string | null;
  lastMessageIv: string | null;
  lastMessageSender: "speaker" | "listener" | "";
  lastMessageAt: string;
}

interface ConversationSummary extends Omit<RawConversationSummary, "lastMessageCiphertext" | "lastMessageIv"> {
  lastMessage: string;
}

function initialsAvatar(name: string): string {
  const initial = name.trim().charAt(0).toUpperCase() || "?";
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="150" height="150"><rect width="150" height="150" fill="#ede9fe"/><text x="50%" y="50%" dy=".35em" text-anchor="middle" font-family="sans-serif" font-size="60" fill="#6d28d9">${initial}</text></svg>`;
  return `data:image/svg+xml,${encodeURIComponent(svg)}`;
}

export default function SpeakerMessages() {
  const { user, token } = useAuth();
  const { listenerPresence, liveThreadUpdates } = useAppData();
  const [threads, setThreads] = useState<ConversationSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    setLoading(true);
    apiRequest<{ data: RawConversationSummary[] }>("/speaker/conversations", { token })
      .then(async (response) => {
        await ensureKeysRegistered(user.id, token);
        const decorated = await Promise.all(
          response.data.map(async (raw): Promise<ConversationSummary> => {
            let lastMessage = "";
            if (raw.lastMessageCiphertext && raw.lastMessageIv) {
              const sharedKey = await getSharedKey(raw.listenerId, token);
              lastMessage = sharedKey
                ? await decryptText(sharedKey, raw.lastMessageCiphertext, raw.lastMessageIv)
                : "[Encrypted message]";
            }
            return { ...raw, lastMessage };
          }),
        );
        setThreads(decorated);
      })
      .catch((err) => setError(err instanceof ApiError ? err.message : "Could not load your messages."))
      .finally(() => setLoading(false));
  }, [user, token]);

  // Live WS updates (real-time only, never persisted) override the initial
  // REST-fetched preview/timestamp and bubble the conversation to the top —
  // same "most recently active first, bold until opened" behavior as
  // Instagram/Messenger's DM list.
  const enrichedThreads = threads
    .map((thread) => {
      const live = liveThreadUpdates[thread.listenerId];
      if (!live) return { ...thread, unreadCount: 0 };
      return {
        ...thread,
        lastMessage: live.preview,
        lastMessageAt: live.at,
        lastMessageSender: "listener" as const,
        unreadCount: live.unreadCount,
      };
    })
    .sort((a, b) => new Date(b.lastMessageAt).getTime() - new Date(a.lastMessageAt).getTime());

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
          enrichedThreads.map((thread) => (
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
                  <span className="flex shrink-0 items-center gap-1.5">
                    {thread.unreadCount > 0 && (
                      <span className="flex h-4 min-w-[16px] items-center justify-center rounded-full bg-brand-600 px-1 text-[10px] font-semibold text-white">
                        {thread.unreadCount > 3 ? "3+" : thread.unreadCount}
                      </span>
                    )}
                    <p className="text-xs text-gray-400">
                      {new Date(thread.lastMessageAt).toLocaleTimeString("en-IN", {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                  </span>
                </div>
                <p className={`truncate text-sm ${thread.unreadCount > 0 ? "font-semibold text-ink-900" : "text-gray-500"}`}>
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

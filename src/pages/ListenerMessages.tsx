import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { AlertCircle, MessageCircle, UserRound } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useAppData } from "../context/AppDataContext";
import { apiRequest, ApiError } from "../lib/apiClient";
import { ensureKeysRegistered, getSharedKey, decryptText } from "../lib/e2ee";
import ListenerChatPanel from "../components/ListenerChatPanel";

interface RawConversationSummary {
  speakerId: string;
  speakerLabel: string;
  lastMessageCiphertext: string | null;
  lastMessageIv: string | null;
  lastMessageSender: "speaker" | "listener" | "";
  lastMessageAt: string;
}

interface ConversationSummary extends Omit<RawConversationSummary, "lastMessageCiphertext" | "lastMessageIv"> {
  lastMessage: string;
}

export default function ListenerMessages() {
  const { user, token } = useAuth();
  const { liveThreadUpdates } = useAppData();
  const [searchParams] = useSearchParams();

  const [threads, setThreads] = useState<ConversationSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(searchParams.get("speaker"));

  // useState's initial value only runs once — without this, clicking a
  // "new message" toast while already on this page (for a different or no
  // thread) wouldn't actually switch the open conversation.
  useEffect(() => {
    const speakerParam = searchParams.get("speaker");
    if (speakerParam) setSelectedId(speakerParam);
  }, [searchParams]);

  useEffect(() => {
    if (!user) return;
    setLoading(true);
    apiRequest<{ data: RawConversationSummary[] }>("/listener/conversations", { token })
      .then(async (response) => {
        await ensureKeysRegistered(user.id, token);
        const decorated = await Promise.all(
          response.data.map(async (raw): Promise<ConversationSummary> => {
            let lastMessage = "";
            if (raw.lastMessageCiphertext && raw.lastMessageIv) {
              const sharedKey = await getSharedKey(raw.speakerId, token);
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

  const selectedThread = threads.find((t) => t.speakerId === selectedId) ?? null;

  // Live WS updates (real-time only, never persisted) override the initial
  // REST-fetched preview/timestamp and bubble the conversation to the top —
  // same "most recently active first, bold until opened" behavior as
  // Instagram/Messenger's DM list.
  const enrichedThreads = threads
    .map((thread) => {
      const live = liveThreadUpdates[thread.speakerId];
      if (!live) return { ...thread, unreadCount: 0 };
      return {
        ...thread,
        lastMessage: live.preview,
        lastMessageAt: live.at,
        lastMessageSender: "speaker" as const,
        unreadCount: live.unreadCount,
      };
    })
    .sort((a, b) => new Date(b.lastMessageAt).getTime() - new Date(a.lastMessageAt).getTime());

  return (
    <div className="flex h-full">
      <div className="flex w-full max-w-sm shrink-0 flex-col border-r border-gray-100">
        <div className="border-b border-gray-100 p-6">
          <h1 className="text-xl font-bold text-ink-900">Messages</h1>
        </div>

        {error && (
          <div className="mx-4 mt-4 flex items-start gap-2 rounded-xl bg-red-50 px-3 py-2.5 text-sm text-red-600">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
            {error}
          </div>
        )}

        <div className="flex-1 divide-y divide-gray-100 overflow-y-auto">
          {loading && <p className="py-14 text-center text-sm text-gray-400">Loading…</p>}

          {!loading &&
            enrichedThreads.map((thread) => (
              <button
                key={thread.speakerId}
                onClick={() => setSelectedId(thread.speakerId)}
                className={`flex w-full items-center gap-3 px-4 py-3.5 text-left hover:bg-gray-50 ${
                  thread.speakerId === selectedId ? "bg-brand-50/60" : ""
                }`}
              >
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-brand-100 text-brand-700">
                  <UserRound className="h-5 w-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <p className="truncate font-semibold text-ink-900">{thread.speakerLabel}</p>
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
                    {thread.lastMessageSender === "listener" ? "You: " : ""}
                    {thread.lastMessage}
                  </p>
                </div>
              </button>
            ))}

          {!loading && threads.length === 0 && (
            <div className="flex flex-col items-center gap-3 py-14 text-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-50">
                <MessageCircle className="h-7 w-7 text-brand-600" />
              </div>
              <p className="font-semibold text-ink-900">No messages yet</p>
              <p className="max-w-xs text-sm text-gray-400">
                Conversations with speakers will show up here.
              </p>
            </div>
          )}
        </div>
      </div>

      <div className="min-w-0 flex-1">
        {selectedThread ? (
          <ListenerChatPanel
            speakerId={selectedThread.speakerId}
            speakerLabel={selectedThread.speakerLabel}
            onBack={() => setSelectedId(null)}
          />
        ) : (
          <div className="flex h-full flex-col items-center justify-center gap-3 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-brand-50">
              <MessageCircle className="h-8 w-8 text-brand-600" />
            </div>
            <h2 className="text-lg font-semibold text-ink-900">
              Pick a conversation to view it
            </h2>
            <p className="max-w-xs text-sm text-gray-500">
              Every speaker here is anonymous — reply whenever you're ready.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

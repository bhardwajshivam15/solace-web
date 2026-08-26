import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { AlertCircle, MessageCircle, UserRound } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { apiRequest, ApiError } from "../lib/apiClient";
import ListenerChatPanel from "../components/ListenerChatPanel";

interface ConversationSummary {
  speakerId: string;
  speakerLabel: string;
  lastMessage: string;
  lastMessageSender: "speaker" | "listener" | "";
  lastMessageAt: string;
}

export default function ListenerMessages() {
  const { token } = useAuth();
  const [searchParams] = useSearchParams();

  const [threads, setThreads] = useState<ConversationSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(searchParams.get("speaker"));

  useEffect(() => {
    setLoading(true);
    apiRequest<{ data: ConversationSummary[] }>("/listener/conversations", { token })
      .then((response) => setThreads(response.data))
      .catch((err) => setError(err instanceof ApiError ? err.message : "Could not load your messages."))
      .finally(() => setLoading(false));
  }, [token]);

  const selectedThread = threads.find((t) => t.speakerId === selectedId) ?? null;

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
            threads.map((thread) => (
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
                    <p className="shrink-0 text-xs text-gray-400">
                      {new Date(thread.lastMessageAt).toLocaleTimeString("en-IN", {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                  </div>
                  <p className="truncate text-sm text-gray-500">
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

      <div className="flex-1">
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

import { useEffect, useRef, useState, type FormEvent } from "react";
import { ChevronLeft, Lock, Send, Smile, UserRound, AlertTriangle, Loader2, Check, X } from "lucide-react";
import type { LiveSession } from "../types";
import { useAppData } from "../context/AppDataContext";
import { ApiError } from "../lib/apiClient";
import MessageStatusTicks from "./MessageStatusTicks";
import LiveSessionTimer from "./LiveSessionTimer";

const QUICK_EMOJIS = ["😊", "🙂", "❤️", "👍", "😢", "🙏"];

function ListenerSessionControlBar({
  speakerLabel,
  session,
  busy,
  error,
  onAccept,
  onDecline,
  onEnd,
}: {
  speakerLabel: string;
  session: LiveSession | undefined;
  busy: boolean;
  error: string | null;
  onAccept: () => void;
  onDecline: () => void;
  onEnd: () => void;
}) {
  if (!session) return null;

  if (session.status === "REQUESTED") {
    return (
      <div className="flex flex-col items-end gap-1.5">
        <p className="text-xs text-gray-500">{speakerLabel} wants to talk to you.</p>
        <div className="flex items-center gap-2">
          <button
            onClick={onDecline}
            disabled={busy}
            className="flex items-center gap-1 rounded-lg border border-gray-200 px-3 py-1.5 text-sm font-semibold text-gray-500 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <X className="h-4 w-4" />
            Decline
          </button>
          <button
            onClick={onAccept}
            disabled={busy}
            className="flex items-center gap-1 rounded-lg bg-brand-600 px-3 py-1.5 text-sm font-semibold text-white hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <Check className="h-4 w-4" />
            Accept
          </button>
        </div>
        {error && <p className="max-w-56 text-right text-xs text-red-500">{error}</p>}
      </div>
    );
  }

  if (session.status === "ACCEPTED") {
    return (
      <div className="flex items-center gap-2 text-sm text-gray-500">
        <Loader2 className="h-4 w-4 animate-spin text-brand-500" />
        Waiting for speaker to join…
      </div>
    );
  }

  if (session.status === "CONNECTING") {
    return (
      <div className="flex items-center gap-2 text-sm text-gray-500">
        <Loader2 className="h-4 w-4 animate-spin text-brand-500" />
        Connecting…
      </div>
    );
  }

  if (session.status === "ACTIVE" || session.status === "DISCONNECTED") {
    return (
      <div className="flex items-center gap-4">
        {session.status === "DISCONNECTED" ? (
          <div className="flex items-center gap-1.5 text-sm text-amber-600">
            <AlertTriangle className="h-4 w-4" />
            Connection lost — waiting to reconnect…
          </div>
        ) : (
          session.startedAt && (
            <div className="text-right">
              <p className="text-lg font-semibold text-green-600">
                <LiveSessionTimer startedAt={session.startedAt} pausedSeconds={session.pausedSeconds} />
              </p>
              <p className="text-[11px] text-gray-400">Session active</p>
            </div>
          )
        )}
        <button
          onClick={onEnd}
          disabled={busy}
          className="rounded-lg border border-red-200 px-4 py-2 text-sm font-semibold text-red-500 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60"
        >
          End Session
        </button>
      </div>
    );
  }

  if (session.status === "COMPLETED") {
    const minutes = Math.floor((session.durationSeconds ?? 0) / 60);
    const seconds = (session.durationSeconds ?? 0) % 60;
    return (
      <div className="text-right">
        <p className="text-sm font-semibold text-ink-900">Session completed</p>
        <p className="text-xs text-gray-400">
          {String(minutes).padStart(2, "0")}:{String(seconds).padStart(2, "0")}
        </p>
        <p className="text-sm font-semibold text-green-600">
          Earnings ₹{session.listenerAmount?.toFixed(2)}
        </p>
      </div>
    );
  }

  if (session.status === "REJECTED") {
    return <p className="text-xs text-gray-400">You declined this request.</p>;
  }

  if (session.status === "EXPIRED") {
    return <p className="text-xs text-gray-400">The request expired.</p>;
  }

  return null;
}

export default function ListenerChatPanel({
  speakerId,
  speakerLabel,
  onBack,
}: {
  speakerId: string;
  speakerLabel: string;
  onBack: () => void;
}) {
  const {
    conversations,
    loadConversation,
    setActiveThread,
    sendMessage,
    liveSessions,
    acceptSessionRequest,
    rejectSessionRequest,
    endLiveSession,
    loadCurrentSession,
  } = useAppData();
  const [draft, setDraft] = useState("");
  const [showEmojis, setShowEmojis] = useState(false);
  const [sessionBusy, setSessionBusy] = useState(false);
  const [sessionError, setSessionError] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  const messages = conversations[speakerId] ?? [];
  const liveSession = liveSessions[speakerId];

  useEffect(() => {
    loadConversation(speakerId);
    setActiveThread(speakerId);
    loadCurrentSession(speakerId).catch(() => {});
    return () => setActiveThread(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [speakerId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length]);

  const handleSend = (event: FormEvent) => {
    event.preventDefault();
    if (!draft.trim()) return;
    sendMessage(speakerId, draft);
    setDraft("");
    setShowEmojis(false);
  };

  const handleAccept = async () => {
    if (!liveSession) return;
    setSessionError(null);
    setSessionBusy(true);
    try {
      await acceptSessionRequest(liveSession.id);
    } catch (err) {
      setSessionError(err instanceof ApiError ? err.message : "Could not accept the request.");
    } finally {
      setSessionBusy(false);
    }
  };

  const handleDecline = async () => {
    if (!liveSession) return;
    setSessionBusy(true);
    try {
      await rejectSessionRequest(liveSession.id);
    } catch (err) {
      setSessionError(err instanceof ApiError ? err.message : "Could not decline the request.");
    } finally {
      setSessionBusy(false);
    }
  };

  const handleEnd = async () => {
    if (!liveSession) return;
    setSessionBusy(true);
    try {
      await endLiveSession(liveSession.id, speakerId);
    } catch (err) {
      setSessionError(err instanceof ApiError ? err.message : "Could not end the session.");
    } finally {
      setSessionBusy(false);
    }
  };

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4">
        <button
          onClick={onBack}
          className="flex items-center gap-1 text-sm font-medium text-gray-500 hover:text-ink-900"
        >
          <ChevronLeft className="h-4 w-4" />
          Back to Messages
        </button>
      </div>

      <div className="flex items-start justify-between gap-3 border-b border-gray-100 px-6 py-4">
        <div className="flex min-w-0 items-center gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-brand-100 text-brand-700">
            <UserRound className="h-5 w-5" />
          </div>
          <div className="min-w-0">
            <p className="truncate font-semibold text-ink-900">{speakerLabel}</p>
            <p className="truncate text-xs text-gray-400">Anonymous — this person's identity is never shared</p>
          </div>
        </div>

        <div className="shrink-0">
          <ListenerSessionControlBar
            speakerLabel={speakerLabel}
            session={liveSession}
            busy={sessionBusy}
            error={sessionError}
            onAccept={handleAccept}
            onDecline={handleDecline}
            onEnd={handleEnd}
          />
        </div>
      </div>

      <div className="flex-1 space-y-5 overflow-y-auto px-6 py-6">
        <div className="flex justify-center">
          <span className="rounded-full bg-gray-100 px-3 py-1 text-[11px] text-gray-400">
            Today
          </span>
        </div>

        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${message.sender === "listener" ? "justify-end" : "justify-start"}`}
          >
            <div
              className={`flex items-end gap-2 ${message.sender === "listener" ? "flex-row-reverse" : ""}`}
            >
              {message.sender === "speaker" && (
                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-brand-100 text-brand-700">
                  <UserRound className="h-3.5 w-3.5" />
                </div>
              )}
              <div
                className={`max-w-sm rounded-2xl px-4 py-3 text-sm ${
                  message.sender === "listener"
                    ? "rounded-br-sm bg-brand-600 text-white"
                    : "rounded-bl-sm bg-gray-100 text-ink-900"
                }`}
              >
                <p>{message.text}</p>
                <div
                  className={`mt-1 flex items-center gap-1 text-[10px] ${
                    message.sender === "listener" ? "justify-end text-brand-100" : "text-gray-400"
                  }`}
                >
                  {message.time}
                  {message.sender === "listener" && <MessageStatusTicks status={message.status} />}
                </div>
              </div>
            </div>
          </div>
        ))}

        {messages.length === 0 && (
          <p className="py-10 text-center text-sm text-gray-400">
            No messages yet — say hello when you're ready.
          </p>
        )}
        <div ref={bottomRef} />
      </div>

      {liveSession?.status === "ACTIVE" ? (
        <form onSubmit={handleSend} className="border-t border-gray-100 px-6 py-4">
          <div className="relative flex items-center gap-3 rounded-full border border-gray-200 px-4 py-2.5">
            {showEmojis && (
              <div className="absolute bottom-12 left-0 flex gap-1 rounded-xl border border-gray-100 bg-white p-2 shadow-soft">
                {QUICK_EMOJIS.map((emoji) => (
                  <button
                    key={emoji}
                    type="button"
                    onClick={() => setDraft((prev) => prev + emoji)}
                    className="rounded-lg p-1 text-lg hover:bg-gray-50"
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            )}
            <input
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
              placeholder="Type a message..."
              className="flex-1 bg-transparent text-sm text-ink-900 outline-none placeholder:text-gray-400"
            />
            <button type="button" onClick={() => setShowEmojis((prev) => !prev)}>
              <Smile className="h-5 w-5 text-gray-400 hover:text-brand-600" />
            </button>
            <button
              type="submit"
              className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-600 text-white hover:bg-brand-700"
            >
              <Send className="h-4 w-4" />
            </button>
          </div>
          <p className="mt-2 flex items-center justify-center gap-1 text-[11px] text-gray-400">
            <Lock className="h-3 w-3" />
            This conversation is private and anonymous
          </p>
        </form>
      ) : (
        <div className="border-t border-gray-100 px-6 py-4">
          <div className="flex items-center gap-3 rounded-full border border-gray-100 bg-gray-50 px-4 py-2.5 text-sm text-gray-400">
            <Lock className="h-4 w-4 shrink-0" />
            {liveSession?.status === "DISCONNECTED"
              ? "Messaging is paused while the connection reconnects."
              : "Accept a session request to send messages."}
          </div>
        </div>
      )}
    </div>
  );
}
